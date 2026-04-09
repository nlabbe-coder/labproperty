import Link from 'next/link'
import { prisma } from '@/lib/db'
import Navbar from '@/components/Navbar'
import { Remate } from '@prisma/client'

export const dynamic = 'force-dynamic'

const COMUNAS = [
  'Santiago', 'Providencia', 'Las Condes', 'Ñuñoa', 'Maipú',
  'La Florida', 'Pudahuel', 'San Bernardo', 'Vitacura', 'Lo Barnechea',
  'Conchalí', 'Recoleta', 'Independencia', 'Macul', 'Peñalolén',
  'Valparaíso', 'Viña del Mar', 'Concepción', 'Temuco', 'Antofagasta',
]

const TIPOS = ['Departamento', 'Casa', 'Local Comercial', 'Oficina', 'Terreno', 'Bodega', 'Otro']
const MODALIDADES = ['Primera Subasta', 'Segunda Subasta', 'Tercera Subasta']
const ORDENAR_OPS = [
  { value: 'fechaRemate_asc', label: 'Fecha (próximos primero)' },
  { value: 'fechaRemate_desc', label: 'Fecha (más recientes)' },
  { value: 'precioMinimo_asc', label: 'Precio (menor a mayor)' },
  { value: 'precioMinimo_desc', label: 'Precio (mayor a menor)' },
  { value: 'creadoEn_desc', label: 'Publicación (más nuevos)' },
]

function formatPrecio(precio: number | null) {
  if (!precio) return '—'
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(precio)
}

function formatFecha(fecha: Date | null) {
  if (!fecha) return '—'
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(fecha))
}

function badgeModalidad(m: string | null) {
  if (!m) return null
  const color = m.includes('Primera') ? 'bg-green-100 text-green-800' :
                m.includes('Segunda') ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
  return <span className={`badge ${color}`}>{m}</span>
}

export default async function RematesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams

  const comuna = params.comuna || ''
  const tipo = params.tipo || ''
  const modalidad = params.modalidad || ''
  const precioMin = params.precioMin ? Number(params.precioMin) : undefined
  const precioMax = params.precioMax ? Number(params.precioMax) : undefined
  const ordenar = params.ordenar || 'fechaRemate_asc'
  const pagina = Math.max(1, Number(params.pagina || 1))
  const POR_PAGINA = 20

  const lastUnderscore = ordenar.lastIndexOf('_')
  const campo = ordenar.slice(0, lastUnderscore)
  const dir = ordenar.slice(lastUnderscore + 1) as 'asc' | 'desc'

  const where: Record<string, unknown> = { estado: 'activo' }
  if (comuna) where.comuna = { contains: comuna, mode: 'insensitive' }
  if (tipo) where.tipoInmueble = { contains: tipo, mode: 'insensitive' }
  if (modalidad) where.modalidad = { contains: modalidad, mode: 'insensitive' }
  if (precioMin !== undefined || precioMax !== undefined) {
    where.precioMinimo = {}
    if (precioMin !== undefined) (where.precioMinimo as Record<string, number>).gte = precioMin
    if (precioMax !== undefined) (where.precioMinimo as Record<string, number>).lte = precioMax
  }

  const orderBy: Record<string, string> = { [campo]: dir }

  const [remates, total, comunasTop] = await Promise.all([
    prisma.remate.findMany({
      where,
      orderBy,
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
    prisma.remate.count({ where }),
    prisma.remate.groupBy({
      by: ['comuna'],
      where: { estado: 'activo', comuna: { not: null } },
      _count: { comuna: true },
      orderBy: { _count: { comuna: 'desc' } },
      take: 12,
    }),
  ])

  const totalPaginas = Math.ceil(total / POR_PAGINA)

  function buildUrl(overrides: Record<string, string | number | undefined>) {
    const p = new URLSearchParams()
    const merged = { comuna, tipo, modalidad, ordenar, ...overrides }
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, String(v))
    }
    return `/remates?${p.toString()}`
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-azul-900">Remates Judiciales</h1>
          <p className="text-azul-600 text-sm mt-1">{total.toLocaleString('es-CL')} propiedades encontradas</p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar filtros */}
          <aside className="w-64 shrink-0 space-y-5">
            <div className="card p-4 space-y-4">
              <h2 className="font-bold text-sm text-azul-900 uppercase tracking-wide">Filtros</h2>

              {/* Comuna */}
              <div>
                <label className="label">Comuna</label>
                <input
                  type="text"
                  name="comuna"
                  defaultValue={comuna}
                  placeholder="Ej: Santiago"
                  className="input text-sm"
                  form="filtros-form"
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="label">Tipo de propiedad</label>
                <select name="tipo" defaultValue={tipo} className="input text-sm" form="filtros-form">
                  <option value="">Todos</option>
                  {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Modalidad */}
              <div>
                <label className="label">Modalidad</label>
                <select name="modalidad" defaultValue={modalidad} className="input text-sm" form="filtros-form">
                  <option value="">Todas</option>
                  {MODALIDADES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* Precio */}
              <div>
                <label className="label">Precio base (CLP)</label>
                <div className="flex gap-2">
                  <input type="number" name="precioMin" defaultValue={precioMin} placeholder="Mín" className="input text-sm" form="filtros-form" />
                  <input type="number" name="precioMax" defaultValue={precioMax} placeholder="Máx" className="input text-sm" form="filtros-form" />
                </div>
              </div>

              {/* Ordenar */}
              <div>
                <label className="label">Ordenar por</label>
                <select name="ordenar" defaultValue={ordenar} className="input text-sm" form="filtros-form">
                  {ORDENAR_OPS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <form id="filtros-form" action="/remates" method="get">
                <input type="hidden" name="pagina" value="1" />
                <button type="submit" className="btn btn-primary w-full text-sm">Aplicar filtros</button>
              </form>

              {(comuna || tipo || modalidad || precioMin || precioMax) && (
                <Link href="/remates" className="btn btn-secondary w-full text-sm text-center">
                  Limpiar filtros
                </Link>
              )}
            </div>

            {/* Comunas rápidas */}
            <div className="card p-4">
              <h2 className="font-bold text-sm text-azul-900 uppercase tracking-wide mb-3">Comunas frecuentes</h2>
              <div className="flex flex-wrap gap-1.5">
                {comunasTop.map(c => (
                  <Link
                    key={c.comuna}
                    href={buildUrl({ comuna: c.comuna || '', pagina: 1 })}
                    className={`badge text-xs cursor-pointer transition-colors ${
                      comuna === c.comuna
                        ? 'bg-azul-900 text-white'
                        : 'bg-azul-100 text-azul-700 hover:bg-azul-200'
                    }`}
                  >
                    {c.comuna} <span className="opacity-60 ml-1">{c._count.comuna}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Lista remates */}
          <div className="flex-1 min-w-0">
            {remates.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-semibold text-azul-900">No hay remates con estos filtros</p>
                <p className="text-sm text-azul-600 mt-1">Intenta ampliar los criterios de búsqueda</p>
                <Link href="/remates" className="btn btn-primary mt-4 text-sm">Ver todos</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {remates.map((r: Remate) => (
                  <Link key={r.id} href={`/remates/${r.id}`} className="block">
                    <div className="card p-4 hover:shadow-md transition-shadow hover:border-azul-200 cursor-pointer">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {badgeModalidad(r.modalidad)}
                            {r.tipoInmueble && (
                              <span className="badge bg-azul-100 text-azul-700">{r.tipoInmueble}</span>
                            )}
                            {r.fechaRemate && new Date(r.fechaRemate) < new Date() && (
                              <span className="badge bg-gray-100 text-gray-500">Pasado</span>
                            )}
                          </div>

                          <p className="font-semibold text-azul-900 truncate">
                            {r.direccion || 'Dirección no especificada'}
                            {r.comuna ? `, ${r.comuna}` : ''}
                          </p>

                          <div className="flex items-center gap-4 mt-2 text-sm text-azul-600 flex-wrap">
                            {r.tribunal && (
                              <span className="flex items-center gap-1">
                                <span className="opacity-60">Tribunal:</span> {r.tribunal}
                              </span>
                            )}
                            {r.rolCausa && (
                              <span className="flex items-center gap-1">
                                <span className="opacity-60">ROL:</span> {r.rolCausa}
                              </span>
                            )}
                          </div>

                          {r.caratulada && (
                            <p className="text-xs text-azul-600 mt-1 truncate opacity-70">{r.caratulada}</p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-lg font-black text-azul-900">{formatPrecio(r.precioMinimo)}</p>
                          {r.fechaRemate && (
                            <p className="text-sm text-azul-600 mt-0.5">{formatFecha(r.fechaRemate)}</p>
                          )}
                          <p className="text-xs text-verde font-semibold mt-1">Ver detalle →</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                {pagina > 1 && (
                  <Link href={buildUrl({ pagina: pagina - 1 })} className="btn btn-secondary text-sm px-4 py-2">
                    ← Anterior
                  </Link>
                )}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPaginas, 7) }, (_, i) => {
                    const p = pagina <= 4 ? i + 1 :
                              pagina >= totalPaginas - 3 ? totalPaginas - 6 + i :
                              pagina - 3 + i
                    if (p < 1 || p > totalPaginas) return null
                    return (
                      <Link
                        key={p}
                        href={buildUrl({ pagina: p })}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                          p === pagina
                            ? 'bg-azul-900 text-white'
                            : 'bg-white border border-azul-100 text-azul-700 hover:bg-azul-50'
                        }`}
                      >
                        {p}
                      </Link>
                    )
                  })}
                </div>
                {pagina < totalPaginas && (
                  <Link href={buildUrl({ pagina: pagina + 1 })} className="btn btn-secondary text-sm px-4 py-2">
                    Siguiente →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
