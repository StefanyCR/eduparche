import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { PublicCatalogController } from './public-catalog.controller';

/**
 * Módulo de cursos.
 *
 * Registra DOS controladores sobre UN solo servicio:
 *   CoursesController       → /api/v1/courses        (interno, JWT)
 *   PublicCatalogController → /api/v1/public/*       (externo, X-API-Key)
 *
 * Las reglas de negocio viven una sola vez, en CoursesService. Si mañana
 * cambia qué cuenta como "curso publicado", se corrige en un único lugar y
 * ambos caminos quedan consistentes.
 */
@Module({
  controllers: [CoursesController, PublicCatalogController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
