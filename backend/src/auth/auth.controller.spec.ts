import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/**
 * Cobertura de los casos de prueba CP-10 (cookie de sesión) y CP-11
 * (cierre de sesión) del plan de pruebas del módulo de login (Guía 9).
 */
describe('AuthController', () => {
  let controller: AuthController;
  let authService: { login: jest.Mock<(...args: any[]) => Promise<any>> };

  // Se construye el mock de Response sin tiparlo como Partial<Response>: así
  // los jest.fn() conservan su tipo de mock y se pueden aserciones sobre
  // `cookie`/`clearCookie` directamente, en vez de sobre `res.cookie`.
  const mockResponse = () => {
    const cookie = jest.fn().mockReturnThis();
    const clearCookie = jest.fn().mockReturnThis();
    const res = { cookie, clearCookie } as unknown as Response;
    return { res, cookie, clearCookie };
  };

  beforeEach(async () => {
    authService = { login: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  // CP-10: la cookie de sesión debe ser httpOnly y sameSite=lax
  it('guarda el access_token en una cookie httpOnly al iniciar sesión', async () => {
    const fakeUser = { id: 'user-1', email: 'estudiante@eduparche.co' };
    authService.login.mockResolvedValue({
      access_token: 'fake.jwt.token',
      user: fakeUser,
    });
    const { res, cookie } = mockResponse();

    const result = await controller.login(
      { email: fakeUser.email, password: 'clave-correcta-123' },
      res,
    );

    expect(cookie).toHaveBeenCalledWith(
      'ep_token',
      'fake.jwt.token',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
    );
    expect(result).toEqual({ user: fakeUser });
  });

  // CP-11: logout debe limpiar la cookie de sesión
  it('limpia la cookie de sesión al cerrar sesión', () => {
    const { res, clearCookie } = mockResponse();

    const result = controller.logout(res);

    expect(clearCookie).toHaveBeenCalledWith('ep_token', { path: '/' });
    expect(result).toEqual({ message: 'Sesión cerrada' });
  });
});
