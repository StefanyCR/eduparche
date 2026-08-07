import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { CourseLevel } from '../../../generated/prisma';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/** Campos por los que se permite ordenar el catálogo. */
export const COURSE_SORT_FIELDS = ['createdAt', 'title', 'startDate'] as const;
export type CourseSortField = (typeof COURSE_SORT_FIELDS)[number];

/**
 * Filtros del catálogo público: GET /api/v1/public/courses
 *
 * Extiende PaginationQueryDto, así que hereda `page` y `pageSize`.
 *
 * Regla REST aplicada: los filtros van en la QUERY STRING, nunca en la ruta.
 * `/courses?level=BASIC` es el mismo recurso "colección de cursos" con una
 * vista filtrada; `/courses/basic` daría a entender que "basic" es un curso.
 * Por eso tampoco existe `/courses/search` — buscar no es un recurso, es un
 * filtro sobre la colección.
 */
export class QueryCoursesDto extends PaginationQueryDto {
  // Búsqueda por texto libre sobre título y descripción.
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'q no puede superar los 100 caracteres' })
  q?: string;

  // Filtro por nivel. Se valida contra el enum de Prisma: si llega
  // "PRINCIPIANTE" la API responde 400 en vez de devolver una lista vacía
  // y dejar al cliente adivinando si el filtro existe o no hay datos.
  @IsOptional()
  @IsEnum(CourseLevel, {
    message: 'level debe ser BASIC, INTERMEDIATE o ADVANCED',
  })
  level?: CourseLevel;

  // Filtro por categoría, usando el slug (legible y estable) en vez del id.
  @IsOptional()
  @IsString()
  categorySlug?: string;

  // Filtro por habilidad, para casos como "cursos que enseñan JavaScript".
  @IsOptional()
  @IsString()
  skillSlug?: string;

  @IsOptional()
  @IsIn(COURSE_SORT_FIELDS, {
    message: `sortBy debe ser uno de: ${COURSE_SORT_FIELDS.join(', ')}`,
  })
  sortBy?: CourseSortField = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'order debe ser asc o desc' })
  order?: 'asc' | 'desc' = 'desc';
}
