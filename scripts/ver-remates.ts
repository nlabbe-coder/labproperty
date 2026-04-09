// npx tsx scripts/ver-remates.ts
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function main() {
  const remates = await prisma.remate.findMany({ orderBy: { creadoEn: 'desc' }, take: 10 })

  for (const r of remates) {
    console.log(`\n[${r.fuenteId}]`)
    console.log(`  Tribunal:    ${r.tribunal ?? '—'}`)
    console.log(`  Dirección:   ${r.direccion ?? '—'}`)
    console.log(`  Comuna:      ${r.comuna ?? '—'}`)
    console.log(`  Tipo:        ${r.tipoInmueble ?? '—'}`)
    console.log(`  Precio mín:  ${r.precioMinimo ? '$' + r.precioMinimo.toLocaleString('es-CL') : '—'}`)
    console.log(`  Fecha:       ${r.fechaRemate ? r.fechaRemate.toLocaleDateString('es-CL') : '—'}`)
    console.log(`  Modalidad:   ${r.modalidad ?? '—'}`)
    console.log(`  Email:       ${r.emailTribunal ?? '—'}`)
  }

  const stats = {
    total: await prisma.remate.count(),
    conFecha: await prisma.remate.count({ where: { fechaRemate: { not: null } } }),
    conPrecio: await prisma.remate.count({ where: { precioMinimo: { not: null } } }),
    conComuna: await prisma.remate.count({ where: { comuna: { not: null } } }),
  }
  console.log('\n=== Stats ===')
  console.log(`Total:      ${stats.total}`)
  console.log(`Con fecha:  ${stats.conFecha} (${Math.round(stats.conFecha/stats.total*100)}%)`)
  console.log(`Con precio: ${stats.conPrecio} (${Math.round(stats.conPrecio/stats.total*100)}%)`)
  console.log(`Con comuna: ${stats.conComuna} (${Math.round(stats.conComuna/stats.total*100)}%)`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
