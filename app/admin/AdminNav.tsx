'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AdminNav({ nombre }: { nombre: string }) {
  const router = useRouter()

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <nav className="bg-azul-900 text-white sticky top-0 z-40 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-black text-lg">
            <span className="text-verde">Lab</span>Property
          </Link>
          <span className="text-white/30">|</span>
          <span className="text-sm font-semibold text-white/70">Admin</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-white/50">{nombre}</span>
          <button
            onClick={logout}
            className="btn btn-secondary text-xs px-3 py-1.5 bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  )
}
