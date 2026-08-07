/**
 * =============================================================================
 * ARCHIVO:   credentials.interceptor.ts
 * PROPÓSITO: Hacer que TODAS las peticiones al backend envíen la cookie de sesión.
 *
 * CONTEXTO — por qué existe este archivo:
 * El backend guarda el token JWT en una cookie llamada `ep_token` marcada como
 * `httpOnly`. Eso significa que JavaScript NO puede leerla (es la defensa
 * contra ataques XSS: si un atacante inyecta código, no puede robar el token).
 *
 * El problema: por defecto, el navegador NO envía cookies en peticiones
 * cross-origin, y acá Angular corre en el puerto 4200 mientras el backend está
 * en el 3001 — orígenes distintos. Hay que pedirlo explícitamente con la
 * opción `withCredentials: true`.
 *
 * Se hace con un interceptor y no petición por petición porque basta olvidarlo
 * una sola vez para que esa llamada devuelva 401 sin motivo aparente, y ese
 * error es difícil de encontrar. Acá se aplica a todo de una vez.
 * =============================================================================
 */

import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptor funcional (el estilo moderno de Angular, sin clases).
 *
 * Se registra en `app.config.ts` con:
 *   provideHttpClient(withInterceptors([credentialsInterceptor, errorInterceptor]))
 *
 * @param req  La petición que está por salir hacia el backend.
 * @param next Función que continúa la cadena hacia el siguiente interceptor.
 * @returns    Un Observable con la respuesta del servidor.
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // Las peticiones HTTP en Angular son INMUTABLES: no se pueden modificar
  // directamente. `clone()` crea una copia con el cambio aplicado, que es la
  // que continúa el viaje. Esto evita efectos secundarios difíciles de rastrear.
  const requestWithCredentials = req.clone({ withCredentials: true });

  return next(requestWithCredentials);
};
