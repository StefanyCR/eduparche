/**
 * =============================================================================
 * ARCHIVO:   app.spec.ts
 * PROPÓSITO: Pruebas unitarias del componente raíz.
 *
 * El CLI genera una prueba de ejemplo que busca el texto "Hello, ..." de la
 * plantilla inicial. 
 * =============================================================================
 */

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        // El componente raíz inyecta AuthService, que a su vez usa HttpClient.
        provideHttpClient(),
        provideHttpClientTesting(),

        // También inyecta Router. Se le pasa una lista de rutas vacía: acá no
        // se está probando la navegación.
        provideRouter([]),
      ],
    }).compileComponents();
  });

  it('debería crearse correctamente', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    expect(app).toBeTruthy();
  });

  it('debería empezar comprobando si hay sesión', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    // checkingSession arranca en true para no dibujar la aplicación hasta
    // saber si el usuario tiene una sesión activa. Eso es lo que evita el
    // parpadeo de ver el login un instante antes de saltar al catálogo.
    expect(app.checkingSession()).toBe(true);
  });

  it('debería ocultar el menú mientras comprueba la sesión', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    // El menú solo aparece en las pantallas privadas, nunca en login/registro
    // ni durante la comprobación inicial.
    expect(app.showNavbar()).toBe(false);
  });
});
