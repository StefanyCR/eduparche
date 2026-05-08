import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Uso: @CurrentUser() user: JwtPayload
// Extrae el usuario del request una vez que el JwtGuard lo validó
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
