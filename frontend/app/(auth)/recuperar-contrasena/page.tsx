'use client'

import { useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function RecuperarContrasenaPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)

  async function handleSubmit() {
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
    } catch {
      // Respuesta genérica — no revelar si el email existe
    } finally {
      setLoading(false)
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-success-bg border border-success/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Revisa tu correo</h2>
          <p className="text-sm text-secondary mb-6 leading-relaxed">
            Si <span className="font-medium text-foreground">{email}</span> está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
          </p>
          <Link href="/login">
            <Button size="lg" className="w-full">Volver al inicio de sesión</Button>
          </Link>
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

        <h1 className="text-2xl font-bold text-foreground mb-1">Recuperar contraseña</h1>
        <p className="text-sm text-secondary mb-6">
          Ingresa tu correo y te enviaremos un enlace para restablecerla.
        </p>

        <Card>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
            className="flex flex-col gap-4"
          >
            <Input
              label="Correo electrónico"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
            />

            <Button type="submit" disabled={loading} size="lg" className="mt-1 w-full">
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </Button>
          </form>
        </Card>

        <p className="mt-5 text-center text-sm text-secondary">
          <Link href="/login" className="text-primary font-medium hover:underline">
            Volver al inicio de sesión
          </Link>
        </p>

      </div>
    </div>
  )
}
