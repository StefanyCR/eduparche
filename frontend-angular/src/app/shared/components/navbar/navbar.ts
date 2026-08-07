/**
 * =============================================================================
 * ARCHIVO:   navbar.ts
 * PROPÓSITO: Menú de navegación principal. Muestra las opciones disponibles y
 *            permite cerrar sesión.
 *
 * Cada opción del menú consume una API distinta del backend:
 *   Catálogo   → GET /api/v1/catalog
 *   Mis cursos → GET /api/v1/enrollments/me
 *   Perfil     → GET /api/users/me
 * =============================================================================
 */

import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  // RouterLink genera la navegación sin recargar la página.
  // RouterLinkActive agrega una clase CSS al enlace de la ruta actual.
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  /** Servicio de autenticación: de acá sale el usuario actual. */
  private readonly authService = inject(AuthService);

  /** Router de Angular, para redirigir tras cerrar sesión. */
  private readonly router = inject(Router);

  /**
   * Usuario actual, expuesto para que la plantilla lo muestre.
   *
   * Es un signal: cuando alguien inicia o cierra sesión, este menú se
   * actualiza solo, sin que nadie tenga que avisarle.
   */
  readonly currentUser = this.authService.currentUser;

  /**
   * Nombre que se muestra en la esquina del menú.
   *
   * Se prefiere el `displayName` que el usuario eligió; si no configuró uno,
   * se arma con nombre y apellido; y si todavía no hay perfil, se cae al
   * correo, que siempre existe.
   */
  get displayName(): string {
    const profile = this.currentUser()?.profile;

    if (profile?.displayName) {
      return profile.displayName;
    }

    if (profile) {
      return `${profile.firstName} ${profile.lastName}`;
    }

    return this.currentUser()?.email ?? '';
  }

  /**
   * Cierra la sesión y devuelve al usuario a la pantalla de acceso.
   *
   * Se navega al login incluso si la petición falla: si el backend no
   * responde, igual conviene sacar al usuario de las pantallas privadas en
   * lugar de dejarlo en un estado ambiguo.
   *
   * @returns void
   */
  logout(): void {
    this.authService.logout().subscribe({
      next:  () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
