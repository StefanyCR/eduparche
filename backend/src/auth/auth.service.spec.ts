import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UserStatus } from '../../generated/prisma';

type AsyncMock = jest.Mock<(...args: any[]) => Promise<any>>;

/**
 * Cobertura de los casos de prueba CP-01, CP-02, CP-03, CP-07 y CP-08 del
 * plan de pruebas del módulo de login (Guía 9).
 */
describe('AuthService.login', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: AsyncMock; findUniqueOrThrow: AsyncMock };
  };
  let jwt: { sign: jest.Mock };

  // Hash real de bcrypt, calculado una sola vez para no pagar el costo del
  // algoritmo (factor 10) en cada test.
  const PLAIN_PASSWORD = 'clave-correcta-123';
  let realHash: string;

  const baseUser = {
    id: 'user-1',
    email: 'estudiante@eduparche.co',
    role: 'STUDENT',
    status: UserStatus.ACTIVE,
  };

  beforeAll(async () => {
    realHash = await bcrypt.hash(PLAIN_PASSWORD, 10);
  });

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn() },
    };
    jwt = { sign: jest.fn().mockReturnValue('fake.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: MailService, useValue: {} },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // CP-01: ingreso exitoso
  it('devuelve un access_token y los datos del usuario cuando las credenciales son correctas', async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...baseUser,
      passwordHash: realHash,
    });
    prisma.user.findUniqueOrThrow.mockResolvedValue(baseUser);

    const result = await service.login({
      email: baseUser.email,
      password: PLAIN_PASSWORD,
    });

    expect(result.access_token).toBe('fake.jwt.token');
    expect(result.user).toEqual(baseUser);
    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ sub: baseUser.id, email: baseUser.email }),
    );
  });

  // CP-02: contraseña errónea
  it('rechaza el login con 401 cuando la contraseña no coincide con el hash', async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...baseUser,
      passwordHash: realHash,
    });

    await expect(
      service.login({ email: baseUser.email, password: 'clave-incorrecta' }),
    ).rejects.toThrow(UnauthorizedException);
    await expect(
      service.login({ email: baseUser.email, password: 'clave-incorrecta' }),
    ).rejects.toThrow('Correo o contraseña incorrectos');
  });

  // CP-03: usuario inexistente
  it('rechaza el login con el mismo mensaje genérico cuando el correo no existe', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'nadie@eduparche.co', password: 'lo-que-sea-123' }),
    ).rejects.toThrow('Correo o contraseña incorrectos');
  });

  // CP-07: cuenta pendiente de aprobación (menor de edad)
  it('rechaza el login de una cuenta PENDING_APPROVAL aunque la contraseña sea correcta', async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...baseUser,
      status: UserStatus.PENDING_APPROVAL,
      passwordHash: realHash,
    });

    await expect(
      service.login({ email: baseUser.email, password: PLAIN_PASSWORD }),
    ).rejects.toThrow('Tu cuenta está pendiente de aprobación por un administrador');
  });

  // CP-08: cuenta inactiva o rechazada
  it.each([UserStatus.INACTIVE, UserStatus.REJECTED])(
    'rechaza el login de una cuenta en estado %s',
    async (status) => {
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        status,
        passwordHash: realHash,
      });

      await expect(
        service.login({ email: baseUser.email, password: PLAIN_PASSWORD }),
      ).rejects.toThrow('Tu cuenta no está activa');
    },
  );

  // CP-09: el hash nunca es la contraseña en texto plano
  it('nunca almacena ni compara la contraseña en texto plano (verificación de hash)', async () => {
    expect(realHash).not.toBe(PLAIN_PASSWORD);
    expect(realHash.startsWith('$2')).toBe(true); // formato bcrypt

    prisma.user.findUnique.mockResolvedValue({
      ...baseUser,
      passwordHash: realHash,
    });
    prisma.user.findUniqueOrThrow.mockResolvedValue(baseUser);

    // Si el servicio comparara el password contra sí mismo en texto plano en
    // vez de usar bcrypt.compare contra el hash, este login fallaría.
    await expect(
      service.login({ email: baseUser.email, password: PLAIN_PASSWORD }),
    ).resolves.toBeDefined();
  });
});

/**
 * CP-13: modificación de datos — cambio de contraseña vía reset-password.
 * Es el único flujo del módulo de autenticación que actualiza un registro
 * existente (User.passwordHash) en vez de solo leerlo, por eso se separa del
 * resto de casos de login.
 */
describe('AuthService.resetPassword', () => {
  let service: AuthService;
  let prisma: {
    passwordResetToken: { findUnique: AsyncMock; update: AsyncMock };
    user: { update: AsyncMock };
    $transaction: AsyncMock;
  };

  const userId = 'user-1';

  beforeEach(async () => {
    prisma = {
      passwordResetToken: { findUnique: jest.fn(), update: jest.fn() },
      user: { update: jest.fn() },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { sign: jest.fn() } },
        { provide: MailService, useValue: {} },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('actualiza el passwordHash del usuario y marca el token de reset como usado', async () => {
    const rawToken = 'token-en-claro-de-la-url';
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const record = {
      id: 'reset-1',
      userId,
      token: hashedToken,
      usedAt: null as Date | null,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    };
    prisma.passwordResetToken.findUnique.mockResolvedValue(record);
    prisma.user.update.mockResolvedValue({ id: userId });
    prisma.passwordResetToken.update.mockResolvedValue(record);
    prisma.$transaction.mockResolvedValue(undefined);

    await service.resetPassword({ token: rawToken, password: 'clave-nueva-456' });

    // La contraseña nueva se guarda como hash, nunca en texto plano.
    const updateCall = prisma.user.update.mock.calls[0][0] as {
      where: { id: string };
      data: { passwordHash: string };
    };
    expect(updateCall.where).toEqual({ id: userId });
    expect(updateCall.data.passwordHash).not.toBe('clave-nueva-456');
    expect(await bcrypt.compare('clave-nueva-456', updateCall.data.passwordHash)).toBe(true);

    // El token de un solo uso queda invalidado tras usarse.
    expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
      where: { id: record.id },
      data: { usedAt: expect.any(Date) },
    });
  });

  it('rechaza el cambio de contraseña con un token vencido', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'reset-2',
      userId,
      token: 'x',
      usedAt: null,
      expiresAt: new Date(Date.now() - 1000), // ya venció
    });

    await expect(
      service.resetPassword({ token: 'cualquiera', password: 'clave-nueva-456' }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rechaza el cambio de contraseña con un token que ya fue usado', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'reset-3',
      userId,
      token: 'x',
      usedAt: new Date(), // ya se usó antes
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await expect(
      service.resetPassword({ token: 'cualquiera', password: 'clave-nueva-456' }),
    ).rejects.toThrow('El enlace no es válido o ya expiró');
  });
});
