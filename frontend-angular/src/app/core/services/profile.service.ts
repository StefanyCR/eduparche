/**
 * =============================================================================
 * ARCHIVO:   profile.service.ts
 * PROPÓSITO: Consume la API del perfil del usuario.
 * API:       GET /api/users/me · PUT /api/users/me
 *
 * Esta es la opción de menú "Perfil".
 * =============================================================================
 */

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthUser, UpdateProfileRequest } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  /** Cliente HTTP de Angular. */
  private readonly http = inject(HttpClient);

  /** URL base del backend. */
  private readonly apiUrl = environment.apiUrl;

  /**
   * Trae el perfil completo del usuario autenticado.
   *
   * @returns Observable con los datos del usuario y su perfil.
   * @throws ApiError 401 si no hay sesión activa.
   */
  getMyProfile(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.apiUrl}/users/me`);
  }

  /**
   * Actualiza los datos personales del usuario autenticado.
   *
   * El backend usa PUT sobre un DTO de campos opcionales, así que en la
   * práctica se comporta como una actualización parcial: solo cambia lo que
   * se envía y el resto queda como estaba.
   *
   * Los campos de identidad (correo, tipo y número de documento) NO se pueden
   * modificar desde acá: son datos con los que se verificó la cuenta.
   *
   * @param changes Campos a modificar. Los que no se envían no se tocan.
   * @returns Observable con el usuario ya actualizado.
   * @throws ApiError 400 si algún campo supera la longitud permitida.
   * @throws ApiError 401 si no hay sesión activa.
   */
  updateMyProfile(changes: UpdateProfileRequest): Observable<AuthUser> {
    return this.http.put<AuthUser>(`${this.apiUrl}/users/me`, changes);
  }
}
