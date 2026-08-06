import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserStatus } from '../../generated/prisma';
import { userSelect } from '../users/user.selects';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: MailService,
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

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { profile: true },
    });

    // Respuesta genérica siempre — no revelar si el email existe
    if (!user) return;

    // Invalida tokens anteriores del mismo usuario
    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
      },
    });

    await this.mail.sendPasswordReset(
      user.email,
      rawToken,
      user.profile?.firstName ?? 'usuario',
    );
  }

  async resetPassword(dto: ResetPasswordDto) {
    const hashedToken = crypto.createHash('sha256').update(dto.token).digest('hex');

    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token: hashedToken },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('El enlace no es válido o ya expiró');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);
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
