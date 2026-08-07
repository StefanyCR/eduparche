/**
 * =============================================================================
 * ARCHIVO:   auth.guard.ts
 * PROPÓSITO: Impedir que alguien sin sesión entre a las rutas privadas.
 *
 * CONCEPTO CLAVE — por qué este guard tiene que preguntarle al servidor:
 * La cookie de sesión es `httpOnly`, así que Angular NO puede leerla. No hay
 * forma de mirar el token y decidir localmente si la sesión existe.
 *
 * La única manera de saberlo es INTENTAR una petición autenticada
 * (GET /users/me): si responde 200 hay sesión, si responde 401 no la hay.
 * Es un viaje extra al servidor, y es el precio de no guardar el token en
 * localStorage —donde cualquier script inyectado podría robarlo—.
 * =============================================================================
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Guard funcional que protege las rutas privadas.
 *
 * Se usa en `app.routes.ts` así:
 *   { path: 'catalogo', component: Catalog, canActivate: [authGuard] }
 *
 * @param _route Datos de la ruta destino (no se usan acá).
 * @param state  Estado del router; de acá sale la URL que se intentó abrir.
 * @returns      true para dejar pasar, o un UrlTree para redirigir al login.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Atajo: si el usuario ya se cargó antes (por ejemplo, viene de navegar por
  // la app), no hace falta volver a preguntarle al backend en cada cambio de
  // ruta. El signal ya tiene la respuesta.
  if (authService.isAuthenticated()) {
    return true;
  }

  // Primera carga de la página, o recarga con F5: el signal está vacío pero la
  // cookie puede seguir siendo válida. Hay que confirmarlo con el servidor.
  return authService.loadSession().pipe(
    map((user) => {
      if (user) {
        return true;
      }

      // Sin sesión: se manda al login guardando a dónde quería ir, para
      // devolverlo ahí después de entrar en lugar de dejarlo en el inicio.
      return router.createUrlTree(['/login'], {
        queryParams: { redirect: state.url },
      });
    }),
  );
};
