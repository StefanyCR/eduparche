/**
 * =============================================================================
 * ARCHIVO:   register.ts
 * PROPÓSITO: Pantalla de creación de cuenta.
 * API:       POST /api/auth/register
 *
 * DETALLE IMPORTANTE: registrarse NO inicia sesión. El backend no devuelve
 * cookie en este endpoint, así que al terminar hay que mandar al usuario al
 * login. Y si es menor de edad, la cuenta queda pendiente de aprobación y ni
 * siquiera tiene sentido mandarlo al login todavía.
 * =============================================================================
 */

import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '../../../core/models/api.model';
import { DocumentType } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { Alert } from '../../../shared/components/alert/alert';

/** Opciones del selector de tipo de documento. */
interface DocumentTypeOption {
  value: DocumentType;
  label: string;
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, Alert],
  templateUrl: './register.html',
  styleUrl: '../login/login.css',
})
export class Register {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /**
   * Tipos de documento que acepta el backend.
   *
   * Los valores deben coincidir exactamente con el enum `DocumentType` de
   * Prisma; si se envía otro texto, la API responde 400.
   */
  readonly documentTypes: DocumentTypeOption[] = [
    { value: 'CEDULA', label: 'Cédula de ciudadanía' },
    { value: 'TARJETA_IDENTIDAD', label: 'Tarjeta de identidad' },
    { value: 'PASAPORTE', label: 'Pasaporte' },
    { value: 'OTRO', label: 'Otro' },
  ];

  /**
   * Formulario de registro.
   *
   * Todos los campos son obligatorios porque así lo exige el RegisterDto del
   * backend: si falta uno, la respuesta es 400.
   */
  readonly form = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    // Mínimo 8 caracteres, igual que la regla @MinLength(8) del backend.
    password: ['', [Validators.required, Validators.minLength(8)]],
    // <input type="date"> produce "AAAA-MM-DD", que es el formato ISO que
    // espera el validador @IsDateString del backend.
    birthDate: ['', [Validators.required]],
    documentType: ['CEDULA' as DocumentType, [Validators.required]],
    documentNumber: ['', [Validators.required]],
  });

  /** True mientras se envía el formulario. */
  readonly submitting = signal(false);

  /** Mensaje de error del backend. */
  readonly errorMessage = signal('');

  /**
   * Mensaje que se muestra cuando la cuenta quedó pendiente de aprobación.
   *
   * Ocurre con los menores de edad: la plataforma exige la autorización de un
   * administrador antes de habilitar el acceso.
   */
  readonly approvalMessage = signal('');

  /**
   * Crea la cuenta.
   *
   * @returns void
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    this.authService.register(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.submitting.set(false);

        // CAMINO 1 — menor de edad: la cuenta existe pero está bloqueada
        // hasta que un administrador la apruebe. No se redirige, porque
        // todavía no podría iniciar sesión.
        if (response.requiresApproval) {
          this.approvalMessage.set(
            response.message ??
              'Tu cuenta quedó pendiente de aprobación por ser menor de edad. Te avisaremos por correo.',
          );
          this.form.reset();
          return;
        }

        // CAMINO 2 — mayor de edad: la cuenta ya está activa. Como el registro
        // no deja sesión iniciada, se manda al login con un aviso de éxito.
        this.router.navigate(['/login'], {
          queryParams: { registrado: 'true' },
        });
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
   * @param fieldName Nombre del campo del formulario.
   * @returns True si el campo es inválido y el usuario ya pasó por él.
   */
  hasError(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!control && control.invalid && control.touched;
  }
}
