'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function NuevaContrasenaPage() {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const token       = searchParams.get('token') ?? ''

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [done,      setDone]      = useState(false)

  async function handleSubmit() {
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      setDone(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'El enlace no es válido o ya expiró'
      setError(Array.isArray(msg) ? msg[0] : msg)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <p className="text-sm text-danger mb-4">Enlace inválido. Solicita uno nuevo.</p>
          <Link href="/recuperar-contrasena">
            <Button size="lg" className="w-full">Solicitar enlace</Button>
          </Link>
        </Card>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-success-bg border border-success/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Contraseña actualizada</h2>
          <p className="text-sm text-secondary">Redirigiendo al inicio de sesión...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-bold">EP</span>
          </div>
          <span className="text-xl font-semibold text-foreground">
            Edu<span className="text-primary">Parche</span>
          </span>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-1">Nueva contraseña</h1>
        <p className="text-sm text-secondary mb-6">Elige una contraseña segura de al menos 8 caracteres.</p>

        <Card>
          {error && (
            <div className="mb-4 rounded-xl bg-danger-bg border border-danger/20 px-3.5 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
            className="flex flex-col gap-4"
          >
            <Input
              label="Nueva contraseña"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />

            <Input
              label="Confirmar contraseña"
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repite la contraseña"
            />

            <Button type="submit" disabled={loading} size="lg" className="mt-1 w-full">
              {loading ? 'Guardando...' : 'Guardar contraseña'}
            </Button>
          </form>
        </Card>

      </div>
    </div>
  )
}
