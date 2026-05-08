export const profileSelect = {
  firstName: true,
  lastName: true,
  displayName: true,
  avatar: true,
  bio: true,
  phone: true,
  birthDate: true,
  city: true,
  documentType: true,
  documentNumber: true,
  isPublic: true,
} as const;

export const userSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  totalPoints: true,
  createdAt: true,
  profile: { select: profileSelect },
} as const;
