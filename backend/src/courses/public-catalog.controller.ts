import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { QueryCoursesDto } from './dto/query-courses.dto';
import { CreatePublicEnrollmentDto } from './dto/create-public-enrollment.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { ResponseEnvelopeInterceptor } from '../common/interceptors/response-envelope.interceptor';
import { ApiExceptionFilter } from '../common/filters/api-exception.filter';
import { EnrollmentsService } from '../enrollments/enrollments.service';

/**
 * ============================================================
 * API PÚBLICA v1 — punto de integración para sistemas externos
 * ============================================================
 *
 * Ruta base: /api/v1/public
 *   "api"    → prefijo global (main.ts, setGlobalPrefix)
 *   "v1"     → versión (enableVersioning + `version: '1'` acá abajo)
 *   "public" → separa lo que puede consumir un tercero de lo que es interno
 *
 * Por qué existe separado del controlador de administración, si ambos leen la
 * misma tabla: son dos CONTRATOS distintos con dos públicos distintos. El
 * interno puede cambiar cuando queramos porque el único cliente es nuestro
 * propio frontend; el público es una promesa hacia afuera y romperlo rompe
 * sistemas ajenos. Mezclarlos en un solo controlador haría que cualquier
 * ajuste interno se filtrara sin querer al contrato externo.
 *
 * Los tres decoradores a nivel de clase aplican a TODOS los métodos:
 *   ApiKeyGuard                 → exige el header X-API-Key
 *   ResponseEnvelopeInterceptor → envuelve las respuestas OK en el sobre
 *   ApiExceptionFilter          → envuelve los errores en el mismo formato
 *
 * Se aplican acá y no de forma global a propósito: los endpoints internos que
 * ya consume el frontend deben seguir respondiendo con su forma actual.
 */
@Controller({ path: 'public', version: '1' })
@UseGuards(ApiKeyGuard)
@UseInterceptors(ResponseEnvelopeInterceptor)
@UseFilters(ApiExceptionFilter)
export class PublicCatalogController {
  constructor(
    private readonly coursesService: CoursesService,
    // La inscripción vive en su propio servicio porque el estudiante también
    // puede inscribirse desde la web. Ambos caminos comparten las mismas
    // reglas en lugar de duplicarlas.
    private readonly enrollmentsService: EnrollmentsService,
  ) {}

  /**
   * GET /api/v1/public/courses
   * Catálogo paginado y filtrable.
   *
   * Ejemplo:
   *   /api/v1/public/courses?level=BASIC&q=java&page=1&pageSize=10
   *
   * Respuesta 200:
   * {
   *   "success": true,
   *   "data": [ { "id": "...", "slug": "java-basico", ... } ],
   *   "meta": { "page":1, "pageSize":10, "total":37, "totalPages":4,
   *             "hasNextPage":true, "hasPreviousPage":false },
   *   "timestamp": "2026-08-06T15:04:05.000Z"
   * }
   *
   * Cache-Control: el catálogo cambia pocas veces al día. Con 5 minutos de
   * caché, un aliado que refresque su pantalla cada 30 segundos genera 1
   * consulta a la base en vez de 10. `public` autoriza a proxies y CDN a
   * guardar la respuesta, porque no contiene datos de ninguna persona.
   */
  @Get('courses')
  @Header('Cache-Control', 'public, max-age=300')
  findCourses(@Query() query: QueryCoursesDto) {
    return this.coursesService.findPublicCatalog(query);
  }

  /**
   * GET /api/v1/public/courses/:slug
   * Detalle de un curso con su temario (módulos y lecciones).
   *
   * 200 → curso encontrado
   * 404 → no existe o no está publicado
   *
   * Nota: se responde 404 igual cuando el curso existe pero está en DRAFT.
   * Es intencional — un 403 le confirmaría a quien pregunta que ese slug
   * existe y está por salir, que es información de negocio que no le toca.
   */
  @Get('courses/:slug')
  @Header('Cache-Control', 'public, max-age=300')
  findCourseBySlug(@Param('slug') slug: string) {
    return this.coursesService.findPublicBySlug(slug);
  }

  /**
   * GET /api/v1/public/categories
   * Categorías disponibles, con cuántos cursos tiene cada una.
   * Sirve para que el aliado arme sus filtros sin adivinar los valores.
   */
  @Get('categories')
  @Header('Cache-Control', 'public, max-age=3600')
  findCategories() {
    return this.coursesService.findPublicCategories();
  }

  /**
   * GET /api/v1/public/stats
   * Métricas agregadas de la plataforma. Sin datos personales.
   */
  @Get('stats')
  @Header('Cache-Control', 'public, max-age=600')
  getStats() {
    return this.coursesService.getPublicStats();
  }

  /**
   * POST /api/v1/public/enrollments
   * Inscribe a un estudiante en un curso desde un sistema aliado.
   *
   * Cuerpo:
   * { "studentEmail":"ana@correo.com", "courseSlug":"java-basico", "consentGiven":true }
   *
   * Códigos:
   *   201 → inscripción creada
   *   400 → cuerpo inválido o sin consentimiento
   *   401 → falta o es inválido el X-API-Key
   *   404 → el estudiante o el curso no existen
   *   409 → ya estaba inscrito
   *   422 → le falta el curso prerrequisito
   *
   * El 201 es explícito porque Nest responde 201 en POST por defecto, pero
   * dejarlo escrito documenta el contrato en el propio código.
   * Un POST NO es idempotente: repetirlo intenta crear otra inscripción, y por
   * eso el segundo intento devuelve 409 en lugar de fingir que salió bien.
   */
  @Post('enrollments')
  @HttpCode(HttpStatus.CREATED)
  createEnrollment(@Body() dto: CreatePublicEnrollmentDto) {
    return this.enrollmentsService.enrollByPartner(dto);
  }
}
