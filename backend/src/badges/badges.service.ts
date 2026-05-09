import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { UpdateBadgeDto } from './dto/update-badge.dto';

@Injectable()
export class BadgesService {
  constructor(private readonly prisma: PrismaService) {}

  // Devuelve todas las insignias con el conteo de usuarios que las tienen
  findAll() {
    return this.prisma.badge.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        // _count nos dice cuántos usuarios han ganado cada insignia,
        _count: { select: { users: true } },
      },
    });
  }

  // Crea una nueva insignia con los datos del formulario
  create(dto: CreateBadgeDto) {
    return this.prisma.badge.create({ data: dto });
  }

  // Actualiza solo los campos que el admin modificó
  async update(id: string, dto: UpdateBadgeDto) {
    const exists = await this.prisma.badge.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Insignia no encontrada');

    return this.prisma.badge.update({ where: { id }, data: dto });
  }

  // Elimina la insignia solo si ningún usuario la ha ganado todavía.
  // Si ya fue otorgada, lanzamos un error para no romper el historial.
  async remove(id: string) {
    const badge = await this.prisma.badge.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!badge) throw new NotFoundException('Insignia no encontrada');

    if (badge._count.users > 0) {
      throw new ConflictException(
        `No se puede eliminar: ${badge._count.users} usuario(s) ya tienen esta insignia`,
      );
    }

    return this.prisma.badge.delete({ where: { id } });
  }
}
