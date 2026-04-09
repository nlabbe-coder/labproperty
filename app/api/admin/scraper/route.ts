import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { obtenerIdsRemates, obtenerDetalleRemate } from '@/lib/scraper'
import { parsearRemate } from '@/lib/parser'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { paginas = 2, region = 'todo_chile' } = await req.json().catch(() => ({}))

  const log = { nuevos: 0, omitidos: 0, errores: 0, ids: [] as string[] }

  try {
    for (let pag = 1; pag <= Math.min(paginas, 5); pag++) {
      const ids = await obtenerIdsRemates(pag, region)
      if (ids.length === 0) break

      for (const id of ids) {
        // Ya existe?
        const existe = await prisma.remate.findUnique({ where: { fuenteId: id } })
        if (existe) { log.omitidos++; continue }

        const raw = await obtenerDetalleRemate(id)
        if (!raw) { log.errores++; continue }

        // Ignorar remates de vehículos
        if (/autom[oó]vil|veh[ií]culo|camioneta|camión|moto/i.test(raw.textoOriginal)) {
          log.omitidos++; continue
        }

        const parseado = parsearRemate(raw.textoOriginal)

        await prisma.remate.create({
          data: {
            fuenteId: raw.fuenteId,
            fuenteUrl: raw.fuenteUrl,
            textoOriginal: raw.textoOriginal,
            tribunal: parseado.tribunal,
            direccionTribunal: parseado.direccionTribunal,
            fechaRemate: parseado.fechaRemate,
            horaRemate: parseado.horaRemate,
            modalidad: parseado.modalidad,
            direccion: parseado.direccion,
            comuna: parseado.comuna,
            region: parseado.region,
            tipoInmueble: parseado.tipoInmueble,
            precioMinimo: parseado.precioMinimo,
            garantia: parseado.garantia,
            rolCausa: parseado.rolCausa,
            caratulada: parseado.caratulada,
            rolAvaluo: parseado.rolAvaluo,
            inscripcionCBR: parseado.inscripcionCBR,
            emailTribunal: parseado.emailTribunal,
            estado: 'activo',
          },
        })

        log.nuevos++
        log.ids.push(id)
      }
    }

    await prisma.logScraping.create({
      data: {
        fuente: `economicos.cl (${region})`,
        totalLeidos: log.nuevos + log.omitidos + log.errores,
        nuevos: log.nuevos,
        errores: log.errores,
        detalle: JSON.stringify({ paginas, omitidos: log.omitidos }),
      },
    })

    return NextResponse.json({ ok: true, ...log })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
