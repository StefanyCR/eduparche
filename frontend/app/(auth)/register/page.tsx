'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type DocumentType = 'CEDULA' | 'TARJETA_IDENTIDAD' | 'PASAPORTE' | 'OTRO'

const documentLabels: Record<DocumentType, string> = {
  CEDULA:            'Cédula de ciudadanía',
  TARJETA_IDENTIDAD: 'Tarjeta de identidad',
  PASAPORTE:         'Pasaporte',
  OTRO:              'Otro',
}

function calcularEdad(birthDate: string): number {
  if (!birthDate) return 99
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default function RegisterPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '',
    birthDate: '', documentType: 'CEDULA' as DocumentType,
    documentNumber: '', minorLetter: '',
  })
  const [error,           setError]           = useState('')
  const [loading,         setLoading]         = useState(false)
  const [pendingApproval, setPendingApproval] = useState(false)
  const [isMinor,         setIsMinor]         = useState(false)

  useEffect(() => {
    setIsMinor(calcularEdad(form.birthDate) < 18)
  }, [form.birthDate])

  function handleChange(e: { target: { name: string; value: string } }) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit() {
    setError('')
    setLoading(true)
    try {
      const payload = {
        email: form.email, password: form.password,
        firstName: form.firstName, lastName: form.lastName,
        birthDate: form.birthDate, documentType: form.documentType,
        documentNumber: form.documentNumber,
        ...(isMinor && form.minorLetter ? { minorLetter: form.minorLetter } : {}),
      }
      // El backend pone la cookie ep_token y devuelve { user } o { requiresApproval, message }
      const { data } = await api.post<{ requiresApproval: boolean }>(
        '/auth/register', payload
      )

      if (data.requiresApproval) { setPendingApproval(true); return }

      router.push('/login?registered=true')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
        ?? 'Error al registrarse'
      setError(Array.isArray(msg) ? msg[0] : msg)
    } finally {
      setLoading(false)
    }
  }

  if (pendingApproval) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-warning-bg border border-warning/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Cuenta en revisión</h2>
          <p className="text-sm text-secondary mb-6 leading-relaxed">
            Tu cuenta fue creada. Como eres menor de edad, un administrador revisará tu solicitud antes de que puedas acceder.
          </p>
          <Link href="/login">
            <Button size="lg" className="w-full">Volver al inicio de sesión</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 flex items-start justify-center">
<div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-bold">EP</span>
          </div>
          <span className="text-xl font-semibold text-foreground">
            Edu<span className="text-primary">Parche</span>
          </span>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-1">Crear cuenta</h1>
        <p className="text-sm text-secondary mb-6">Únete y empieza a aprender gratis</p>

        <Card>
          {error && (
            <div className="mb-5 rounded-xl bg-danger-bg border border-danger/20 px-3.5 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <Input label="Nombre" name="firstName" type="text" required
                value={form.firstName} onChange={handleChange} placeholder="María" />
              <Input label="Apellido" name="lastName" type="text" required
                value={form.lastName} onChange={handleChange} placeholder="García" />
            </div>

            <Input label="Correo electrónico" name="email" type="email" required
              autoComplete="email" value={form.email} onChange={handleChange}
              placeholder="correo@ejemplo.com" />

            <Input label="Contraseña" name="password" type="password" required
              autoComplete="new-password" value={form.password} onChange={handleChange}
              placeholder="Mínimo 8 caracteres" hint="Al menos 8 caracteres" />

            <div>
              <Input label="Fecha de nacimiento" name="birthDate" type="date" required
                value={form.birthDate} onChange={handleChange}
                max={new Date().toISOString().split('T')[0]} />
              {isMinor && form.birthDate && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="warning">Menor de edad</Badge>
                  <span className="text-xs text-secondary">Requiere aprobación de un administrador</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select label="Tipo de documento" name="documentType" required
                value={form.documentType} onChange={handleChange}>
                {(Object.keys(documentLabels) as DocumentType[]).map((key) => (
                  <option key={key} value={key}>{documentLabels[key]}</option>
                ))}
              </Select>
              <Input label="Número de documento" name="documentNumber" type="text" required
                value={form.documentNumber} onChange={handleChange} placeholder="1234567890" />
            </div>

            {isMinor && (
              <Textarea
                label="Carta de autorización"
                name="minorLetter"
                rows={3}
                value={form.minorLetter}
                onChange={handleChange}
                placeholder="Autorización del acudiente o tutor legal (opcional)..."
                hint="Opcional — también puedes enviarla después"
              />
            )}

            <Button type="submit" disabled={loading} size="lg" className="mt-1 w-full">
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>
        </Card>

        <p className="mt-5 text-center text-sm text-secondary">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Inicia sesión
          </Link>
        </p>

      </div>
    </div>
  )
}
