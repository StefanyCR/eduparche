/**
 * Proyecciones de Prisma para el módulo de cursos.
 *
 * Se extraen a un archivo aparte (mismo patrón que users/user.selects.ts) 
 */

/** Datos mínimos de un curso para listados del catálogo público. */
export const publicCourseListSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  thumbnail: true,
  level: true,
  onlineHours: true,
  autonomousHours: true,
  startDate: true,
  endDate: true,
  createdAt: true,
  category: { select: { name: true, slug: true } },
  skills: { select: { skill: { select: { name: true, slug: true } } } },
  _count: { select: { enrollments: true } },
  // Solo para poder contar las lecciones del curso ("12 lecciones" en la
  // tarjeta). Prisma no puede contar una relación de dos saltos
  // (curso → módulo → lección), así que se traen los conteos por módulo y
  // se suman en el servicio. Estos módulos NO salen en la respuesta.
  modules: {
    where: { status: 'ACTIVE' as const },
    select: { _count: { select: { lessons: true } } },
  },
} as const;

/**
 * Detalle del curso: agrega el temario (módulos y lecciones).
 * El contenido es el producto: ese solo se entrega a un estudiante inscrito y autenticado.
 */
export const publicCourseDetailSelect = {
  ...publicCourseListSelect,
  modules: {
    where: { status: 'ACTIVE' as const },
    orderBy: { order: 'asc' as const },
    select: {
      id: true,
      title: true,
      description: true,
      order: true,
      lessons: {
        where: { status: 'ACTIVE' as const },
        orderBy: { order: 'asc' as const },
        select: {
          id: true,
          title: true,
          description: true,
          order: true,
          isRequired: true,
          // Cuántos materiales hay, sin decir cuáles ni dónde están.
          _count: { select: { materials: true } },
        },
      },
    },
  },
} as const;

/** Proyección para el CRUD interno de administración (incluye campos de gestión). */
export const adminCourseSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  thumbnail: true,
  level: true,
  status: true,
  categoryId: true,
  startDate: true,
  endDate: true,
  onlineHours: true,
  autonomousHours: true,
  scheduledDisableAt: true,
  prerequisiteCourseId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true } },
  _count: { select: { enrollments: true, modules: true } },
} as const;
