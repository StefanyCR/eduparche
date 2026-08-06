import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

// 7 días en milisegundos
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const COOKIE_NAME = 'ep_token';

const cookieOptions = {
  httpOnly: true,   // JS del browser no puede leerla (protección XSS)
  sameSite: 'lax',  // se envía en navegación normal y requests same-site
  secure: process.env.NODE_ENV === 'production', // solo HTTPS en prod
  path: '/',
  maxAge: COOKIE_MAX_AGE,
} as const;

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
  ) {
    const result = await this.authService.register(dto);

    if (result.requiresApproval) {
      return { requiresApproval: true, message: result.message };
    }

    return { requiresApproval: false };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    res.cookie(COOKIE_NAME, result.access_token, cookieOptions);
    return { user: result.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    return { message: 'Sesión cerrada' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto);
    return { message: 'Si ese correo está registrado, recibirás un enlace en breve.' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return { message: 'Contraseña actualizada correctamente.' };
  }
}
