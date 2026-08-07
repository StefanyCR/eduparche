import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import type { PaginationMeta } from '../dto/pagination-query.dto';

/**
 * Forma que devuelve un servicio cuando el resultado es un listado paginado.
 * El interceptor la detecta y la "desarma" para que `meta` quede al mismo
 * nivel que `data` en la respuesta final.
 */
export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

/** Contrato JSON único de la API pública. */
export interface ApiEnvelope<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
}

// Type guard: distingue un resultado paginado de un objeto cualquiera.
function isPaginated(value: unknown): value is PaginatedResult<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as PaginatedResult<unknown>).items) &&
    'meta' in value
  );
}

/**
 * Un sistema externo que consume la API necesita poder distinguir "salió bien"
 * de "salió mal" SIN mirar el código HTTP en cada rama de su código, y necesita
 * un lugar fijo donde buscar la paginación. Devolver a veces un array, a veces
 * un objeto y a veces un error obliga a quien consume a escribir un parser
 * distinto por endpoint. El sobre hace que uno solo sirva para todos.
 *
 * IMPORTANTE: este interceptor se aplica SOLO a los controladores de la API
 * pública (con @UseInterceptors), nunca de forma global. Los endpoints internos
 * que ya consume el frontend de Next.js siguen devolviendo su forma actual;
 * si lo pusiéramos global, romperíamos el frontend entero.
 */
@Injectable()
export class ResponseEnvelopeInterceptor<T>
  implements NestInterceptor<T, ApiEnvelope<unknown>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiEnvelope<unknown>> {
    return next.handle().pipe(
      map((payload): ApiEnvelope<unknown> => {
        const timestamp = new Date().toISOString();

        // Listado paginado: `items` pasa a `data` y `meta` sube un nivel.
        if (isPaginated(payload)) {
          return {
            success: true,
            data: payload.items,
            meta: payload.meta,
            timestamp,
          };
        }

        // Recurso único o cualquier otra respuesta.
        return { success: true, data: payload, timestamp };
      }),
    );
  }
}
