/**
 * =============================================================================
 * ARCHIVO:   environment.ts
 * PROPÓSITO: Configuración de la aplicación para el entorno de PRODUCCIÓN.
 *
 * Angular reemplaza este archivo por `environment.development.ts` cuando se
 * ejecuta `ng serve`. 
 *
 * Gracias a eso el código nunca pregunta "¿estoy en desarrollo o producción?":
 * simplemente importa `environment` y el compilador ya puso los valores
 * correctos según cómo se haya compilado.
 * =============================================================================
 */

export const environment = {
  /** Indica si la app corre compilada para producción. */
  production: true,

  /**
   * URL base de la API de EduParche.
   *
   * Incluye el prefijo `/api` porque el backend NestJS lo agrega globalmente
   * (ver `app.setGlobalPrefix('api')` en backend/src/main.ts).
   *
   * IMPORTANTE: al desplegar hay que reemplazar este dominio por el real del
   * backend, y agregar ese mismo dominio a la variable CORS_ORIGINS del backend.
   */
  apiUrl: 'https://api.eduparche.com/api',
};
