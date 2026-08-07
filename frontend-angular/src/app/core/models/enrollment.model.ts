/**
 * =============================================================================
 * ARCHIVO:   enrollment.model.ts
 * PROPÓSITO: Describe las inscripciones del usuario a los cursos.
 * API:       GET /api/v1/enrollments/me · POST /api/v1/enrollments
 * =============================================================================
 */

import { CourseCategory, CourseLevel } from './course.model';

/**
 * Estado de una inscripción.
 * ACTIVE = cursando · COMPLETED = terminado · WITHDRAWN = abandonado
 */
export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'WITHDRAWN';

/**
 * Una inscripción del usuario actual, con su progreso ya calculado.
 *
 * El porcentaje lo calcula el BACKEND, no esta aplicación. Es a propósito: si
 * cada pantalla hiciera la cuenta por su lado, tarde o temprano dos pantallas
 * mostrarían números distintos para lo mismo. Además el frontend tendría que
 * descargarse todas las lecciones solo para poder contarlas.
 */
export interface MyEnrollment {
  /** Identificador de la inscripción. */
  id: string;
  status: EnrollmentStatus;
  /** Fecha en que se inscribió, en formato ISO. */
  enrolledAt: string;
  /** Fecha en que terminó el curso. Null si sigue cursando. */
  completedAt: string | null;

  /** Datos del curso al que corresponde esta inscripción. */
  course: {
    id: string;
    slug: string;
    title: string;
    description: string;
    thumbnail: string | null;
    level: CourseLevel;
    category: CourseCategory | null;
  };

  /** Total de lecciones publicadas del curso. */
  totalLessons: number;
  /** Cuántas completó el usuario. */
  completedLessons: number;
  /** Porcentaje de avance, de 0 a 100, redondeado. */
  progress: number;
}

/**
 * Cuerpo que se envía al inscribirse.
 *
 * Solo viaja el curso. El estudiante NO se envía: el backend lo saca del token
 * de la sesión. Si se aceptara por el cuerpo de la petición, cualquiera podría
 * inscribir a otra persona con solo cambiar un campo del JSON.
 */
export interface CreateEnrollmentRequest {
  /** Identificador legible del curso, ej: "intro-python". */
  courseSlug: string;
}

/** Respuesta del backend cuando la inscripción se creó correctamente (201). */
export interface CreateEnrollmentResponse {
  enrollmentId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  course: { slug: string; title: string };
}
