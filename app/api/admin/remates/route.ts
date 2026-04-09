import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { parsearRemate } from '@/lib/parser'

// Crear remate manualmente (desde texto)
export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const { textoOriginal, ...manual } = body

    if (!textoOriginal || textoOriginal.trim().length < 20) {
      return NextResponse.json({ error: 'Texto muy corto' }, { status: 400 })
    }

    const parseado = parsearRemate(textoOriginal)

    const remate = await prisma.remate.create({
      data: {
        textoOriginal: textoOriginal.trim(),
        tribunal: manual.tribunal || parseado.tribunal,
        direccionTribunal: manual.direccionTribunal || parseado.direccionTribunal,
        fechaRemate: manual.fechaRemate ? new Date(manual.fechaRemate) : parseado.fechaRemate,
        horaRemate: manual.horaRemate || parseado.horaRemate,
        modalidad: manual.modalidad || parseado.modalidad,
        direccion: manual.direccion || parseado.direccion,
        comuna: manual.comuna || parseado.comuna,
        region: manual.region || parseado.region,
        tipoInmueble: manual.tipoInmueble || parseado.tipoInmueble,
        precioMinimo: manual.precioMinimo ? Number(manual.precioMinimo) : parseado.precioMinimo,
        garantia: manual.garantia ? Number(manual.garantia) : parseado.garantia,
        rolCausa: manual.rolCausa || parseado.rolCausa,
        caratulada: manual.caratulada || parseado.caratulada,
        rolAvaluo: manual.rolAvaluo || parseado.rolAvaluo,
        inscripcionCBR: manual.inscripcionCBR || parseado.inscripcionCBR,
        emailTribunal: manual.emailTribunal || parseado.emailTribunal,
        estado: 'activo',
      },
    })

    return NextResponse.json({ ok: true, id: remate.id, parseado })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
