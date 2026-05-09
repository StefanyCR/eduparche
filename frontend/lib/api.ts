import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

let redirecting = false

/*
  Si cualquier request devuelve 401 (sesión expirada):
  1. Llama a /auth/logout con fetch para que el backend borre la cookie
  2. Redirige a /login

  Usamos fetch (no axios) para no pasar por este mismo interceptor.
*/
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const url: string = error.config?.url ?? ''
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register')
    if (error.response?.status === 401 && typeof window !== 'undefined' && !redirecting && !isAuthRoute) {
      redirecting = true
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {})
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api
