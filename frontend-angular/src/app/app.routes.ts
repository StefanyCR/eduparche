/**
 * =============================================================================
 * ARCHIVO:   app.routes.ts
 * PROPÓSITO: Mapa de navegación de la aplicación. Relaciona cada URL con el
 *            componente que debe mostrarse, y marca cuáles requieren sesión.
 * =============================================================================
 */

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

/**
 * Definición de rutas.
 *
 * Todas usan `loadComponent` en lugar de importar el componente directamente.
 * Eso es CARGA PEREZOSA (lazy loading)
 */
export const routes: Routes = [
  // ─── Rutas públicas ───────────────────────────────────────────────────────
  {
    path: 'login',
    title: 'Iniciar sesión · EduParche',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    title: 'Crear cuenta · EduParche',
    loadComponent: () =>
      import('./features/auth/register/register').then((m) => m.Register),
  },

  // ─── Rutas privadas ───────────────────────────────────────────────────────
  // canActivate ejecuta el guard ANTES de cargar el componente: si no hay
  // sesión, la pantalla ni siquiera llega a descargarse.
  {
    path: 'catalogo',
    title: 'Catálogo · EduParche',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/catalog/catalog').then((m) => m.Catalog),
  },
  {
    path: 'mis-cursos',
    title: 'Mis cursos · EduParche',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/my-courses/my-courses').then((m) => m.MyCourses),
  },
  {
    path: 'perfil',
    title: 'Mi perfil · EduParche',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/profile').then((m) => m.Profile),
  },

  // ─── Redirecciones ────────────────────────────────────────────────────────
  // La raíz lleva al catálogo. Si no hay sesión, el guard desvía al login.
  // pathMatch 'full' es obligatorio en la ruta vacía: sin él, Angular la haría
  // coincidir con TODAS las URLs y nunca se llegaría a ninguna otra pantalla.
  { path: '', redirectTo: 'catalogo', pathMatch: 'full' },

  // Comodín: cualquier URL que no exista cae acá. Va SIEMPRE al final,
  // porque Angular evalúa las rutas en orden y esta atrapa todo lo que llegue.
  { path: '**', redirectTo: 'catalogo' },
];
