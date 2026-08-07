import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateSelfEnrollmentDto } from './dto/create-self-enrollment.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../../generated/prisma';

/**
 * Inscripciones del usuario autenticado — /api/v1/enrollments
 */
@Controller({ path: 'enrollments', version: '1' })
@UseGuards(JwtGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  /**
   * GET /api/v1/enrollments/me — mis cursos con progreso.
   *
   * El id sale del token, y un id que no se acepta por parámetro es un id que no se puede falsear.
   */
  @Get('me')
  @Roles(Role.STUDENT, Role.TUTOR, Role.ADMIN)
  findMine(@CurrentUser() user: { id: string }) {
    return this.enrollmentsService.findMyEnrollments(user.id);
  }

  /**
   * POST /api/v1/enrollments — me inscribo en un curso.
   *
   * Cuerpo: { "courseSlug": "intro-python" }
   *
   * Códigos:
   *   201 → inscripción creada
   *   400 → slug con formato inválido
   *   401 → sin sesión o cuenta inactiva
   *   403 → el rol no puede inscribirse (solo estudiantes)
   *   404 → el curso no existe o no está publicado
   *   409 → ya estabas inscrito
   *   422 → falta completar el curso prerrequisito
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.STUDENT)
  enroll(
    @Body() dto: CreateSelfEnrollmentDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.enrollmentsService.enrollSelf(user.id, dto.courseSlug);
  }
}
