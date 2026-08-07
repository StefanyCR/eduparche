import { Module } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';

/**
 * Módulo de inscripciones.
 *
 * Exporta EnrollmentsService porque CoursesModule también lo necesita:
 * el endpoint de aliados (POST /api/v1/public/enrollments) usa exactamente
 * la misma lógica que el de autoservicio. Compartir el servicio en lugar de
 * copiar el código es lo que garantiza que ambos caminos apliquen las mismas
 * reglas de negocio.
 */
@Module({
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
