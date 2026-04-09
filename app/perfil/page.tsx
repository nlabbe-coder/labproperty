import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Navbar from '@/components/Navbar'
import LogoutBtn from './LogoutBtn'

export const dynamic = 'force-dynamic'

function formatPrecio(n: number | null) {
  if (!n) return '—'
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
}

function formatFecha(d: Date | null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d))
}

export default async function PerfilPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.id },
    include: {
      seguimientos: {
        include: { remate: true },
        orderBy: { creadoEn: 'desc' },
      },
    },
  })

  if (!usuario) redirect('/login')

  const proximos = usuario.seguimientos.filter(
    s => s.remate.fechaRemate && new Date(s.remate.fechaRemate) >= new Date()
  )
  const pasados = usuario.seguimientos.filter(
    s => !s.remate.fechaRemate || new Date(s.remate.fechaRemate) < new Date()
  )

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header usuario */}
        <div className="card p-6 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-azul-900 flex items-center justify-center text-white text-2xl font-black">
              {usuario.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-black text-azul-900">{usuario.nombre}</h1>
              <p className="text-azul-500 text-sm">{usuario.email}</p>
              <p className="text-xs text-azul-400 mt-0.5">
                Miembro desde {formatFecha(usuario.creadoEn)}
              </p>
            </div>
          </div>
          <LogoutBtn />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4 text-center">
            <p className="text-3xl font-black text-azul-900">{usuario.seguimientos.length}</p>
            <p className="text-sm text-azul-500 mt-1">Remates guardados</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-3xl font-black text-verde">{proximos.length}</p>
            <p className="text-sm text-azul-500 mt-1">Próximos</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-3xl font-black text-azul-400">{pasados.length}</p>
            <p className="text-sm text-azul-500 mt-1">Pasados</p>
          </div>
        </div>

        {/* Remates guardados */}
        <div className="space-y-6">
          {proximos.length > 0 && (
            <div>
              <h2 className="font-bold text-azul-900 mb-3">Próximos remates</h2>
              <div className="space-y-3">
                {proximos.map(s => (
                  <RemateCard key={s.id} remate={s.remate} seguimientoId={s.id} notas={s.notas} />
                ))}
              </div>
            </div>
          )}

          {pasados.length > 0 && (
            <div>
              <h2 className="font-bold text-azul-600 mb-3">Remates pasados</h2>
              <div className="space-y-3 opacity-70">
                {pasados.map(s => (
                  <RemateCard key={s.id} remate={s.remate} seguimientoId={s.id} notas={s.notas} />
                ))}
              </div>
            </div>
          )}

          {usuario.seguimientos.length === 0 && (
            <div className="card p-12 text-center">
              <p className="text-4xl mb-3">🔖</p>
              <p className="font-semibold text-azul-900">Aún no tienes remates guardados</p>
              <p className="text-sm text-azul-500 mt-1">Entra a un remate y guárdalo para seguirlo desde aquí</p>
              <Link href="/remates" className="btn btn-verde mt-4 text-sm">
                Explorar remates
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function RemateCard({
  remate,
  notas,
}: {
  remate: {
    id: string
    direccion: string | null
    comuna: string | null
    tipoInmueble: string | null
    precioMinimo: number | null
    fechaRemate: Date | null
    modalidad: string | null
    estado: string
  }
  seguimientoId: string
  notas: string | null
}) {
  const dias = remate.fechaRemate
    ? Math.round((new Date(remate.fechaRemate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <Link href={`/remates/${remate.id}`} className="block">
      <div className="card p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {remate.modalidad && (
                <span className="badge bg-azul-100 text-azul-700 text-xs">{remate.modalidad}</span>
              )}
              {remate.tipoInmueble && (
                <span className="badge bg-green-100 text-green-700 text-xs">{remate.tipoInmueble}</span>
              )}
            </div>
            <p className="font-semibold text-azul-900 truncate">
              {remate.direccion ?? 'Sin dirección'}{remate.comuna ? `, ${remate.comuna}` : ''}
            </p>
            {notas && (
              <p className="text-xs text-azul-500 mt-1 italic">"{notas}"</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="font-black text-azul-900">{formatPrecio(remate.precioMinimo)}</p>
            <p className="text-sm text-azul-500">{formatFecha(remate.fechaRemate)}</p>
            {dias !== null && dias >= 0 && (
              <p className={`text-xs font-bold mt-0.5 ${dias <= 7 ? 'text-red-500' : 'text-verde'}`}>
                {dias === 0 ? '¡Hoy!' : `${dias}d restantes`}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
