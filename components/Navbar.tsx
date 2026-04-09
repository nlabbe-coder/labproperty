import Link from 'next/link'
import { getSession } from '@/lib/auth'

export default async function Navbar() {
  const session = await getSession()

  return (
    <nav className="bg-[#0f172a] text-white sticky top-0 z-40 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-black text-lg tracking-tight">
          <span className="text-[#10b981]">Lab</span>Property
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/remates" className="text-white/70 hover:text-white transition-colors">Remates</Link>
          <Link href="/mapa" className="text-white/70 hover:text-white transition-colors">Mapa</Link>
          <Link href="/analisis" className="text-white/70 hover:text-white transition-colors">Análisis</Link>
          {session ? (
            <Link
              href="/perfil"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors rounded-xl px-3 py-1.5 text-xs font-semibold"
            >
              <span className="w-5 h-5 rounded-full bg-[#10b981] flex items-center justify-center text-white font-black text-xs">
                {session.nombre.charAt(0).toUpperCase()}
              </span>
              {session.nombre.split(' ')[0]}
            </Link>
          ) : (
            <Link href="/login" className="btn btn-verde text-xs px-4 py-2">Ingresar</Link>
          )}
        </div>
      </div>
    </nav>
  )
}
