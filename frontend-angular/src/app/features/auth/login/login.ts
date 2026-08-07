/**
 * =============================================================================
 * ARCHIVO:   login.ts
 * PROPÓSITO: Pantalla de inicio de sesión. Es la puerta de entrada al sistema.
 * API:       POST /api/auth/login
 * =============================================================================
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiError } from '../../../core/models/api.model';
import { AuthService } from '../../../core/services/auth.service';
import { Alert } from '../../../shared/components/alert/alert';

@Component({
  selector: 'app-login',
  // ReactiveFormsModule habilita [formGroup] y formControlName en la plantilla.
  imports: [ReactiveFormsModule, RouterLink, Alert],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  /** Constructor de formularios reactivos de Angular. */
  private readonly formBuilder = inject(FormBuilder);

  /** Servicio de autenticación. */
  private readonly authService = inject(AuthService);

  /** Router, para navegar tras iniciar sesión correctamente. */
  private readonly router = inject(Router);

  /** Ruta activa: de acá se leen los parámetros de la URL. */
  private readonly route = inject(ActivatedRoute);

  /**
   * Definición del formulario.
   *
   * Se usan FORMULARIOS REACTIVOS y no plantillas: las reglas de validación
   * quedan escritas en TypeScript, donde se pueden leer de un vistazo, en
   * lugar de repartidas por atributos del HTML.
   *
   * Las reglas replican las del LoginDto del backend. La validación del
   * servidor es la que manda —el navegador se puede saltar—, pero validar acá
   * le ahorra al usuario un viaje de ida y vuelta para enterarse de un error
   * evidente.
   */
  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  /** True mientras la petición está en curso: deshabilita el botón. */
  readonly submitting = signal(false);

  /** Mensaje de error a mostrar. Vacío cuando no hay ninguno. */
  readonly errorMessage = signal('');

  /** Mensaje informativo, por ejemplo al llegar desde el registro. */
  readonly infoMessage = signal('');

  /**
   * URL a la que volver después de iniciar sesión.
   *
   * El guard la agrega como parámetro cuando alguien intenta entrar a una
   * pantalla protegida sin sesión. Así, después de entrar, se lo devuelve a
   * donde quería ir en vez de dejarlo siempre en el catálogo.
   */
  private redirectUrl = '/catalogo';

  /**
   * Lee los parámetros de la URL al abrir la pantalla.
   *
   * @returns void
   */
  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;

    if (params['redirect']) {
      this.redirectUrl = params['redirect'];
    }

    // El interceptor de errores agrega ?expirada=true cuando detecta un 401
    // en medio de la sesión. Conviene explicarle al usuario por qué está acá.
    if (params['expirada']) {
      this.infoMessage.set('Tu sesión venció. Por favor, ingresá de nuevo.');
    }

    // Al terminar el registro se redirige acá con ?registrado=true.
    if (params['registrado']) {
      this.infoMessage.set('Cuenta creada correctamente. Ya podés ingresar.');
    }
  }

  /**
   * Envía las credenciales al backend.
   *
   * @returns void
   */
  onSubmit(): void {
    // markAllAsTouched marca todos los campos como "tocados" para que los
    // mensajes de error aparezcan aunque el usuario no haya entrado a ninguno.
    // Sin esto, pulsar "Ingresar" con el formulario vacío no mostraría nada.
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    this.infoMessage.set('');

    // getRawValue() devuelve los valores con sus tipos correctos gracias a
    // nonNullable, evitando tener que comprobar undefined en cada campo.
    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        // El servicio ya guardó al usuario en su signal, así que el menú se
        // actualiza solo. Acá únicamente hay que navegar.
        this.router.navigateByUrl(this.redirectUrl);
      },
      error: (error: ApiError) => {
        this.errorMessage.set(error.message);
        this.submitting.set(false);
      },
    });
  }

  /**
   * Indica si un campo debe mostrar su mensaje de error.
   *
   * Se exige que esté "tocado" para no acusar al usuario de dejar vacío un
   * campo en el que todavía no escribió nada.
   *
   * @param fieldName Nombre del campo del formulario.
   * @returns True si el campo es inválido y ya fue tocado.
   */
  hasError(fieldName: 'email' | 'password'): boolean {
    const control = this.form.controls[fieldName];
    return control.invalid && control.touched;
  }
}
