/**
 * =============================================================================
 * ARCHIVO:   loading.ts
 * PROPÓSITO: Indicador de "cargando" mientras se espera la respuesta del backend.
 *
 * Mostrar algo mientras se espera evita que la pantalla parezca rota o
 * congelada durante el segundo que tarda la petición HTTP.
 * =============================================================================
 */

import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading',
  template: `
    <div class="loading">
      <div class="spinner" aria-hidden="true"></div>
      <p class="loading-text">{{ text() }}</p>
    </div>
  `,
  styles: `
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 48px 0;
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--color-border);
      /* Solo el borde superior lleva color: al girar, produce la sensación
         de movimiento circular. */
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .loading-text {
      font-size: 13px;
      color: var(--color-text-soft);
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `,
})
export class Loading {
  /** Texto que acompaña al indicador. */
  readonly text = input<string>('Cargando…');
}
