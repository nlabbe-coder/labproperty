import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import GuardarRemateBtn from '@/components/GuardarRemateBtn'

export const dynamic = 'force-dynamic'

function formatPrecio(precio: number | null | undefined) {
  if (!precio) return '—'
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(precio)
}

function formatFecha(fecha: Date | null | undefined) {
  if (!fecha) return '—'
  return new Intl.DateTimeFormat('es-CL', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(fecha))
}

function diasRestantes(fecha: Date | null | undefined) {
  if (!fecha) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const f = new Date(fecha)
  f.setHours(0, 0, 0, 0)
  return Math.round((f.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

function BadgeModalidad({ modalidad }: { modalidad: string | null }) {
  if (!modalidad) return null
  const color = modalidad.includes('Primera')
    ? 'bg-green-100 text-green-800'
    : modalidad.includes('Segunda')
    ? 'bg-yellow-100 text-yellow-800'
    : 'bg-red-100 text-red-800'
  return <span className={`badge text-sm ${color}`}>{modalidad}</span>
}

export default async function RemateDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession()

  const remate = await prisma.remate.findUnique({ where: { id } })
  if (!remate) notFound()

  const guardado = session
    ? !!(await prisma.seguimiento.findUnique({
        where: { remateId_usuarioId: { remateId: id, usuarioId: session.id } },
      }))
    : false

  const dias = diasRestantes(remate.fechaRemate)
  const pasado = dias !== null && dias < 0

  // Remates similares (misma comuna)
  const similares = remate.comuna
    ? await prisma.remate.findMany({
        where: {
          comuna: remate.comuna,
          estado: 'activo',
          id: { not: remate.id },
        },
        orderBy: { fechaRemate: 'asc' },
        take: 3,
      })
    : []

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-azul-600 mb-6">
          <Link href="/" className="hover:text-azul-900">Inicio</Link>
          <span>/</span>
          <Link href="/remates" className="hover:text-azul-900">Remates</Link>
          <span>/</span>
          <span className="text-azul-900 font-medium truncate max-w-xs">
            {remate.direccion ?? remate.id}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-5">

            {/* Header */}
            <div className="card p-6">
              <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <BadgeModalidad modalidad={remate.modalidad} />
                  {remate.tipoInmueble && (
                    <span className="badge bg-azul-100 text-azul-700">{remate.tipoInmueble}</span>
                  )}
                  {pasado && (
                    <span className="badge bg-gray-100 text-gray-500">Remate pasado</span>
                  )}
                </div>
                {!pasado && dias !== null && (
                  <div className={`text-right shrink-0 ${dias <= 7 ? 'text-red-600' : dias <= 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                    <p className="text-2xl font-black">{dias === 0 ? '¡Hoy!' : `${dias}d`}</p>
                    <p className="text-xs font-semibold opacity-70">para el remate</p>
                  </div>
                )}
              </div>

              <h1 className="text-2xl font-black text-azul-900 leading-tight mb-1">
                {remate.direccion ?? 'Dirección no especificada'}
              </h1>
              {remate.comuna && (
                <p className="text-verde font-semibold">
                  {remate.comuna}{remate.region ? `, ${remate.region}` : ''}
                </p>
              )}

              {remate.caratulada && (
                <p className="text-azul-600 text-sm mt-3 italic">"{remate.caratulada}"</p>
              )}
            </div>

            {/* Datos del remate */}
            <div className="card p-6">
              <h2 className="font-bold text-azul-900 mb-4">Datos del remate</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Dato label="Fecha del remate" value={formatFecha(remate.fechaRemate)} />
                <Dato label="Hora" value={remate.horaRemate ?? '—'} />
                <Dato label="Modalidad" value={remate.modalidad ?? '—'} />
                <Dato label="Tipo de inmueble" value={remate.tipoInmueble ?? '—'} />
                <Dato label="Precio mínimo" value={formatPrecio(remate.precioMinimo)} highlight />
                <Dato label="Garantía requerida" value={formatPrecio(remate.garantia)} />
                <Dato label="Avalúo fiscal" value={formatPrecio(remate.avaluoFiscal)} />
                <Dato label="Rol avalúo" value={remate.rolAvaluo ?? '—'} />
              </div>
            </div>

            {/* Datos judiciales */}
            <div className="card p-6">
              <h2 className="font-bold text-azul-900 mb-4">Antecedentes judiciales</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Dato label="Tribunal" value={remate.tribunal ?? '—'} />
                <Dato label="Dirección tribunal" value={remate.direccionTribunal ?? '—'} />
                <Dato label="ROL causa" value={remate.rolCausa ?? '—'} />
                <Dato label="Inscripción CBR" value={remate.inscripcionCBR ?? '—'} />
                {remate.emailTribunal && (
                  <div className="sm:col-span-2">
                    <p className="label">Contacto tribunal</p>
                    <a
                      href={`mailto:${remate.emailTribunal}`}
                      className="text-verde hover:underline font-medium text-sm"
                    >
                      {remate.emailTribunal}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Texto original */}
            <div className="card p-6">
              <h2 className="font-bold text-azul-900 mb-4">Aviso original</h2>
              <div className="bg-azul-50 rounded-xl p-4 text-sm text-azul-700 leading-relaxed whitespace-pre-wrap font-mono border border-azul-100">
                {remate.textoOriginal}
              </div>
              {remate.fuenteUrl && (
                <a
                  href={remate.fuenteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-verde hover:underline mt-3 font-medium"
                >
                  Ver fuente original →
                </a>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">

            {/* Card precio */}
            <div className="card p-5 bg-azul-900 text-white">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1">Precio mínimo</p>
              <p className="text-3xl font-black mb-1">{formatPrecio(remate.precioMinimo)}</p>
              {remate.garantia && (
                <p className="text-white/60 text-sm">Garantía: {formatPrecio(remate.garantia)}</p>
              )}
              <hr className="border-white/20 my-4" />
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1">Fecha remate</p>
              <p className="font-bold text-lg">{formatFecha(remate.fechaRemate)}</p>
              {remate.horaRemate && (
                <p className="text-white/60 text-sm">{remate.horaRemate}</p>
              )}
              {!pasado && dias !== null && dias <= 30 && (
                <div className={`mt-4 rounded-lg p-3 text-center font-bold text-sm ${
                  dias <= 7 ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {dias === 0 ? '¡El remate es hoy!' : `Faltan ${dias} días`}
                </div>
              )}
            </div>

            {/* Tribunal */}
            {(remate.tribunal || remate.emailTribunal) && (
              <div className="card p-5">
                <h3 className="font-bold text-azul-900 text-sm mb-3">Tribunal</h3>
                {remate.tribunal && <p className="text-sm font-medium text-azul-800">{remate.tribunal}</p>}
                {remate.direccionTribunal && (
                  <p className="text-sm text-azul-600 mt-1">{remate.direccionTribunal}</p>
                )}
                {remate.emailTribunal && (
                  <a
                    href={`mailto:${remate.emailTribunal}`}
                    className="block text-sm text-verde hover:underline mt-2 font-medium"
                  >
                    {remate.emailTribunal}
                  </a>
                )}
              </div>
            )}

            {/* Acciones */}
            <div className="card p-5 space-y-2">
              <h3 className="font-bold text-azul-900 text-sm mb-3">Acciones</h3>
              <GuardarRemateBtn
                remateId={remate.id}
                guardado={guardado}
                logueado={!!session}
              />
              <Link href="/remates" className="btn btn-secondary w-full text-sm">
                ← Volver al listado
              </Link>
              {remate.fuenteUrl && (
                <a
                  href={remate.fuenteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary w-full text-sm"
                >
                  Ver fuente original
                </a>
              )}
            </div>

            {/* Similares */}
            {similares.length > 0 && (
              <div className="card p-5">
                <h3 className="font-bold text-azul-900 text-sm mb-3">
                  Más remates en {remate.comuna}
                </h3>
                <div className="space-y-3">
                  {similares.map(s => (
                    <Link key={s.id} href={`/remates/${s.id}`} className="block group">
                      <p className="text-sm font-medium text-azul-800 group-hover:text-verde transition-colors truncate">
                        {s.direccion ?? 'Sin dirección'}
                      </p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-azul-500">{formatFecha(s.fechaRemate)}</p>
                        <p className="text-xs font-bold text-azul-700">{formatPrecio(s.precioMinimo)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Publicación */}
            <p className="text-xs text-azul-400 text-center">
              Publicado el {new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(remate.creadoEn))}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

function Dato({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? 'text-azul-900 text-base' : 'text-azul-700'}`}>
        {value}
      </p>
    </div>
  )
}
