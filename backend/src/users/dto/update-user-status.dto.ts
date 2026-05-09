import { IsEnum } from 'class-validator';
import { UserStatus } from '../../../generated/prisma';

export class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  status: UserStatus;
}
