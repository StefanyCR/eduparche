/**
 * =============================================================================
 * ARCHIVO:   my-courses.ts
 * PROPÓSITO: Opción de menú "Mis cursos". Muestra las inscripciones del usuario
 *            con su porcentaje de avance.
 * API:       GET /api/v1/enrollments/me
 * =============================================================================
 */

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiError } from '../../core/models/api.model';
import { CourseLevel } from '../../core/models/course.model';
import {
  EnrollmentStatus,
  MyEnrollment,
} from '../../core/models/enrollment.model';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { Alert } from '../../shared/components/alert/alert';
import { Loading } from '../../shared/components/loading/loading';

@Component({
  selector: 'app-my-courses',
  imports: [RouterLink, Alert, Loading],
  templateUrl: './my-courses.html',
  styleUrl: './my-courses.css',
})
export class MyCourses implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);

  /** Inscripciones del usuario, tal como llegan del backend. */
  readonly enrollments = signal<MyEnrollment[]>([]);

  /** True mientras se descargan los datos. */
  readonly loading = signal(true);

  /** Mensaje de error si falla la carga. */
  readonly errorMessage = signal('');

  /** Cursos que el usuario todavía está cursando. */
  readonly activeCount = computed(
    () => this.enrollments().filter((item) => item.status === 'ACTIVE').length,
  );

  /** Cursos que el usuario ya terminó. */
  readonly completedCount = computed(
    () => this.enrollments().filter((item) => item.status === 'COMPLETED').length,
  );

  /**
   * Promedio de avance de todos los cursos.
   *
   * Sirve como resumen rápido del progreso general del estudiante.
   */
  readonly averageProgress = computed(() => {
    const items = this.enrollments();

    // Guard contra la división por cero: sin cursos, el promedio es 0 y no NaN.
    if (items.length === 0) {
      return 0;
    }

    // reduce recorre la lista acumulando la suma de todos los porcentajes.
    const total = items.reduce((sum, item) => sum + item.progress, 0);

    return Math.round(total / items.length);
  });

  /** Traducción de los niveles del backend al español. */
  private readonly levelLabels: Record<CourseLevel, string> = {
    BASIC: 'Básico',
    INTERMEDIATE: 'Intermedio',
    ADVANCED: 'Avanzado',
  };

  /** Traducción de los estados de inscripción al español. */
  private readonly statusLabels: Record<EnrollmentStatus, string> = {
    ACTIVE: 'En curso',
    COMPLETED: 'Completado',
    WITHDRAWN: 'Abandonado',
  };

  /**
   * Carga las inscripciones al abrir la pantalla.
   *
   * @returns void
   */
  ngOnInit(): void {
    this.enrollmentService.getMyEnrollments().subscribe({
      next: (data) => {
        this.enrollments.set(data);
        this.loading.set(false);
      },
      error: (error: ApiError) => {
        this.errorMessage.set(error.message);
        this.loading.set(false);
      },
    });
  }

  /**
   * Traduce el nivel del curso.
   *
   * @param level Nivel en inglés que devuelve el backend.
   * @returns Etiqueta en español.
   */
  levelLabel(level: CourseLevel): string {
    return this.levelLabels[level];
  }

  /**
   * Traduce el estado de la inscripción.
   *
   * @param status Estado en inglés que devuelve el backend.
   * @returns Etiqueta en español.
   */
  statusLabel(status: EnrollmentStatus): string {
    return this.statusLabels[status];
  }

  /**
   * Da formato legible a una fecha ISO.
   *
   * @param isoDate Fecha en formato ISO, ej: "2026-05-09T20:33:34.007Z".
   * @returns Fecha en formato local colombiano, ej: "9 de mayo de 2026".
   */
  formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
