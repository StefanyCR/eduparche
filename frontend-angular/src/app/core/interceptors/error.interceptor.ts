/**
 * =============================================================================
 * ARCHIVO:   error.interceptor.ts
 * PROPÓSITO: Traducir los errores del backend a mensajes que el usuario entienda,
 *            y cerrar la sesión automáticamente cuando el token vence.
 *
 * Sin este interceptor, cada componente tendría que interpretar por su cuenta
 * los códigos HTTP y los distintos formatos de error del backend. Acá se hace
 * una sola vez y las pantallas solo tienen que mostrar `error.message`.
 * =============================================================================
 */

import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../models/api.model';

/**
 * Rutas donde un 401 es una respuesta ESPERADA y no debe provocar redirección.
 *
 * - /auth/login    → un 401 significa "contraseña incorrecta", hay que mostrarlo
 *                    en el formulario, no expulsar al usuario.
 * - /auth/register → mismo caso.
 * - /users/me      → se usa para PREGUNTAR si hay sesión. Un 401 acá solo
 *                    significa "no hay sesión". Si redirigiéramos, la pantalla
 *                    de login entraría en un bucle infinito de redirecciones.
 */
const SILENT_401_ENDPOINTS = ['/auth/login', '/auth/register', '/users/me'];

/**
 * Convierte una respuesta de error del backend en un mensaje legible.
 *
 * El backend usa DOS formatos distintos según el endpoint:
 *   1. Endpoints internos → { message: "texto" }  o  { message: ["error1", "error2"] }
 *      (el array aparece cuando falla la validación: una entrada por regla incumplida)
 *   2. API pública        → { success: false, error: { code, message, details } }
 *
 * @param error Respuesta de error tal como la entrega Angular.
 * @returns     Un texto para mostrar en pantalla.
 */
function extractMessage(error: HttpErrorResponse): string {
  // Status 0 significa que la petición nunca llegó al servidor: el backend
  // está apagado, o CORS bloqueó la respuesta. Es el error más común al
  // arrancar el proyecto, así que conviene un mensaje explícito.
  if (error.status === 0) {
    return 'No se pudo conectar con el servidor. Verificá que el backend esté corriendo en el puerto 3001.';
  }

  const body = error.error;

  // Formato 2: sobre de la API pública.
  if (body?.error?.message) {
    return body.error.message;
  }

  // Formato 1 con array: se unen todos los errores de validación en un texto.
  if (Array.isArray(body?.message)) {
    return body.message.join(' · ');
  }

  // Formato 1 con texto simple.
  if (typeof body?.message === 'string') {
    return body.message;
  }

  // Último recurso: mensajes genéricos por código.
  switch (error.status) {
    case 401: return 'Credenciales incorrectas o sesión vencida.';
    case 403: return 'No tenés permisos para realizar esta acción.';
    case 404: return 'No se encontró lo que buscabas.';
    case 500: return 'Ocurrió un error en el servidor. Intentá más tarde.';
    default:  return 'Ocurrió un error inesperado.';
  }
}

/**
 * Interceptor que captura los errores de todas las peticiones HTTP.
 *
 * @param req  Petición saliente.
 * @param next Siguiente paso de la cadena.
 * @returns    Observable que, ante un fallo, emite un ApiError ya traducido.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // ¿Este endpoint es de los que manejan su propio 401?
      const isSilentEndpoint = SILENT_401_ENDPOINTS.some((endpoint) =>
        req.url.includes(endpoint),
      );

      // Un 401 en cualquier otro endpoint significa que la cookie venció o
      // se borró: la sesión ya no sirve y hay que volver a entrar.
      if (error.status === 401 && !isSilentEndpoint) {
        router.navigate(['/login'], {
          queryParams: { expirada: 'true' },
        });
      }

      // Se propaga un objeto propio en lugar del HttpErrorResponse crudo:
      // así los componentes reciben siempre la misma forma { status, message }
      // y no tienen que conocer los formatos internos del backend.
      const apiError: ApiError = {
        status: error.status,
        message: extractMessage(error),
      };

      return throwError(() => apiError);
    }),
  );
};
