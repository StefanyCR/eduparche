/**
 * =============================================================================
 * ARCHIVO:   app.config.ts
 * PROPÓSITO: Configuración raíz de la aplicación. Acá se registran los
 *            servicios globales que Angular pone a disposición de todo el árbol
 *            de componentes.
 * =============================================================================
 */

import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    /** Manejador global para los errores que ningún componente capturó. */
    provideBrowserGlobalErrorListeners(),

    /** Habilita la navegación entre pantallas usando app.routes.ts. */
    provideRouter(routes),

    /**
     * Habilita HttpClient para poder hablar con el backend.
     *
     * EL ORDEN DE LOS INTERCEPTORES IMPORTA. Se ejecutan en cadena:
     *
     *   petición  →  credentials  →  error  →  BACKEND
     *   respuesta →  credentials  ←  error  ←  BACKEND
     *
     * 1. credentialsInterceptor va PRIMERO porque tiene que marcar la petición
     *    para que lleve la cookie antes de que salga.
     * 2. errorInterceptor va DESPUÉS porque es el más cercano al backend y así
     *    es el primero en ver la respuesta de vuelta, pudiendo traducir el
     *    error antes de que llegue al componente.
     */
    provideHttpClient(
      withInterceptors([credentialsInterceptor, errorInterceptor]),
    ),
  ],
};
