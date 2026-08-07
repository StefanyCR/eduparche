import { IsBoolean, IsEmail, IsString, Matches, Equals } from 'class-validator';

/**
 * Cuerpo de POST /api/v1/public/enrollments
 *
 * Permite que un sistema aliado inscriba a una persona en un curso de EduParche
 * sin que esa persona tenga que entrar al portal.
 *
 * Se identifica al estudiante por CORREO y al curso por SLUG, no por sus ids
 * internos (cuid). Motivo: un sistema externo no conoce —ni debería conocer—
 * los identificadores internos de nuestra base de datos. Exponerlos acopla al
 * aliado a nuestro esquema y nos impide cambiarlo después.
 */
export class CreatePublicEnrollmentDto {
  @IsEmail({}, { message: 'studentEmail debe ser un correo válido' })
  studentEmail: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'courseSlug solo admite minúsculas, números y guiones',
  })
  courseSlug: string;

  /**
   * Constancia de que el estudiante autorizó la inscripción en el sistema
   * aliado. Se exige literalmente `true`: si llega `false` o no llega, la
   * petición se rechaza con 400 antes de tocar la base de datos.
   *
   * No es burocracia: la Ley 1581 de 2012 (Habeas Data) exige autorización
   * previa, expresa e informada del titular para tratar sus datos. Este campo
   * es la evidencia de que el aliado la obtuvo, y queda registrado en los logs
   * de la petición.
   */
  @IsBoolean()
  @Equals(true, {
    message:
      'Se requiere el consentimiento explícito del estudiante (consentGiven: true)',
  })
  consentGiven: boolean;
}
