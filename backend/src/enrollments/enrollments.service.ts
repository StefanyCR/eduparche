import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ContentStatus,
  EnrollmentStatus,
  UserStatus,
} from '../../generated/prisma';
import { CreatePublicEnrollmentDto } from '../courses/dto/create-public-enrollment.dto';

/**
 * Toda la lógica de inscripción, en un solo lugar.
 *
 * Hay DOS puertas de entrada distintas hacia la misma acción:
 *   1. El estudiante se inscribe solo desde la web  → enrollSelf()
 *   2. Un sistema aliado lo inscribe por la API     → enrollByPartner()
 *
 * Las dos terminan llamando al mismo método privado `enroll()`. Eso es lo
 * importante: las reglas (no duplicar, exigir prerrequisito) viven UNA vez.
 * Si estuvieran escritas en cada controlador, bastaría con corregir una y
 * olvidar la otra para que un camino aceptara lo que el otro rechaza.
 *
 * Es la misma razón por la que una regla NUNCA puede vivir solo en la pantalla:
 * esconder un botón no impide llamar al endpoint directamente.
 */
@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================
  // PUERTA 1 — el estudiante se inscribe a sí mismo
  // ==========================================================

  /**
   * El id del estudiante viene del token, nunca del cuerpo de la petición.
   * No hace falta revisar que la cuenta esté activa: JwtStrategy ya rechaza
   * con 401 cualquier sesión cuyo usuario no esté en estado ACTIVE.
   */
  async enrollSelf(studentId: string, courseSlug: string) {
    const course = await this.findPublishedCourseBySlug(courseSlug);
    return this.enroll(studentId, course);
  }

  // ==========================================================
  // PUERTA 2 — un sistema aliado inscribe a alguien
  // ==========================================================

  /**
   * Acá sí hay que validar al estudiante, porque quien pide no es él:
   * llega un correo desde afuera y hay que resolverlo y comprobar su estado.
   */
  async enrollByPartner(dto: CreatePublicEnrollmentDto) {
    const student = await this.prisma.user.findUnique({
      where: { email: dto.studentEmail },
      select: { id: true, status: true },
    });

    if (!student) {
      throw new NotFoundException(
        'No existe un estudiante registrado con ese correo',
      );
    }

    if (student.status !== UserStatus.ACTIVE) {
      throw new UnprocessableEntityException(
        'La cuenta del estudiante no está activa',
      );
    }

    const course = await this.findPublishedCourseBySlug(dto.courseSlug);
    return this.enroll(student.id, course);
  }

  // ==========================================================
  // CONSULTA — mis cursos
  // ==========================================================

  /**
   * Inscripciones del usuario actual, con el progreso ya calculado.
   *
   * El porcentaje se calcula acá y no en el frontend por dos motivos:
   * si lo hiciera cada pantalla, la fórmula se repetiría (y alguna la haría
   * mal); y el frontend tendría que descargarse todas las lecciones solo
   * para contarlas.
   */
  async findMyEnrollments(studentId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId },
      orderBy: { enrolledAt: 'desc' },
      select: {
        id: true,
        status: true,
        enrolledAt: true,
        completedAt: true,
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            thumbnail: true,
            level: true,
            category: { select: { name: true, slug: true } },
            modules: {
              where: { status: ContentStatus.ACTIVE },
              select: {
                lessons: {
                  where: { status: ContentStatus.ACTIVE },
                  select: { id: true },
                },
              },
            },
          },
        },
        // Solo las lecciones que este estudiante YA completó.
        lessonProgress: {
          where: { status: 'COMPLETED' },
          select: { id: true },
        },
      },
    });

    return enrollments.map((enrollment) => {
      const { course, lessonProgress, ...rest } = enrollment;
      const { modules, ...courseRest } = course;

      const totalLessons = modules.reduce(
        (sum, module) => sum + module.lessons.length,
        0,
      );
      const completedLessons = lessonProgress.length;

      return {
        ...rest,
        course: courseRest,
        totalLessons,
        completedLessons,
        // Guard contra la división por cero: un curso sin lecciones daría
        // NaN, que no es JSON válido y llega al cliente como null.
        progress:
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0,
      };
    });
  }

  // ==========================================================
  // NÚCLEO COMPARTIDO
  // ==========================================================

  /** Busca el curso y falla con 404 si no existe o no está publicado. */
  private async findPublishedCourseBySlug(slug: string) {
    const course = await this.prisma.course.findFirst({
      where: { slug, status: ContentStatus.ACTIVE },
      select: { id: true, slug: true, title: true, prerequisiteCourseId: true },
    });

    if (!course) {
      throw new NotFoundException(
        `No existe un curso publicado con slug "${slug}"`,
      );
    }

    return course;
  }

  /**
   * Las reglas de inscripción. Las dos puertas pasan por acá.
   *
   *   409 → ya estaba inscrito (conflicto de estado, no error del cliente)
   *   422 → petición válida pero incumple una regla de negocio
   */
  private async enroll(
    studentId: string,
    course: { id: string; slug: string; title: string; prerequisiteCourseId: string | null },
  ) {
    // Se consulta ANTES de insertar para poder devolver un 409 con mensaje
    // claro. Sin esto, la restricción @@unique([studentId, courseId]) lanzaría
    // un error P2002 crudo de Prisma, que llegaría como un 500 sin explicación.
    const existing = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId: course.id } },
      select: { id: true },
    });

    // Mensaje en tercera persona: este núcleo lo comparten el autoservicio y
    // la API de aliados, y "ya estás inscrito" no tiene sentido cuando quien
    // pregunta es un sistema que inscribe a otra persona. La interfaz web
    // muestra su propio texto en segunda persona (ver catalogo-client.tsx).
    if (existing) {
      throw new ConflictException('El estudiante ya está inscrito en este curso');
    }

    // Si el curso exige otro previo, hay que haberlo COMPLETADO:
    // no basta con estar inscrito en él.
    if (course.prerequisiteCourseId) {
      const prerequisiteDone = await this.prisma.enrollment.findFirst({
        where: {
          studentId,
          courseId: course.prerequisiteCourseId,
          status: EnrollmentStatus.COMPLETED,
        },
        select: { id: true },
      });

      if (!prerequisiteDone) {
        throw new UnprocessableEntityException(
          'El estudiante no ha completado el curso prerrequisito',
        );
      }
    }

    const enrollment = await this.prisma.enrollment.create({
      data: { studentId, courseId: course.id },
      select: { id: true, status: true, enrolledAt: true },
    });

    return {
      enrollmentId: enrollment.id,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      course: { slug: course.slug, title: course.title },
    };
  }
}
