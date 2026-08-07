/**
 * =============================================================================
 * ARCHIVO:   app.ts
 * PROPÓSITO: Componente raíz. Es el contenedor dentro del cual se dibujan
 *            todas las pantallas de la aplicación.
 * =============================================================================
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { Navbar } from './shared/components/navbar/navbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  /** Servicio de autenticación, para restaurar la sesión al arrancar. */
  private readonly authService = inject(AuthService);

  /** Router de Angular, para saber en qué pantalla estamos. */
  private readonly router = inject(Router);

  /**
   * Indica si todavía se está comprobando si hay sesión.
   *
   * Empieza en true para no dibujar nada hasta tener la respuesta. Sin esto,
   * al recargar con F5 el menú aparecería un instante sin el nombre del
   * usuario y luego daría un salto al completarse la comprobación.
   */
  readonly checkingSession = signal(true);

  /**
   * Controla si se muestra el menú de navegación.
   *
   * En login y registro no se muestra: son pantallas a las que se entra sin
   * sesión, y un menú con opciones que llevan a rutas protegidas solo
   * confundiría al usuario.
   */
  readonly showNavbar = signal(false);

  /**
   * Se ejecuta una sola vez, cuando el componente raíz se crea.
   *
   * @returns void
   */
  ngOnInit(): void {
    // 1. RESTAURAR LA SESIÓN.
    // Como la cookie es httpOnly, la app no puede leerla: hay que preguntarle
    // al backend quién es el usuario. Esto es lo que hace que recargar con F5
    // no expulse a alguien que sí tenía una sesión válida.
    this.authService.loadSession().subscribe({
      next: () => this.checkingSession.set(false),
      error: () => this.checkingSession.set(false),
    });

    // 2. DECIDIR SI EL MENÚ SE MUESTRA, según la ruta actual.
    // El router emite muchos tipos de evento; `filter` deja pasar solo los de
    // navegación terminada, que son los que traen la URL definitiva.
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      )
      .subscribe((event) => {
        const isAuthScreen =
          event.urlAfterRedirects.startsWith('/login') ||
          event.urlAfterRedirects.startsWith('/registro');

        this.showNavbar.set(!isAuthScreen);
      });
  }
}
