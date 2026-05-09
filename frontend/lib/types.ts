export type UserRole    = 'ADMIN' | 'TUTOR' | 'STUDENT'
export type UserStatus  = 'ACTIVE' | 'PENDING_APPROVAL' | 'INACTIVE' | 'REJECTED'
export type DocumentType = 'CEDULA' | 'TARJETA_IDENTIDAD' | 'PASAPORTE' | 'OTRO'

export type Profile = {
  firstName: string
  lastName: string
  displayName: string | null
  avatar: string | null
  bio: string | null
  phone: string | null
  birthDate: string
  city: string | null
  documentType: DocumentType
  documentNumber: string
  isPublic: boolean
}

export type AuthUser = {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  totalPoints: number
  createdAt: string
  profile: Profile | null
}
