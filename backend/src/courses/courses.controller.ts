import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { QueryCoursesDto } from './dto/query-courses.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { ReplaceCourseDto, UpdateCourseDto } from './dto/update-course.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../../generated/prisma';

/**
 * CRUD interno de cursos — ruta base /api/v1/courses
 *
 * Lo consume el panel de administración (Next.js), no sistemas externos.
 * Autenticación por JWT en cookie, igual que el resto del backend.
 *
 * Este controlador NO usa el sobre de respuesta ni el filtro de errores de la
 * API pública: devuelve los objetos directamente, que es la forma que ya
 * esperan los componentes del frontend.
 */
@Controller({ path: 'courses', version: '1' })
@UseGuards(JwtGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  /**
   * GET /api/v1/courses
   * Listado de administración: incluye borradores y deshabilitados.
   * Los tutores también pueden verlo (necesitan consultar sus cursos).
   */
  @Get()
  @Roles(Role.ADMIN, Role.TUTOR)
  findAll(@Query() query: QueryCoursesDto) {
    return this.coursesService.findAllForAdmin(query);
  }

  /** GET /api/v1/courses/:id — detalle por id interno. */
  @Get(':id')
  @Roles(Role.ADMIN, Role.TUTOR)
  findOne(@Param('id') id: string) {
    return this.coursesService.findOneForAdmin(id);
  }

  /**
   * POST /api/v1/courses — crea un curso. Responde 201.
   *
   * `createdById` sale del token, NUNCA del cuerpo de la petición. Si lo
   * tomáramos del body, cualquiera podría crear cursos a nombre de otra
   * persona con solo cambiar un campo del JSON.
   */
  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateCourseDto, @CurrentUser() user: { id: string }) {
    return this.coursesService.create(dto, user.id);
  }

  /**
   * PUT /api/v1/courses/:id — reemplazo completo.
   *
   * Hay que enviar todos los campos: los que se omitan quedan en null.
   * Es idempotente — repetir la misma petición deja el curso igual.
   */
  @Put(':id')
  @Roles(Role.ADMIN)
  replace(@Param('id') id: string, @Body() dto: ReplaceCourseDto) {
    return this.coursesService.replace(id, dto);
  }

  /**
   * PATCH /api/v1/courses/:id — actualización parcial.
   * Para cambios puntuales, como publicar: {"status": "ACTIVE"}.
   */
  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, dto);
  }
}
