/**
 * =============================================================================
 * ARCHIVO:   course.model.ts
 * PROPÓSITO: Describe los cursos que devuelve la API del catálogo.
 * API:       GET /api/v1/catalog · GET /api/v1/catalog/:slug
 * =============================================================================
 */

/**
 * Nivel de dificultad. Coincide con el enum `CourseLevel` de Prisma.
 * El backend responde en inglés; la traducción a español se hace en la vista.
 */
export type CourseLevel = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';

/** Categoría a la que pertenece un curso (Programación, Idiomas, etc.). */
export interface CourseCategory {
  name: string;
  /** Identificador legible usado en filtros y URLs. */
  slug: string;
}

/** Habilidad que desarrolla el curso (JavaScript, Trabajo en equipo, …). */
export interface Skill {
  name: string;
  slug: string;
}

/**
 * Curso tal como aparece en el listado del catálogo.
 *
 * Los tres últimos campos (isEnrolled, completedLessons, progress) solo llegan
 * cuando quien pregunta es un usuario logueado: el backend los calcula contra
 * el token de la sesión. Por eso la API pública para sistemas aliados no los
 * incluye — no habría nadie a quien referirse.
 */
export interface CatalogCourse {
  /** Identificador interno. */
  id: string;
  /** Identificador legible: se usa en la URL y al inscribirse. */
  slug: string;
  title: string;
  description: string;
  /** URL de la imagen de portada. Null si el curso no tiene. */
  thumbnail: string | null;
  level: CourseLevel;
  /** Horas de acompañamiento con tutor. Null si no se definieron. */
  onlineHours: number | null;
  /** Horas de estudio por cuenta propia. */
  autonomousHours: number | null;
  category: CourseCategory | null;
  skills: Skill[];
  /** Total de lecciones publicadas, sumando todos los módulos. */
  totalLessons: number;
  /** Cuántas personas están inscritas. Es un dato agregado: no identifica a nadie. */
  enrolledCount: number;
  /** True si el usuario actual ya está inscrito en este curso. */
  isEnrolled: boolean;
  /** Lecciones que el usuario actual ya completó. */
  completedLessons: number;
  /** Porcentaje de avance del usuario actual, de 0 a 100. */
  progress: number;
}

/**
 * Una lección dentro de un módulo.
 *
 * Fijate que NO hay campo con la URL del video ni del PDF. Es deliberado:
 * el temario sirve para mostrar y "vender" el curso, pero el contenido es el
 * producto y solo se entrega a quien está inscrito. Por eso el backend
 * únicamente informa CUÁNTOS materiales hay, nunca dónde están.
 */
export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  /** Posición dentro del módulo, empezando en 1. */
  order: number;
  /** Si es false, la lección es opcional y no cuenta para completar el curso. */
  isRequired: boolean;
  /** Conteo de materiales asociados. */
  _count: { materials: number };
}

/** Un módulo agrupa varias lecciones. */
export interface CourseModule {
  id: string;
  title: string;
  description: string | null;
  /** Posición dentro del curso, empezando en 1. */
  order: number;
  lessons: Lesson[];
}

/** Ficha completa del curso: todo lo del listado más el temario. */
export interface CourseDetail extends Omit<CatalogCourse, 'isEnrolled' | 'completedLessons' | 'progress'> {
  modules: CourseModule[];
}
