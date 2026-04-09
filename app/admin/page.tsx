import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import AdminNav from './AdminNav'
import ScraperPanel from './ScraperPanel'
import RematesAdminTable from './RematesAdminTable'
import NuevoRemateForm from './NuevoRemateForm'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')

  const [totalRemates, activos, proximos, logs] = await Promise.all([
    prisma.remate.count(),
    prisma.remate.count({ where: { estado: 'activo' } }),
    prisma.remate.count({ where: { estado: 'activo', fechaRemate: { gte: new Date() } } }),
    prisma.logScraping.findMany({ orderBy: { creadoEn: 'desc' }, take: 5 }),
  ])

  const remates = await prisma.remate.findMany({
    orderBy: { creadoEn: 'desc' },
    take: 50,
    select: {
      id: true,
      direccion: true,
      comuna: true,
      tipoInmueble: true,
      precioMinimo: true,
      fechaRemate: true,
      modalidad: true,
      estado: true,
      destacado: true,
      creadoEn: true,
      fuenteUrl: true,
    },
  })

  return (
    <div className="min-h-screen bg-azul-50">
      <AdminNav nombre={session.nombre} />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total remates', value: totalRemates, color: 'text-azul-900' },
            { label: 'Activos', value: activos, color: 'text-verde' },
            { label: 'Próximos', value: proximos, color: 'text-oro' },
            { label: 'Scraping logs', value: logs.length, color: 'text-azul-600' },
          ].map(s => (
            <div key={s.label} className="card p-5 text-center">
              <p className={`text-3xl font-black ${s.color}`}>{s.value.toLocaleString('es-CL')}</p>
              <p className="text-sm text-azul-600 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Scraper + Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ScraperPanel />

          <div className="card p-5">
            <h2 className="font-bold text-azul-900 mb-4">Últimos scraping</h2>
            {logs.length === 0 ? (
              <p className="text-sm text-azul-500">Sin registros aún</p>
            ) : (
              <div className="space-y-2">
                {logs.map((l: typeof logs[number]) => (
                  <div key={l.id} className="flex items-center justify-between text-sm border-b border-azul-100 pb-2 last:border-0">
                    <div>
                      <p className="font-medium text-azul-800">{l.fuente}</p>
                      <p className="text-azul-500 text-xs">
                        {new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(l.creadoEn))}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-verde font-bold">+{l.nuevos}</span>
                      <span className="text-azul-400"> / </span>
                      <span className="text-azul-600">{l.totalLeidos} leídos</span>
                      {l.errores > 0 && <span className="text-rojo ml-1">({l.errores} err)</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Agregar remate manual */}
        <NuevoRemateForm />

        {/* Tabla de remates */}
        <div className="card p-5">
          <h2 className="font-bold text-azul-900 mb-4">Remates (últimos 50)</h2>
          <RematesAdminTable remates={remates} />
        </div>
      </div>
    </div>
  )
}
