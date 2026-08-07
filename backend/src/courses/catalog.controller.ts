import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { QueryCoursesDto } from './dto/query-courses.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * Catálogo para el usuario logueado — GET /api/v1/catalog
 *
 * Es el mismo catálogo que consumen los aliados, con una diferencia: cada
 * curso trae `isEnrolled`, calculado contra el usuario del token. Eso es lo
 * que permite que la tarjeta muestre "Continuar" en vez de "Inscribirse".
 *
 * Sin RolesGuard: cualquier rol autenticado puede MIRAR el catálogo.
 * La restricción de quién puede inscribirse está en EnrollmentsController.
 */
@Controller({ path: 'catalog', version: '1' })
@UseGuards(JwtGuard)
export class CatalogController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  findAll(
    @Query() query: QueryCoursesDto,
    @CurrentUser() user: { id: string },
  ) {
    // El id del usuario se pasa como segundo argumento, no como filtro del
    // query: no es algo que el cliente pueda elegir, sale del token.
    return this.coursesService.findPublicCatalog(query, user.id);
  }

  /**
   * GET /api/v1/catalog/:slug — ficha del curso con su temario.
   *
   * Reutiliza exactamente el mismo método que usa la API de aliados. El
   * temario es idéntico para ambos porque es la misma información pública;
   * lo que cambia es solo cómo se autentica quien pregunta.
   */
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.coursesService.findPublicBySlug(slug);
  }
}
