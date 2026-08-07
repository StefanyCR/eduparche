/**
 * =============================================================================
 * ARCHIVO:   user.model.ts
 * PROPÓSITO: Describe la forma de los datos de usuario que devuelve el backend.
 * API:       GET /api/users/me · POST /api/auth/login · POST /api/auth/register
 *
 * Estas interfaces son un CONTRATO con el backend. No generan código en el
 * navegador (TypeScript las borra al compilar): existen para que el editor
 * avise si se lee un campo que la API no devuelve, en vez de que aparezca
 * "undefined" en pantalla sin explicación.
 * =============================================================================
 */

/**
 * Roles disponibles en la plataforma.
 * Debe coincidir exactamente con el enum `Role` de Prisma en el backend.
 */
export type UserRole = 'STUDENT' | 'TUTOR' | 'ADMIN' | 'SUPER_ADMIN';

/**
 * Estados posibles de una cuenta.
 * PENDING_APPROVAL corresponde a un menor de edad esperando autorización.
 */
export type UserStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'INACTIVE' | 'REJECTED';

/** Tipos de documento aceptados en el registro. */
export type DocumentType = 'CEDULA' | 'TARJETA_IDENTIDAD' | 'PASAPORTE' | 'OTRO';

/**
 * Datos personales del usuario.
 *
 * Está separado de `AuthUser` porque en el backend son dos tablas distintas:
 * `User` guarda las credenciales y `Profile` los datos personales.
 */
export interface Profile {
  /** Nombre de pila. */
  firstName: string;
  /** Apellidos. */
  lastName: string;
  /** Nombre alternativo que el usuario elige mostrar. Null si no configuró uno. */
  displayName: string | null;
  /** URL de la foto de perfil. Null si no subió ninguna. */
  avatar: string | null;
  /** Texto libre de presentación. */
  bio: string | null;
  /** Teléfono de contacto. */
  phone: string | null;
  /** Fecha de nacimiento en formato ISO. */
  birthDate: string;
  /** Ciudad de residencia. */
  city: string | null;
  /** Tipo de documento de identidad. */
  documentType: DocumentType;
  /** Número del documento de identidad. */
  documentNumber: string;
  /** Si es true, otros usuarios pueden ver este perfil. */
  isPublic: boolean;
}

/**
 * Usuario autenticado tal como lo devuelve el backend.
 *
 * Fijate que NO hay ningún campo de contraseña ni token: el backend nunca los
 * envía. El token de sesión viaja en una cookie `httpOnly` que JavaScript no
 * puede leer, que es justamente la protección contra ataques XSS.
 */
export interface AuthUser {
  /** Identificador único (formato cuid generado por Prisma). */
  id: string;
  /** Correo electrónico, único en toda la plataforma. */
  email: string;
  /** Rol que determina a qué secciones puede entrar. */
  role: UserRole;
  /** Estado de la cuenta. */
  status: UserStatus;
  /** Puntos acumulados por gamificación. */
  totalPoints: number;
  /** Fecha de creación de la cuenta, en formato ISO. */
  createdAt: string;
  /** Datos personales. Null si todavía no se completó el perfil. */
  profile: Profile | null;
}

/**
 * Credenciales que se envían al iniciar sesión.
 * La contraseña debe tener mínimo 8 caracteres (lo valida el LoginDto del backend).
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Datos que exige el backend para crear una cuenta.
 * Todos son obligatorios: si falta uno, la API responde 400.
 */
export interface RegisterRequest {
  email: string;
  /** Mínimo 8 caracteres. */
  password: string;
  firstName: string;
  lastName: string;
  /** Formato ISO "AAAA-MM-DD". Es lo que produce un <input type="date">. */
  birthDate: string;
  documentType: DocumentType;
  documentNumber: string;
}

/**
 * Respuesta del registro.
 *
 * OJO: registrarse NO inicia sesión. El backend no devuelve cookie acá, así
 * que después de un registro exitoso hay que mandar al usuario al login.
 *
 * Cuando la persona es menor de edad, `requiresApproval` viene en true y la
 * cuenta queda en estado PENDING_APPROVAL hasta que un administrador la revise.
 * En ese caso NO tiene sentido mandarla al login: no va a poder entrar todavía.
 */
export interface RegisterResponse {
  /** True si la cuenta quedó pendiente de aprobación por ser menor de edad. */
  requiresApproval: boolean;
  /** Mensaje explicativo que envía el backend. Solo llega si requiresApproval es true. */
  message?: string;
}

/**
 * Campos editables del perfil.
 *
 * Todos son opcionales porque el backend usa PUT sobre un DTO de campos
 * opcionales: solo se actualiza lo que se envía.
 */
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  phone?: string;
  city?: string;
  avatar?: string;
  isPublic?: boolean;
}
