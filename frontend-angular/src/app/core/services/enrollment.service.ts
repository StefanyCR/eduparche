/**
 * =============================================================================
 * ARCHIVO:   enrollment.service.ts
 * PROPÓSITO: Consume la API de inscripciones a cursos.
 * API:       POST /api/v1/enrollments · GET /api/v1/enrollments/me
 *
 * Esta es la opción de menú "Mis cursos", y también el botón "Inscribirme"
 * del catálogo.
 * =============================================================================
 */

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateEnrollmentResponse,
  MyEnrollment,
} from '../models/enrollment.model';

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  /** Cliente HTTP de Angular. */
  private readonly http = inject(HttpClient);

  /** URL base del backend. */
  private readonly apiUrl = environment.apiUrl;

  /**
   * Inscribe al usuario actual en un curso.
   *
   * Solo viaja el slug del curso: el estudiante lo deduce el backend del token
   * de la sesión. Si se enviara por el cuerpo, cualquiera podría inscribir a
   * otra persona simplemente cambiando ese campo del JSON.
   *
   * Este método NO es idempotente: llamarlo dos veces no crea dos
   * inscripciones, la segunda responde 409. Es a propósito — preferimos un
   * conflicto honesto antes que fingir que salió bien.
   *
   * @param courseSlug Identificador legible del curso, ej: "intro-python".
   * @returns Observable con los datos de la inscripción creada.
   * @throws ApiError 403 si el rol no es STUDENT (un admin no puede inscribirse).
   * @throws ApiError 404 si el curso no existe o no está publicado.
   * @throws ApiError 409 si ya estaba inscrito en ese curso.
   * @throws ApiError 422 si le falta completar el curso prerrequisito.
   */
  enroll(courseSlug: string): Observable<CreateEnrollmentResponse> {
    return this.http.post<CreateEnrollmentResponse>(
      `${this.apiUrl}/v1/enrollments`,
      { courseSlug },
    );
  }

  /**
   * Trae los cursos en los que está inscrito el usuario actual.
   *
   * La ruta termina en "me" y no recibe un id de usuario. Es una decisión de
   * seguridad: un identificador que no se acepta por parámetro es un
   * identificador que nadie puede falsear para espiar los cursos de otro.
   *
   * El porcentaje de avance ya viene calculado desde el backend.
   *
   * @returns Observable con la lista de inscripciones y su progreso.
   * @throws ApiError 401 si no hay sesión activa.
   */
  getMyEnrollments(): Observable<MyEnrollment[]> {
    return this.http.get<MyEnrollment[]>(`${this.apiUrl}/v1/enrollments/me`);
  }
}
