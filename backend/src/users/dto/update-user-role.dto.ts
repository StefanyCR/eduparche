import { IsEnum } from 'class-validator';
import { Role } from '../../../generated/prisma';

export class UpdateUserRoleDto {
  // Solo se aceptan roles que existen en la base de datos
  @IsEnum(Role)
  role: Role;
}
