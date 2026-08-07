import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CourseLevel, ContentStatus } from '../../../generated/prisma';

/**
 * Cuerpo de POST /api/v1/courses (creación de curso).
 *
 * Los DTO son la ÚNICA puerta de entrada de datos externos al sistema.
 * Con `whitelist: true` en el ValidationPipe global, cualquier propiedad que no
 * esté declarada acá se descarta; con `forbidNonWhitelisted: true` además se
 * responde 400. Eso bloquea el "mass assignment": que alguien mande
 * `{"title":"x","createdById":"<id-de-otro>"}` y escriba un campo que no debería.
 */
export class CreateCourseDto {
  @IsString()
  @MinLength(5, { message: 'El título debe tener al menos 5 caracteres' })
  @MaxLength(150)
  title: string;

  // El slug es la clave pública del curso: aparece en URLs y lo usan los
  // sistemas aliados. Se restringe a minúsculas, números y guiones para que
  // sea seguro dentro de una URL sin necesidad de codificarlo.
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'El slug solo admite minúsculas, números y guiones (ej: java-basico)',
  })
  @MaxLength(150)
  slug: string;

  @IsString()
  @MinLength(20, { message: 'La descripción debe tener al menos 20 caracteres' })
  description: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsEnum(CourseLevel)
  level: CourseLevel;

  @IsString()
  categoryId: string;

  // Al crear, lo normal es dejarlo en DRAFT (valor por defecto del modelo) y
  // publicarlo después con un PATCH, cuando ya tenga módulos cargados.
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  // ISO 8601 ("2026-08-15T09:00:00.000Z"). Se exige el formato completo con
  // zona horaria: "15/08/2026" es ambiguo según el país que lo lea.
  @IsOptional()
  @IsDateString({}, { message: 'startDate debe ser una fecha ISO 8601' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'endDate debe ser una fecha ISO 8601' })
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  onlineHours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  autonomousHours?: number;

  // Curso que hay que haber completado antes de poder inscribirse a este.
  @IsOptional()
  @IsString()
  prerequisiteCourseId?: string;
}
