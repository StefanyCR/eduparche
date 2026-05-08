import { SetMetadata } from '@nestjs/common';
import { Role } from '../../../generated/prisma';

export const ROLES_KEY = 'roles';

// Uso: @Roles(Role.ADMIN, Role.SUPER_ADMIN)
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
