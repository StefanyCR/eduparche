import { PartialType } from '@nestjs/mapped-types';
import { CreateBadgeDto } from './create-badge.dto';

// PartialType hace que todos los campos de CreateBadgeDto sean opcionales.
// Así el admin puede editar solo el nombre, solo la descripción, etc.
export class UpdateBadgeDto extends PartialType(CreateBadgeDto) {}
