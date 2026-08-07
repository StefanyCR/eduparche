/**
 * =============================================================================
 * ARCHIVO:   catalog.service.ts
 * PROPÓSITO: Consume la API del catálogo de cursos.
 * API:       GET /api/v1/catalog · GET /api/v1/catalog/:slug
 *
 * Esta es la opción de menú "Catálogo". El endpoint devuelve solo los cursos
 * publicados (estado ACTIVE): los borradores y los retirados no salen nunca.
 * =============================================================================
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api.model';
import { CatalogCourse, CourseDetail } from '../models/course.model';

/** Filtros que acepta el listado del catálogo. Todos son opcionales. */
export interface CatalogFilters {
  /** Página solicitada, empezando en 1. */
  page?: number;
  /** Cuántos cursos por página. El backend no acepta más de 100. */
  pageSize?: number;
  /** Búsqueda por texto en el título y la descripción. */
  q?: string;
  /** Filtro por nivel: BASIC, INTERMEDIATE o ADVANCED. */
  level?: string;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  /** Cliente HTTP de Angular. */
  private readonly http = inject(HttpClient);

  /** URL base del backend. */
  private readonly apiUrl = environment.apiUrl;

  /**
   * Trae los cursos publicados, con el estado de inscripción del usuario actual.
   *
   * Cada curso incluye `isEnrolled` y `progress` porque el backend los calcula
   * contra el token de la sesión. Eso es lo que permite que la tarjeta muestre
   * "Continuar" en lugar de "Inscribirme" cuando corresponde.
   *
   * @param filters Filtros opcionales de búsqueda y paginación.
   * @returns Observable con los cursos y los metadatos de paginación.
   * @throws ApiError 400 si algún filtro tiene un valor inválido.
   * @throws ApiError 401 si no hay sesión activa.
   */
  getCourses(filters: CatalogFilters = {}): Observable<PaginatedResponse<CatalogCourse>> {
    // HttpParams construye el query string de forma segura: escapa los valores
    // en lugar de pegarlos a mano en la URL, que es donde se cuelan errores
    // cuando el usuario escribe espacios o acentos en el buscador.
    let params = new HttpParams();

    // Solo se agregan los filtros que realmente tienen valor. Enviar un
    // parámetro vacío (?level=) haría que el backend lo valide y responda 400.
    if (filters.page)     params = params.set('page', filters.page);
    if (filters.pageSize) params = params.set('pageSize', filters.pageSize);
    if (filters.q)        params = params.set('q', filters.q);
    if (filters.level)    params = params.set('level', filters.level);

    return this.http.get<PaginatedResponse<CatalogCourse>>(
      `${this.apiUrl}/v1/catalog`,
      { params },
    );
  }

  /**
   * Trae la ficha completa de un curso, con su temario.
   *
   * Se busca por `slug` (el identificador legible, ej: "intro-python") y no
   * por id, porque el slug se entiende y se puede compartir en un enlace.
   *
   * @param slug Identificador legible del curso.
   * @returns Observable con el curso, sus módulos y sus lecciones.
   * @throws ApiError 404 si el curso no existe o no está publicado.
   */
  getCourseBySlug(slug: string): Observable<CourseDetail> {
    return this.http.get<CourseDetail>(`${this.apiUrl}/v1/catalog/${slug}`);
  }
}
