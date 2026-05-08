import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'EduParche',
  description: 'Plataforma educativa SENA',
}

/*
  Este layout raíz envuelve toda la app. Aquí es donde aplicamos el ThemeProvider para que el tema esté disponible globalmente, y también inyectamos un script que lee la preferencia de tema del usuario antes de que React hidrate, para evitar un flash de tema incorrecto.
*/
const themeScript = `
(function(){
  try {
    var stored = localStorage.getItem('eduparche-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* suppressHydrationWarning en <html> + este script evitan el flash de tema */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
