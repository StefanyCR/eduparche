import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Uso: @UseGuards(JwtGuard) en cualquier endpoint protegido
// Rechaza con 401 si el token JWT es inválido o falta
@Injectable()
export class JwtGuard extends AuthGuard('jwt') {}
