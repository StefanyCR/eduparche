import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/dashboard', '/catalogo', '/tutorias', '/logros', '/empleo', '/perfil']
const AUTH_PAGES = ['/login', '/register']

export function proxy(request: NextRequest) {
  const token    = request.cookies.get('ep_token')
  const pathname = request.nextUrl.pathname

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p))
  const isAuthPage  = AUTH_PAGES.some((p) => pathname.startsWith(p))

  // Sin sesión intentando entrar a ruta protegida → login
  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Con sesión intentando entrar a login/register → dashboard
  // status 303 evita que el botón atrás quede atrapado en el loop de redirección
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url), { status: 303 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/catalogo/:path*',
    '/tutorias/:path*',
    '/logros/:path*',
    '/empleo/:path*',
    '/perfil/:path*',
    '/login',
    '/register',
  ],
}
