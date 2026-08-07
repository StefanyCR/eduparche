import { IsString, Matches } from 'class-validator';

/**
 * Cuerpo de POST /api/v1/enrollments — el estudiante se inscribe a sí mismo.
 *
 * Solo pide el curso. El estudiante NO viaja en el cuerpo: sale del token JWT.
 * Si lo aceptáramos por body, cualquiera podría inscribir a otra persona con
 * solo cambiar un campo del JSON.
 */
export class CreateSelfEnrollmentDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'courseSlug solo admite minúsculas, números y guiones',
  })
  courseSlug: string;
}
