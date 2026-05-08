import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserStatus } from '../../generated/prisma';
import { userSelect } from '../users/user.selects';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Ya existe una cuenta con ese correo');
    }

    const age = this.calcularEdad(dto.birthDate);
    const isMinor = age < 18;
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          status: isMinor ? UserStatus.PENDING_APPROVAL : UserStatus.ACTIVE,
        },
      });

      await tx.profile.create({
        data: {
          userId: newUser.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
          birthDate: new Date(dto.birthDate),
          documentType: dto.documentType,
          documentNumber: dto.documentNumber,
        },
      });

      if (isMinor) {
        await tx.minorApprovalRequest.create({
          data: {
            userId: newUser.id,
            letter: dto.minorLetter ?? null,
          },
        });
      }

      return newUser;
    });

    if (isMinor) {
      return {
        requiresApproval: true as const,
        message:
          'Tu cuenta fue creada. Un administrador revisará tu solicitud de acceso como menor de edad.',
      };
    }

    const userData = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: userSelect,
    });

    return {
      requiresApproval: false as const,
      access_token: this.signToken(user.id, user.email, user.role),
      user: userData,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    if (user.status === UserStatus.PENDING_APPROVAL) {
      throw new UnauthorizedException(
        'Tu cuenta está pendiente de aprobación por un administrador',
      );
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Tu cuenta no está activa');
    }

    const userData = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: userSelect,
    });

    return {
      access_token: this.signToken(user.id, user.email, user.role),
      user: userData,
    };
  }

  private signToken(userId: string, email: string, role: string) {
    return this.jwt.sign({ sub: userId, email, role });
  }

  private calcularEdad(birthDate: string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }
}
