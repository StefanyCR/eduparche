import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { userSelect } from './user.selects';

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
