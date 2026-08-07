/**
 * =============================================================================
 * ARCHIVO:   alert.ts
 * PROPÓSITO: Muestra un mensaje de error, éxito o aviso.
 *
 * Se creó como componente reutilizable porque las cinco pantallas necesitan
 * mostrar mensajes. Si cada una escribiera su propio bloque, cambiar el diseño
 * obligaría a tocar cinco archivos.
 * =============================================================================
 */

import { Component, input } from '@angular/core';

/** Tipos de mensaje disponibles. Cada uno tiene su color. */
export type AlertType = 'error' | 'success' | 'info';

@Component({
  selector: 'app-alert',
  // Plantilla en línea: el componente es tan chico que separarlo en un .html
  // aparte dificultaría leerlo más de lo que ayudaría.
  template: `
    <!-- @if es la sintaxis de control de flujo moderna de Angular.
         Reemplaza a *ngIf y no necesita importar CommonModule. -->
    @if (message()) {
      <div class="alert" [class]="'alert-' + type()" role="alert">
        {{ message() }}
      </div>
    }
  `,
  styles: `
    .alert {
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 14px;
      border: 1px solid;
      margin-bottom: 16px;
    }
    .alert-error {
      background: var(--color-danger-soft);
      border-color: rgb(220 38 38 / 20%);
      color: var(--color-danger);
    }
    .alert-success {
      background: var(--color-success-soft);
      border-color: rgb(22 163 74 / 20%);
      color: var(--color-success);
    }
    .alert-info {
      background: var(--color-primary-soft);
      border-color: rgb(37 99 235 / 20%);
      color: var(--color-primary);
    }
  `,
})
export class Alert {
  /**
   * Texto a mostrar. Si viene vacío, el componente no dibuja nada.
   *
   * `input()` es la forma moderna de recibir datos del componente padre.
   * Devuelve un signal, así que la vista se actualiza sola cuando cambia.
   */
  readonly message = input<string>('');

  /** Tipo de mensaje, que determina el color. Por defecto, error. */
  readonly type = input<AlertType>('error');
}
