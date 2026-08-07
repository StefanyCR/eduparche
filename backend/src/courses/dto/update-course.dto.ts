import { PartialType } from '@nestjs/mapped-types';
import { OmitType } from '@nestjs/mapped-types';
import { CreateCourseDto } from './create-course.dto';

/**
 * Cuerpo de PUT /api/v1/courses/:id — REEMPLAZO COMPLETO.
 *
 * PUT es idempotente: mandar el mismo cuerpo diez veces deja el recurso igual
 * que mandarlo una. Para que eso se cumpla, el cliente debe enviar el estado
 * COMPLETO del curso; los campos que omita se interpretan como "quedan vacíos",
 * no como "no los toques".
 *
 * Se omite `slug` a propósito: es la clave pública del curso y ya está en URLs
 * y sistemas externos. Cambiarlo rompería sus enlaces. Un cambio así se hace
 * con una migración explícita, no por un PUT.
 */
export class ReplaceCourseDto extends OmitType(CreateCourseDto, ['slug'] as const) {}

/**
 * Cuerpo de PATCH /api/v1/courses/:id — ACTUALIZACIÓN PARCIAL.
 *
 * PartialType vuelve opcionales todos los campos conservando sus validaciones:
 * si mandás `title`, se sigue exigiendo mínimo 5 caracteres; si no lo mandás,
 * el curso conserva el que tenía.
 *
 * Cuándo usa cada uno quien consume la API:
 *   PUT   → el formulario de edición completo del panel admin, que ya trae
 *           todos los campos cargados en pantalla.
 *   PATCH → cambios puntuales, como publicar un curso enviando solo
 *           {"status": "ACTIVE"}.
 */
export class UpdateCourseDto extends PartialType(ReplaceCourseDto) {}
