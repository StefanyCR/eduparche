import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Prisma,
  ContentStatus,
  EnrollmentStatus,
  Role,
  UserStatus,
} from '../../generated/prisma';
import { buildPaginationMeta } from '../common/dto/pagination-query.dto';
import type { PaginatedResult } from '../common/interceptors/response-envelope.interceptor';
import { QueryCoursesDto } from './dto/query-courses.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { ReplaceCourseDto, UpdateCourseDto } from './dto/update-course.dto';
import {
  adminCourseSelect,
  publicCourseDetailSelect,
  publicCourseListSelect,
} from './course.selects';

/**
 * Toda la lógica de negocio de cursos.
 *
 * Regla de separación de capas que sigue este módulo:
 *   Controller → traduce HTTP (rutas, códigos, headers). No sabe de Prisma.
 *   Service    → reglas de negocio y acceso a datos. No sabe de HTTP.
 *   DTO        → valida la forma de lo que entra.
 *   Selects    → define la forma de lo que sale.
 */
@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================
  // CATÁLOGO PÚBLICO (lectura)
  // ==========================================================

  /**
   * Listado paginado y filtrable del catálogo.
   *
   * Devuelve SOLO cursos con status ACTIVE. Los DRAFT son material sin terminar
   * y los DISABLED se retiraron a propósito: publicar cualquiera de los dos
   * sería mostrarle a un aliado cursos que no puede vender.
   *
   * `studentId` es opcional y marca la diferencia entre los dos consumidores:
   *   - sin id (API pública para aliados) → catálogo a secas
   *   - con id (estudiante logueado)      → cada curso trae `isEnrolled`,
   *     para que la tarjeta muestre "Continuar" en vez de "Inscribirse"
   */
  async findPublicCatalog(
    query: QueryCoursesDto,
    studentId?: string,
  ): Promise<PaginatedResult<unknown>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    // El filtro se arma por partes: cada parámetro presente agrega una
    // condición. Los ausentes simplemente no aparecen en el WHERE.
    const where: Prisma.CourseWhereInput = {
      status: ContentStatus.ACTIVE,
    };

    if (query.q) {
      // `mode: 'insensitive'` hace la búsqueda sin distinguir mayúsculas.
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    if (query.level) where.level = query.level;
    if (query.categorySlug) where.category = { slug: query.categorySlug };
    if (query.skillSlug) {
      where.skills = { some: { skill: { slug: query.skillSlug } } };
    }

    // $transaction ejecuta el conteo y la página en UN SOLO viaje a la base.
    const [total, courses] = await this.prisma.$transaction([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
        select: publicCourseListSelect,
        orderBy: { [query.sortBy ?? 'createdAt']: query.order ?? 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    // Una sola consulta extra resuelve el "¿ya estoy inscrito?" de TODA la
    // página. La alternativa —preguntar curso por curso— dispara una consulta
    // por tarjeta: es el problema N+1, y con 20 cursos son 21 viajes a la base
    // en vez de 3.
    const myEnrollments = await this.findEnrollmentsForCourses(
      studentId,
      courses.map((course) => course.id),
    );

    return {
      items: courses.map((course) => {
        const summary = this.toCourseSummary(course);

        // Sin estudiante (API de aliados) la respuesta queda tal cual:
        // `isEnrolled` no tendría sentido si no hay nadie a quien referirse.
        if (!studentId) return summary;

        const completedLessons = myEnrollments.get(course.id);
        const isEnrolled = completedLessons !== undefined;

        return {
          ...summary,
          isEnrolled,
          completedLessons: completedLessons ?? 0,
          progress:
            isEnrolled && summary.totalLessons > 0
              ? Math.round((completedLessons / summary.totalLessons) * 100)
              : 0,
        };
      }),
      meta: buildPaginationMeta(total, page, pageSize),
    };
  }

  /**
   * Para los cursos indicados, devuelve cuántas lecciones lleva completadas
   * el estudiante. Un curso ausente del mapa significa "no inscrito".
   *
   * Se resuelve en UNA consulta para toda la página, no una por curso.
   */
  private async findEnrollmentsForCourses(
    studentId: string | undefined,
    courseIds: string[],
  ): Promise<Map<string, number>> {
    if (!studentId || courseIds.length === 0) return new Map();

    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId, courseId: { in: courseIds } },
      select: {
        courseId: true,
        lessonProgress: { where: { status: 'COMPLETED' }, select: { id: true } },
      },
    });

    return new Map(
      enrollments.map((enrollment) => [
        enrollment.courseId,
        enrollment.lessonProgress.length,
      ]),
    );
  }

  /**
   * Detalle de un curso por slug, con su temario.
   *
   * Se busca por SLUG y no por id porque el slug es el identificador público
   * y legible: `/courses/java-basico` se entiende y se puede compartir.
   */
  async findPublicBySlug(slug: string) {
    const course = await this.prisma.course.findFirst({
      where: { slug, status: ContentStatus.ACTIVE },
      select: publicCourseDetailSelect,
    });

    // findFirst devuelve null cuando no hay coincidencia.
    if (!course) {
      throw new NotFoundException(`No existe un curso publicado con slug "${slug}"`);
    }

    return this.toCourseDetail(course);
  }

  /** Categorías con su conteo de cursos publicados. */
  async findPublicCategories() {
    const categories = await this.prisma.courseCategory.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { courses: true } },
      },
    });

    return categories.map(({ _count, ...category }) => ({
      ...category,
      courseCount: _count.courses,
    }));
  }

  /**
   * Métricas AGREGADAS de la plataforma.
   *
   * Este endpoint es el ejemplo más claro de dato comercializable: Le muestra
   * el tamaño de la plataforma a un aliado sin exponer información sensible de
   * ningún estudiante ni curso. Los totales son agregados y anónimos.
   */
  async getPublicStats() {
    const [totalCourses, totalStudents, totalEnrollments, completedEnrollments, byLevel] =
      await this.prisma.$transaction([
        this.prisma.course.count({ where: { status: ContentStatus.ACTIVE } }),
        this.prisma.user.count({
          where: { role: Role.STUDENT, status: UserStatus.ACTIVE },
        }),
        this.prisma.enrollment.count(),
        this.prisma.enrollment.count({
          where: { status: EnrollmentStatus.COMPLETED },
        }),
        // groupBy agrupa en la BASE DE DATOS y devuelve solo los totales.
        this.prisma.course.groupBy({
          by: ['level'],
          where: { status: ContentStatus.ACTIVE },
          orderBy: { level: 'asc' },
          _count: true,
        }),
      ]);

    return {
      totalCourses,
      totalStudents,
      totalEnrollments,
      completedEnrollments,
      // Se redondea a 2 decimales; sin el guard, 0/0 daría NaN, que no es
      // JSON válido y llegaría al cliente como null.
      completionRate:
        totalEnrollments > 0
          ? Number(((completedEnrollments / totalEnrollments) * 100).toFixed(2))
          : 0,
      coursesByLevel: byLevel.map((row) => ({
        level: row.level,
        count: row._count,
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  // NOTA: la creación de inscripciones NO vive acá.
  // Está en EnrollmentsService, porque hay dos caminos hacia esa misma acción
  // (el estudiante desde la web y un aliado por la API) y las reglas tienen
  // que ser idénticas en ambos. Un solo servicio, dos puertas de entrada.

  // ==========================================================
  // CRUD INTERNO (panel de administración, protegido con JWT)
  // ==========================================================

  async findAllForAdmin(query: QueryCoursesDto): Promise<PaginatedResult<unknown>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    // A diferencia del catálogo público, acá NO se filtra por status:
    // el admin necesita ver también los borradores y los deshabilitados.
    const where: Prisma.CourseWhereInput = {};

    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    if (query.level) where.level = query.level;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
        select: adminCourseSelect,
        orderBy: { [query.sortBy ?? 'createdAt']: query.order ?? 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { items, meta: buildPaginationMeta(total, page, pageSize) };
  }

  async findOneForAdmin(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      select: adminCourseSelect,
    });

    if (!course) throw new NotFoundException('Curso no encontrado');

    return course;
  }

  /** POST — crea el curso. Responde 201 con el recurso creado. */
  async create(dto: CreateCourseDto, createdById: string) {
    const slugTaken = await this.prisma.course.findUnique({
      where: { slug: dto.slug },
      select: { id: true },
    });

    if (slugTaken) {
      throw new ConflictException(`Ya existe un curso con el slug "${dto.slug}"`);
    }

    const category = await this.prisma.courseCategory.findUnique({
      where: { id: dto.categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new UnprocessableEntityException('La categoría indicada no existe');
    }

    return this.prisma.course.create({
      data: { ...dto, createdById },
      select: adminCourseSelect,
    });
  }

  /**
   * PUT — reemplazo completo.
   *
   * Los campos opcionales que el cliente NO envía se ponen explícitamente en
   * null. Eso es lo que diferencia a PUT de PATCH y lo que lo hace idempotente:
   * el resultado depende solo del cuerpo enviado, no del estado previo.
   */
  async replace(id: string, dto: ReplaceCourseDto) {
    await this.assertExists(id);

    return this.prisma.course.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        level: dto.level,
        categoryId: dto.categoryId,
        status: dto.status ?? ContentStatus.DRAFT,
        thumbnail: dto.thumbnail ?? null,
        startDate: dto.startDate ?? null,
        endDate: dto.endDate ?? null,
        onlineHours: dto.onlineHours ?? null,
        autonomousHours: dto.autonomousHours ?? null,
        prerequisiteCourseId: dto.prerequisiteCourseId ?? null,
      },
      select: adminCourseSelect,
    });
  }

  /** PATCH — actualiza únicamente las claves presentes en el cuerpo. */
  async update(id: string, dto: UpdateCourseDto) {
    await this.assertExists(id);

    return this.prisma.course.update({
      where: { id },
      data: dto,
      select: adminCourseSelect,
    });
  }

  // ==========================================================
  // AUXILIARES PRIVADOS
  // ==========================================================

  private async assertExists(id: string): Promise<void> {
    const exists = await this.prisma.course.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) throw new NotFoundException('Curso no encontrado');
  }

  /**
   * Aplana la respuesta de Prisma a la forma pública del JSON.
   *
   * Prisma devuelve las relaciones M:M anidadas (`skills[].skill.name`) y los
   * conteos bajo `_count`. Ninguna de las dos formas debe salir tal cual: son
   * detalles de CÓMO guardamos los datos, no de qué ofrece la API. Aplanarlas
   * acá permite reorganizar las tablas mañana sin romper a quien nos consume.
   *
   * Hay dos versiones porque hay dos formas distintas de curso:
   *   summary → para las tarjetas del catálogo (sin temario)
   *   detail  → para la ficha completa (con temario)
   */
  private toCourseSummary(course: any) {
    const { _count, skills, modules, ...rest } = course;

    return {
      ...rest,
      skills: (skills ?? []).map((entry: any) => entry.skill),
      enrolledCount: _count?.enrollments ?? 0,
      // `modules` acá solo traía los conteos, así que se consume y se descarta:
      // afuera sale el número, no la estructura.
      totalLessons: this.countLessons(modules),
    };
  }

  private toCourseDetail(course: any) {
    const { _count, skills, modules, ...rest } = course;

    return {
      ...rest,
      skills: (skills ?? []).map((entry: any) => entry.skill),
      enrolledCount: _count?.enrollments ?? 0,
      totalLessons: this.countLessons(modules),
      modules: modules ?? [],
    };
  }

  /**
   * Suma las lecciones de todos los módulos.
   *
   * Acepta las dos formas que devuelve Prisma según el select usado:
   * el del listado trae `_count.lessons` (solo el número) y el del detalle
   * trae el arreglo `lessons` completo.
   */
  private countLessons(modules: any[] | undefined): number {
    return (modules ?? []).reduce((total: number, module: any) => {
      if (Array.isArray(module.lessons)) return total + module.lessons.length;
      return total + (module._count?.lessons ?? 0);
    }, 0);
  }
}
