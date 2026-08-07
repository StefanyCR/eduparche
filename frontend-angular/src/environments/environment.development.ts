/**
 * =============================================================================
 * ARCHIVO:   environment.development.ts
 * PROPÓSITO: Configuración de la aplicación para DESARROLLO LOCAL.
 *
 * Este archivo sustituye a `environment.ts` cuando se ejecuta `ng serve`.
 * =============================================================================
 */

export const environment = {
  /** En desarrollo es false: habilita mensajes de depuración más detallados. */
  production: false,

  /**
   * URL del backend NestJS corriendo en local.
   *
   * El puerto 3001 es el que define `backend/.env` (variable PORT), y `/api`
   * es el prefijo global del backend.
   *
   * Angular corre en el puerto 4200, así que las peticiones son CROSS-ORIGIN.
   * Por eso el backend tiene que autorizar `http://localhost:4200` en su
   * variable CORS_ORIGINS; si no, el navegador bloquea todas las respuestas.
   */
  apiUrl: 'http://localhost:3001/api',
};
