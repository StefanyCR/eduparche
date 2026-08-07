import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { CatalogController } from './catalog.controller';
import { PublicCatalogController } from './public-catalog.controller';
import { EnrollmentsModule } from '../enrollments/enrollments.module';

/**
 * Módulo de cursos.
 *
 * Registra TRES controladores sobre un mismo servicio, uno por tipo de
 * consumidor. Cada uno tiene su propia autenticación:
 *
 *   CoursesController       → /api/v1/courses    admin y tutores   (cookie JWT)
 *   CatalogController       → /api/v1/catalog    usuario logueado  (cookie JWT)
 *   PublicCatalogController → /api/v1/public/*   sistemas aliados  (X-API-Key)
 *
 * Las reglas de negocio viven una sola vez, en CoursesService. Si mañana
 * cambia qué cuenta como "curso publicado", se corrige en un único lugar y
 * los tres caminos quedan consistentes.
 *
 * Se importa EnrollmentsModule porque el endpoint de aliados necesita crear
 * inscripciones, y esa lógica pertenece a EnrollmentsService.
 */
@Module({
  imports: [EnrollmentsModule],
  controllers: [CoursesController, CatalogController, PublicCatalogController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
