import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LabProperty — Remates Judiciales Chile',
  description: 'Plataforma de seguimiento y análisis de remates judiciales de propiedades en Chile.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  )
}
