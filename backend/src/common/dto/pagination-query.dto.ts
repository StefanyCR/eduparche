import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Parámetros de paginación compartidos por todos los listados de la API pública.
 *
 * ¿Por qué paginar siempre?
 * Un `GET /courses` sin límite hace que el tamaño de la respuesta —y el tiempo
 * de consulta— crezcan con la tabla. 
 *
 * Nota sobre @Type: los query params llegan SIEMPRE como string ("?page=2" → "2").
 * class-transformer los convierte a número antes de que class-validator los
 * valide. Requiere `transform: true` en el ValidationPipe global (ver main.ts).
 */
export class PaginationQueryDto {
  // Página solicitada, empezando en 1 (no en 0 — es lo que espera quien consume).
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page debe ser un número entero' })
  @Min(1, { message: 'page debe ser mayor o igual a 1' })
  page?: number = 1;

  // Cuántos elementos por página.
  // El tope de 100 es deliberado: impide que un cliente pida ?pageSize=999999
  // y tumbe la base de datos. Es un límite de seguridad, no una preferencia.
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pageSize debe ser un número entero' })
  @Min(1, { message: 'pageSize debe ser mayor o igual a 1' })
  @Max(100, { message: 'pageSize no puede ser mayor a 100' })
  pageSize?: number = 20;
}

/** Metadatos de paginación que acompañan a todo listado. */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Construye el bloque `meta` a partir del total real de filas.
 * Se centraliza aquí para que todos los endpoints devuelvan exactamente
 * la misma forma y quien consume pueda escribir un solo parser.
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
