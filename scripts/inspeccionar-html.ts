// npx tsx scripts/inspeccionar-html.ts
import 'dotenv/config'

async function main() {
  const id = '48679012'
  const url = `https://www.economicos.cl/remates/clasificados-remates-cod${id}.html`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; LabProperty/1.0; research)',
      'Accept': 'text/html',
    },
    signal: AbortSignal.timeout(10000),
  })

  const html = await res.text()

  // 1. Meta description
  const metaMatch = html.match(/<meta name="Description" content="([^"]+)"/i)
  console.log('=== META DESCRIPTION ===')
  console.log(metaMatch ? metaMatch[1] : 'No encontrado')

  // 2. cont_ecn_der_detalle
  const detalleMatch = html.match(/class="cont_ecn_der_detalle"[^>]*>([\s\S]*?)<\/div>/i)
  console.log('\n=== cont_ecn_der_detalle ===')
  if (detalleMatch) {
    const texto = detalleMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    console.log(texto.slice(0, 1000))
  } else {
    console.log('No encontrado')
  }

  // 3. Buscar el bloque completo del aviso
  const idx = html.indexOf('cont_ecn_der_detalle')
  if (idx > -1) {
    console.log('\n=== HTML alrededor de cont_ecn_der_detalle ===')
    console.log(html.slice(idx, idx + 3000))
  }
}

main().catch(console.error)
