import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

/**
 * Autenticación para SISTEMAS, no para personas.
 *
 * Diferencia con JwtGuard:
 *   - JwtGuard  → identifica a un usuario humano que inició sesión (token con
 *                 vencimiento corto, viaja en cookie).
 *   - ApiKeyGuard → identifica a una aplicación aliada que consume la API de
 *                 servidor a servidor. No hay login, no hay sesión: es una
 *                 credencial larga y fija que se entrega al integrar.
 *
 * Las claves válidas viven en la variable de entorno PARTNER_API_KEYS, separadas
 * por coma. Que sean varias permite ROTARLAS sin cortar el servicio: se agrega
 * la nueva, se avisa al aliado, y cuando migró se borra la vieja.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Header estándar para credenciales de máquina.
    const provided = request.header('x-api-key');

    if (!provided) {
      throw new UnauthorizedException('Falta el header X-API-Key');
    }

    const allowed = (process.env.PARTNER_API_KEYS ?? '')
      .split(',')
      .map((key) => key.trim())
      .filter(Boolean);

    if (allowed.length === 0) {
      // Sin claves configuradas se rechaza todo. 
      this.logger.error('PARTNER_API_KEYS no está configurada');
      throw new UnauthorizedException('Credencial de API no válida');
    }

    if (!allowed.some((key) => this.matches(key, provided))) {
      throw new UnauthorizedException('Credencial de API no válida');
    }

    return true;
  }

  /**
   * Comparación en tiempo constante.
   */
  private matches(expected: string, provided: string): boolean {
    const a = Buffer.from(expected);
    const b = Buffer.from(provided);
    
    if (a.length !== b.length) return false;

    return timingSafeEqual(a, b);
  }
}
