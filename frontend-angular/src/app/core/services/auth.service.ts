/**
 * =============================================================================
 * ARCHIVO:   auth.service.ts
 * PROPÓSITO: Módulo de autenticación. Maneja entrar, registrarse, salir y saber
 *            quién es el usuario actual.
 * API:       POST /api/auth/login · POST /api/auth/register
 *            POST /api/auth/logout · GET /api/users/me
 * =============================================================================
 */

import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthUser,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
} from '../models/user.model';

/**
 * Servicio de autenticación de EduParche.
 *
 * `providedIn: 'root'` hace que Angular cree UNA sola instancia compartida por
 * toda la aplicación (patrón singleton). Gracias a eso, el menú, el guard y
 * las páginas ven exactamente el mismo usuario sin pasárselo entre ellos.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Cliente HTTP de Angular. Se inyecta con inject(), el estilo actual. */
  private readonly http = inject(HttpClient);

  /** URL base del backend. Cambia según el entorno (ver environments/). */
  private readonly apiUrl = environment.apiUrl;

  /**
   * Usuario actual, guardado en un SIGNAL.
   *
   * ¿Por qué un signal y no una variable normal? Porque esta app corre en modo
   * "zoneless": Angular ya no detecta cambios revisando todo el árbol, sino
   * que se entera cuando un signal cambia. Si esto fuera una variable común,
   * el menú no se actualizaría al iniciar sesión.
   *
   * Es privado y se expone como solo lectura para que ningún componente pueda
   * escribirlo por su cuenta: la única forma de cambiarlo es a través de los
   * métodos de este servicio.
   */
  private readonly _currentUser = signal<AuthUser | null>(null);

  /** Usuario actual en modo solo lectura, para que lo consuman los componentes. */
  readonly currentUser = this._currentUser.asReadonly();

  /**
   * Indica si hay una sesión activa.
   *
   * `computed` deriva su valor de otro signal y se recalcula solo cuando ese
   * cambia. Evita repetir `currentUser() !== null` por toda la aplicación.
   */
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  /** True si el usuario es estudiante: solo ese rol puede inscribirse a cursos. */
  readonly isStudent = computed(() => this._currentUser()?.role === 'STUDENT');

  /**
   * Inicia sesión.
   *
   * El backend responde `{ user }` y, sobre todo, guarda el token en una cookie
   * `httpOnly`. El token NO viene en el cuerpo de la respuesta y no se guarda
   * en localStorage: de eso se encarga el navegador con la cookie.
   *
   * @param credentials Correo y contraseña (mínimo 8 caracteres).
   * @returns Observable con el usuario autenticado.
   * @throws ApiError 401 si el correo o la contraseña no coinciden.
   */
  login(credentials: LoginRequest): Observable<AuthUser> {
    return this.http
      .post<{ user: AuthUser }>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        map((response) => response.user),
        // tap ejecuta un efecto secundario sin alterar lo que viaja por el
        // Observable: acá guarda el usuario para que el menú se entere.
        tap((user) => this._currentUser.set(user)),
      );
  }

  /**
   * Crea una cuenta nueva.
   *
   * ATENCIÓN: registrarse NO inicia sesión. El backend no devuelve cookie en
   * este endpoint, así que después hay que mandar al usuario al login.
   *
   * Si la persona es menor de edad, la respuesta trae `requiresApproval: true`
   * y la cuenta queda pendiente de revisión por un administrador. En ese caso
   * no sirve mandarla al login: todavía no va a poder entrar.
   *
   * @param data Todos los campos son obligatorios; si falta uno, la API da 400.
   * @returns Observable indicando si la cuenta requiere aprobación.
   * @throws ApiError 409 si el correo ya está registrado.
   */
  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/auth/register`, data);
  }

  /**
   * Cierra la sesión.
   *
   * El backend borra la cookie; acá se limpia el signal. Hay que hacer las dos
   * cosas: si solo se borrara la cookie, el menú seguiría mostrando al usuario
   * hasta recargar la página.
   *
   * @returns Observable que completa cuando la sesión se cerró.
   */
  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}/auth/logout`, {})
      .pipe(tap(() => this._currentUser.set(null)));
  }

  /**
   * Pregunta al backend si hay una sesión activa.
   *
   * Es el método más importante de este servicio. Como la cookie es `httpOnly`,
   * JavaScript no puede leerla: la ÚNICA forma de saber si el usuario está
   * autenticado es intentar una petición protegida y ver qué responde.
   *
   * Se llama al arrancar la aplicación y desde el guard, para que una recarga
   * con F5 no expulse a alguien que sí tenía sesión válida.
   *
   * @returns Observable con el usuario, o con null si no hay sesión.
   */
  loadSession(): Observable<AuthUser | null> {
    return this.http.get<AuthUser>(`${this.apiUrl}/users/me`).pipe(
      tap((user) => this._currentUser.set(user)),
      // Un 401 acá no es un fallo: significa "no hay sesión". Se convierte en
      // null para que quien llame reciba una respuesta normal y no un error.
      catchError(() => {
        this._currentUser.set(null);
        return of(null);
      }),
    );
  }
}
