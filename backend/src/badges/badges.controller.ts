import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { BadgesService } from './badges.service';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { UpdateBadgeDto } from './dto/update-badge.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../generated/prisma';

// Todas las rutas de este controlador empiezan con /badges
@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  // GET /badges — cualquier usuario autenticado puede ver las insignias disponibles
  @Get()
  @UseGuards(JwtGuard)
  findAll() {
    return this.badgesService.findAll();
  }

  // POST /badges — solo el admin puede crear insignias nuevas
  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: CreateBadgeDto) {
    return this.badgesService.create(dto);
  }

  // PATCH /badges/:id — el admin edita una insignia existente
  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateBadgeDto) {
    return this.badgesService.update(id, dto);
  }

  // DELETE /badges/:id — el admin elimina una insignia (solo si nadie la tiene aún)
  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.badgesService.remove(id);
  }
}
