import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { userSelect } from './user.selects';
import { Role, UserStatus } from '../../generated/prisma';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    await this.prisma.profile.update({
      where: { userId },
      data: dto,
    });
    return this.getMe(userId);
  }

  async findAll(filters: { status?: UserStatus; role?: Role }) {
    return this.prisma.user.findMany({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.role   ? { role:   filters.role }   : {}),
      },
      select: {
        ...userSelect,
        minorRequest: {
          select: { letter: true, status: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Cambia el rol de un usuario (ej: de Estudiante a Tutor)
  async updateRole(userId: string, dto: UpdateUserRoleDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.prisma.user.update({
      where: { id: userId },
      data:  { role: dto.role },
      select: userSelect,
    });
  }

  async updateStatus(userId: string, dto: UpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.prisma.user.update({
      where: { id: userId },
      data:  { status: dto.status },
      select: userSelect,
    });
  }

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        totalPoints: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            displayName: true,
            avatar: true,
            bio: true,
            city: true,
            isPublic: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (!user.profile?.isPublic) throw new NotFoundException('Perfil no disponible');
    return user;
  }
}
