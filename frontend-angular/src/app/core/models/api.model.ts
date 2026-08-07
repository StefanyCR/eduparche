/**
 * =============================================================================
 * ARCHIVO:   api.model.ts
 * PROPÓSITO: Estructuras genéricas que comparten varias respuestas de la API.
 * =============================================================================
 */

/**
 * Metadatos de paginación que acompañan a todo listado.
 *
 * El backend pagina SIEMPRE, con un tope de 100 elementos por página. No es un
 * capricho: sin límite, el tiempo de respuesta crecería con el tamaño de la
 * tabla y una petición con `?pageSize=999999` podría tumbar la base de datos.
 */
export interface PaginationMeta {
  /** Página actual, empezando en 1. */
  page: number;
  /** Cuántos elementos trae cada página. */
  pageSize: number;
  /** Total de elementos que existen, no solo los de esta página. */
  total: number;
  /** Cuántas páginas hay en total. */
  totalPages: number;
  /** True si existe una página siguiente. */
  hasNextPage: boolean;
  /** True si existe una página anterior. */
  hasPreviousPage: boolean;
}

/**
 * Respuesta paginada genérica.
 *
 * El `<T>` es un parámetro de tipo: permite reutilizar esta misma interfaz
 * para cursos, usuarios o cualquier otro listado, sin escribir una versión
 * por cada uno. Se usa así: `PaginatedResponse<CatalogCourse>`.
 */
export interface PaginatedResponse<T> {
  /** Los elementos de la página solicitada. */
  items: T[];
  /** Información para poder navegar entre páginas. */
  meta: PaginationMeta;
}

/**
 * Error ya traducido a algo que se puede mostrar en pantalla.
 *
 * Lo produce `error.interceptor.ts` a partir de la respuesta cruda del
 * servidor. Se conserva el `status` además del mensaje porque hay pantallas
 * que necesitan reaccionar distinto según el código: por ejemplo, un 409 al
 * inscribirse no es un fallo real, significa "ya estabas inscrito".
 */
export interface ApiError {
  /** Código HTTP: 400, 401, 403, 404, 409, 422, 500… */
  status: number;
  /** Mensaje listo para mostrarle al usuario. */
  message: string;
}
