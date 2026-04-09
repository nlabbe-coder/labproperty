// npx tsx scripts/scraper-run.ts
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { obtenerIdsRemates, obtenerDetalleRemate } from '../lib/scraper'
import { parsearRemate } from '../lib/parser'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const PAGINAS = 3
const REGION = 'todo_chile'

async function main() {
  console.log(`\n🔍 Scraping ${PAGINAS} páginas de economicos.cl [${REGION}]\n`)

  let nuevos = 0, omitidos = 0, errores = 0

  for (let pag = 1; pag <= PAGINAS; pag++) {
    console.log(`\n--- Página ${pag} ---`)
    const ids = await obtenerIdsRemates(pag, REGION)
    console.log(`IDs encontrados: ${ids.length}`)
    if (ids.length === 0) break

    for (const id of ids) {
      const existe = await prisma.remate.findUnique({ where: { fuenteId: id } })
      if (existe) { omitidos++; process.stdout.write('·'); continue }

      const raw = await obtenerDetalleRemate(id)
      if (!raw) { errores++; process.stdout.write('✗'); continue }

      // Ignorar remates de vehículos
      if (/autom[oó]vil|veh[ií]culo|camioneta|camión|moto/i.test(raw.textoOriginal)) {
        omitidos++; process.stdout.write('v'); continue
      }

      const p = parsearRemate(raw.textoOriginal)

      await prisma.remate.create({
        data: {
          fuenteId: raw.fuenteId,
          fuenteUrl: raw.fuenteUrl,
          textoOriginal: raw.textoOriginal,
          tribunal: p.tribunal,
          direccionTribunal: p.direccionTribunal,
          fechaRemate: p.fechaRemate,
          horaRemate: p.horaRemate,
          modalidad: p.modalidad,
          direccion: p.direccion,
          comuna: p.comuna,
          region: p.region,
          tipoInmueble: p.tipoInmueble,
          precioMinimo: p.precioMinimo,
          garantia: p.garantia,
          rolCausa: p.rolCausa,
          caratulada: p.caratulada,
          rolAvaluo: p.rolAvaluo,
          inscripcionCBR: p.inscripcionCBR,
          emailTribunal: p.emailTribunal,
          estado: 'activo',
        },
      })

      nuevos++
      process.stdout.write('✓')
    }
    console.log()
  }

  await prisma.logScraping.create({
    data: {
      fuente: `economicos.cl (${REGION})`,
      totalLeidos: nuevos + omitidos + errores,
      nuevos,
      errores,
      detalle: JSON.stringify({ paginas: PAGINAS, omitidos }),
    },
  })

  console.log(`\n✅ Listo — Nuevos: ${nuevos} | Ya existían: ${omitidos} | Errores: ${errores}`)
  const total = await prisma.remate.count()
  console.log(`📊 Total en BD: ${total} remates`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
