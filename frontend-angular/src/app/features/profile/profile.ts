/**
 * =============================================================================
 * ARCHIVO:   profile.ts
 * PROPÓSITO: Opción de menú "Perfil". Muestra y permite editar los datos
 *            personales del usuario.
 * API:       GET /api/users/me  (consultar)
 *            PUT /api/users/me  (actualizar)
 * =============================================================================
 */

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiError } from '../../core/models/api.model';
import { AuthUser, UserRole } from '../../core/models/user.model';
import { ProfileService } from '../../core/services/profile.service';
import { Alert } from '../../shared/components/alert/alert';
import { Loading } from '../../shared/components/loading/loading';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, Alert, Loading],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);

  /** Datos completos del usuario, incluidos los que no se pueden editar. */
  readonly user = signal<AuthUser | null>(null);

  /** True mientras se carga el perfil. */
  readonly loading = signal(true);

  /** True mientras se guardan los cambios. */
  readonly saving = signal(false);

  /** Mensaje de error. */
  readonly errorMessage = signal('');

  /** Mensaje de confirmación tras guardar. */
  readonly successMessage = signal('');

  /**
   * Formulario con los campos editables.
   *
   * Solo están acá los que acepta el UpdateProfileDto del backend.
   */
  readonly form = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.maxLength(50)]],
    displayName: ['', [Validators.maxLength(50)]],
    bio: ['', [Validators.maxLength(500)]],
    phone: [''],
    city: [''],
  });

  /**
   * Inicial que se muestra en el círculo del avatar.
   *
   * Se calcula en TypeScript en lugar de usar un pipe en la plantilla
   */
  readonly initial = computed(() => {
    const currentUser = this.user();

    if (!currentUser) {
      return '';
    }

    const source = currentUser.profile?.firstName || currentUser.email;

    return source.charAt(0).toUpperCase();
  });

  /** Traducción de los roles del backend al español. */
  private readonly roleLabels: Record<UserRole, string> = {
    STUDENT: 'Estudiante',
    TUTOR: 'Tutor',
    ADMIN: 'Administrador',
    SUPER_ADMIN: 'Super administrador',
  };

  /**
   * Carga el perfil al abrir la pantalla.
   *
   * @returns void
   */
  ngOnInit(): void {
    this.profileService.getMyProfile().subscribe({
      next: (user) => {
        this.user.set(user);

        // patchValue rellena el formulario con los datos recibidos.
        // Se usa en lugar de setValue porque este último exige TODOS los
        // campos y fallaría si el perfil todavía no tiene alguno cargado.
        // Los `?? ''` convierten los null del backend en texto vacío, que es
        // lo que un input espera: con null, Angular avisa por consola.
        this.form.patchValue({
          firstName: user.profile?.firstName ?? '',
          lastName: user.profile?.lastName ?? '',
          displayName: user.profile?.displayName ?? '',
          bio: user.profile?.bio ?? '',
          phone: user.profile?.phone ?? '',
          city: user.profile?.city ?? '',
        });

        this.loading.set(false);
      },
      error: (error: ApiError) => {
        this.errorMessage.set(error.message);
        this.loading.set(false);
      },
    });
  }

  /**
   * Guarda los cambios del perfil.
   *
   * @returns void
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.profileService.updateMyProfile(this.form.getRawValue()).subscribe({
      next: (updated) => {
        // Se guarda la respuesta del SERVIDOR, no lo que se envió. Si el
        // backend recortó o normalizó algún valor, la pantalla muestra lo
        // que realmente quedó guardado y no lo que el usuario tecleó.
        this.user.set(updated);
        this.successMessage.set('Tus datos se guardaron correctamente.');
        this.saving.set(false);
      },
      error: (error: ApiError) => {
        this.errorMessage.set(error.message);
        this.saving.set(false);
      },
    });
  }

  /**
   * Traduce el rol del usuario.
   *
   * @param role Rol en inglés que devuelve el backend.
   * @returns Etiqueta en español.
   */
  roleLabel(role: UserRole): string {
    return this.roleLabels[role];
  }

  /**
   * Indica si un campo debe mostrar su mensaje de error.
   *
   * @param fieldName Nombre del campo del formulario.
   * @returns True si el campo es inválido y ya fue tocado.
   */
  hasError(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!control && control.invalid && control.touched;
  }

  /**
   * Da formato legible a una fecha ISO.
   *
   * @param isoDate Fecha en formato ISO.
   * @returns Fecha en formato local colombiano.
   */
  formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
