import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [totalRemates, proximosRemates, comunasTop] = await Promise.all([
    prisma.remate.count(),
    prisma.remate.findMany({
      where: { fechaRemate: { gte: new Date() }, estado: 'activo' },
      orderBy: { fechaRemate: 'asc' },
      take: 6,
    }),
    prisma.remate.groupBy({
      by: ['comuna'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 6,
      where: { comuna: { not: null } },
    }),
  ])

  return (
    <>
      <Navbar />
      <section className="bg-[#0f172a] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
            <span className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse"/>
            {totalRemates.toLocaleString('es-CL')} remates en la plataforma
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-5 leading-tight">
            Remates Judiciales<br/>
            <span className="text-[#10b981]">de Chile</span>
          </h1>
          <p className="text-white/60 text-xl mb-8 max-w-2xl mx-auto">
            Encuentra, filtra y analiza remates judiciales de propiedades en todo Chile. Datos actualizados diariamente.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/remates" className="btn btn-verde px-8 py-3 text-base">Ver remates →</Link>
            <Link href="/analisis" className="btn btn-secondary px-8 py-3 text-base bg-white/10 text-white border-white/20 hover:bg-white/20">Análisis de mercado</Link>
          </div>
        </div>
      </section>

      <section className="bg-[#1e293b] text-white py-8 px-4 border-y border-white/10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: totalRemates.toLocaleString('es-CL'), l: 'Remates totales' },
            { n: proximosRemates.length.toString(), l: 'Próximos a vencer' },
            { n: comunasTop.length + '+', l: 'Comunas activas' },
            { n: 'Diario', l: 'Actualización' },
          ].map(s => (
            <div key={s.l}>
              <p className="text-3xl font-black text-[#10b981]">{s.n}</p>
              <p className="text-white/50 text-sm mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Próximos remates</h2>
              <p className="text-gray-500 text-sm mt-1">Ordenados por fecha más cercana</p>
            </div>
            <Link href="/remates" className="btn btn-secondary text-sm">Ver todos →</Link>
          </div>
          {proximosRemates.length === 0 ? (
            <div className="card p-12 text-center text-gray-400">
              <p className="text-4xl mb-3">🏠</p>
              <p className="font-semibold">No hay remates cargados aún</p>
              <p className="text-sm mt-1">Usa el panel admin para cargar remates</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {proximosRemates.map(r => (
                <Link key={r.id} href={`/remates/${r.id}`}
                  className="card p-5 hover:shadow-md transition-all hover:-translate-y-0.5 block">
                  <div className="flex items-start justify-between mb-3">
                    <span className="badge bg-[#ecfdf5] text-[#059669]">{r.tipoInmueble ?? 'Inmueble'}</span>
                    {r.modalidad && <span className="badge bg-gray-100 text-gray-600">{r.modalidad}</span>}
                  </div>
                  <p className="font-bold text-gray-900 mb-1 line-clamp-2 text-sm">{r.direccion ?? 'Dirección no disponible'}</p>
                  <p className="text-[#10b981] text-xs font-semibold mb-3">{r.comuna ?? '—'}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-gray-400 text-xs">Precio mínimo</p>
                      <p className="font-black text-gray-900">{r.precioMinimo ? '$' + r.precioMinimo.toLocaleString('es-CL') : '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">Fecha remate</p>
                      <p className="font-semibold text-gray-700 text-xs">{r.fechaRemate ? r.fechaRemate.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {comunasTop.length > 0 && (
        <section className="py-12 px-4 bg-gray-50 border-t border-gray-100">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-black text-gray-900 mb-6">Comunas con más remates</h2>
            <div className="flex flex-wrap gap-3">
              {comunasTop.map(c => (
                <Link key={c.comuna} href={`/remates?comuna=${encodeURIComponent(c.comuna ?? '')}`}
                  className="card px-4 py-2.5 flex items-center gap-3 hover:shadow-md transition-all">
                  <span className="font-semibold text-gray-800 text-sm">{c.comuna}</span>
                  <span className="badge bg-[#0f172a] text-white">{c._count.id}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="bg-[#0f172a] text-white/50 py-10 px-4 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p className="font-bold text-white"><span className="text-[#10b981]">Lab</span>Property</p>
          <p>Datos extraídos de fuentes públicas · Uso informativo</p>
          <p>© {new Date().getFullYear()} LabProperty Chile</p>
        </div>
      </footer>
    </>
  )
}
