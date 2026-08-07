/**
 * =============================================================================
 * ARCHIVO:   catalog.ts
 * PROPÓSITO: Opción de menú "Catálogo". Lista los cursos publicados y permite
 *            que el estudiante se inscriba.
 * API:       GET  /api/v1/catalog      (listar)
 *            POST /api/v1/enrollments  (inscribirse)
 * =============================================================================
 */

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ApiError } from '../../core/models/api.model';
import { CatalogCourse, CourseLevel } from '../../core/models/course.model';
import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '../../core/services/catalog.service';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { Alert } from '../../shared/components/alert/alert';
import { Loading } from '../../shared/components/loading/loading';

/** Opción del filtro por nivel. 'ALL' significa "sin filtrar". */
interface LevelFilter {
  value: CourseLevel | 'ALL';
  label: string;
}

@Component({
  selector: 'app-catalog',
  imports: [Alert, Loading],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
})
export class Catalog implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly authService = inject(AuthService);

  /**
   * Cursos recibidos del backend.
   *
   * Es un signal porque la app corre en modo zoneless: Angular no detecta automáticamente los cambios de datos, así que hay que avisarle con signals para que se redibuje la pantalla.
   * Se podría usar un BehaviorSubject, pero los signals son más simples y más modernos.
   */
  readonly courses = signal<CatalogCourse[]>([]);

  /** True mientras se descarga el catálogo. */
  readonly loading = signal(true);

  /** Error general de la pantalla (por ejemplo, si falla la carga). */
  readonly errorMessage = signal('');

  /** Mensaje de éxito tras inscribirse. */
  readonly successMessage = signal('');

  /**
   * Slug del curso que se está inscribiendo en este momento.
   *
   * Se guarda el slug y no un simple true/false para poder deshabilitar
   * únicamente el botón del curso en proceso, y no todos los de la pantalla.
   */
  readonly enrollingSlug = signal<string | null>(null);

  /** Texto escrito en el buscador. */
  readonly searchTerm = signal('');

  /** Nivel seleccionado en el filtro. */
  readonly selectedLevel = signal<CourseLevel | 'ALL'>('ALL');

  /** Solo los estudiantes pueden inscribirse; un admin recibiría un 403. */
  readonly canEnroll = this.authService.isStudent;

  /** Opciones del filtro por nivel. */
  readonly levelFilters: LevelFilter[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'BASIC', label: 'Básico' },
    { value: 'INTERMEDIATE', label: 'Intermedio' },
    { value: 'ADVANCED', label: 'Avanzado' },
  ];

  /** Traducción de los niveles del backend (en inglés) a español. */
  private readonly levelLabels: Record<CourseLevel, string> = {
    BASIC: 'Básico',
    INTERMEDIATE: 'Intermedio',
    ADVANCED: 'Avanzado',
  };

  /**
   * Cursos que realmente se muestran, tras aplicar buscador y filtro.
   *
   * `computed` crea un valor derivado que se recalcula SOLO cuando cambia
   * alguno de los signals que lee (courses, searchTerm o selectedLevel).
   * El filtrado se hace en memoria, sobre lo que ya se descargó: para un
   * catálogo formativo son pocos cursos y así se evita un viaje al servidor
   * por cada letra que se teclea.
   */
  readonly visibleCourses = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const level = this.selectedLevel();

    // Se recorre la lista una sola vez comprobando ambas condiciones a la vez.
    return this.courses().filter((course) => {
      const matchesLevel = level === 'ALL' || course.level === level;
      const matchesTerm = term === '' || course.title.toLowerCase().includes(term);
      return matchesLevel && matchesTerm;
    });
  });

  /** Cuántos de los cursos mostrados ya tiene el usuario. */
  readonly enrolledCount = computed(
    () => this.courses().filter((course) => course.isEnrolled).length,
  );

  /**
   * Carga el catálogo al abrir la pantalla.
   *
   * @returns void
   */
  ngOnInit(): void {
    this.loadCourses();
  }

  /**
   * Pide el catálogo al backend.
   *
   * @returns void
   */
  loadCourses(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    // pageSize 50 alcanza para un catálogo formativo. El backend no admite
    // más de 100 por página: es un límite de seguridad, no una preferencia.
    this.catalogService.getCourses({ page: 1, pageSize: 50 }).subscribe({
      next: (response) => {
        this.courses.set(response.items);
        this.loading.set(false);
      },
      error: (error: ApiError) => {
        this.errorMessage.set(error.message);
        this.loading.set(false);
      },
    });
  }

  /**
   * Inscribe al usuario en un curso.
   *
   * @param course Curso seleccionado.
   * @returns void
   */
  enroll(course: CatalogCourse): void {
    this.enrollingSlug.set(course.slug);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.enrollmentService.enroll(course.slug).subscribe({
      next: () => {
        this.successMessage.set(`Te inscribiste en "${course.title}".`);
        this.enrollingSlug.set(null);

        // Se recarga el catálogo para que la tarjeta pase a "Continuar".
        // Se pide de nuevo al servidor en lugar de cambiar el dato a mano
        // porque así el progreso y el número de inscritos quedan reales, no
        // adivinados por el navegador.
        this.loadCourses();
      },
      error: (error: ApiError) => {
        this.enrollingSlug.set(null);

        // Cada código significa algo distinto para el usuario. El backend
        // redacta en tercera persona porque esos mismos mensajes los consume
        // también la API de sistemas aliados; acá se reescriben en segunda.
        switch (error.status) {
          case 409:
            this.errorMessage.set('Ya estás inscrito en este curso.');
            break;
          case 422:
            this.errorMessage.set('Te falta completar el curso previo requerido.');
            break;
          case 403:
            this.errorMessage.set('Tu rol no permite inscribirse en cursos.');
            break;
          default:
            this.errorMessage.set(error.message);
        }
      },
    });
  }

  /**
   * Traduce el nivel del curso al español.
   *
   * @param level Nivel tal como lo devuelve el backend.
   * @returns Etiqueta en español para mostrar en la tarjeta.
   */
  levelLabel(level: CourseLevel): string {
    return this.levelLabels[level];
  }

  /**
   * Actualiza el texto del buscador.
   *
   * @param event Evento de escritura del input.
   * @returns void
   */
  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }
}
