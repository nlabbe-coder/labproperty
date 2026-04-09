// npx tsx scripts/test-scraper.ts
import 'dotenv/config'
import { obtenerIdsRemates, obtenerDetalleRemate } from '../lib/scraper'
import { parsearRemate } from '../lib/parser'

async function main() {
  console.log('=== Test scraper economicos.cl ===\n')

  console.log('Buscando IDs de remates página 1...')
  const ids = await obtenerIdsRemates(1, 'todo_chile')
  console.log(`IDs encontrados: ${ids.length}`)
  console.log('Primeros 5:', ids.slice(0, 5))

  if (ids.length === 0) {
    console.log('\n❌ No se encontraron IDs — la URL o regex puede estar desactualizada')
    console.log('Descargando HTML para inspeccionar...')

    const res = await fetch('https://www.economicos.cl/todo_chile/remates?page=1', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LabProperty/1.0; research)', 'Accept': 'text/html' },
      signal: AbortSignal.timeout(10000),
    })
    const html = await res.text()
    console.log('Status:', res.status)
    console.log('Primeros 2000 chars del HTML:')
    console.log(html.slice(0, 2000))
    return
  }

  console.log('\nObteniendo detalle del primer remate...')
  const raw = await obtenerDetalleRemate(ids[0])
  if (!raw) {
    console.log('❌ No se pudo obtener el detalle')
    return
  }

  console.log('✓ Texto obtenido:', raw.textoOriginal.slice(0, 300))
  console.log('\nParseando...')
  const parseado = parsearRemate(raw.textoOriginal)
  console.log('Resultado:', JSON.stringify(parseado, null, 2))
}

main().catch(console.error)
