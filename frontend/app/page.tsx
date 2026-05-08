import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

/*
  Server Component — chequea la cookie sin llamar al backend.
  Si existe → dashboard. Si no → login.
  El proxy.ts se encarga de validar la sesión real en cada ruta protegida.
*/
export default async function Home() {
  const cookieStore = await cookies()
  const token = cookieStore.get('ep_token')
  redirect(token ? '/dashboard' : '/login')
}
