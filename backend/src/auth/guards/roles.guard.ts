import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../../generated/prisma';
import { ROLES_KEY } from '../decorators/roles.decorator';

// Uso: @UseGuards(JwtGuard, RolesGuard) + @Roles(Role.ADMIN)
// SUPER_ADMIN siempre pasa, sin importar los roles requeridos
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (!required) return true;

    const { user } = ctx.switchToHttp().getRequest();

    if (user?.role === Role.SUPER_ADMIN) return true;

    if (!required.includes(user?.role)) {
      throw new ForbiddenException('No tenés permisos para esta acción');
    }

    return true;
  }
}
