import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBadgeDto {
  // Nombre único de la insignia, ej: "Primer inicio de sesión"
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  // Descripción corta que el usuario verá al ganar la insignia
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  description: string;

  // URL de la imagen o ícono (opcional — si no se sube imagen se puede usar un emoji)
  @IsOptional()
  @IsString()
  imageUrl?: string;

  // Si es false, la insignia existe en la BD pero no se puede ganar ni mostrar
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
