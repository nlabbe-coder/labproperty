// Scraper de remates judiciales desde economicos.cl
import { parsearRemate } from './parser'

const BASE_URL = 'https://www.economicos.cl'
const DELAY_MS = 1500 // respetuoso con el servidor

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

export interface RemateRaw {
  fuenteId: string
  fuenteUrl: string
  textoOriginal: string
}

// Obtener lista de IDs de remates desde el índice
export async function obtenerIdsRemates(pagina = 1, region = 'todo_chile'): Promise<string[]> {
  const url = `${BASE_URL}/${region}/remates?page=${pagina}`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; LabProperty/1.0; research)',
      'Accept': 'text/html',
    },
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) return []

  const html = await res.text()

  // Extraer IDs de los links de detalle
  const regex = /clasificados-remates-cod(\d+)\.html/g
  const ids: string[] = []
  let match

  while ((match = regex.exec(html)) !== null) {
    if (!ids.includes(match[1])) ids.push(match[1])
  }

  return ids
}

// Obtener texto completo de un remate específico
export async function obtenerDetalleRemate(id: string): Promise<RemateRaw | null> {
  const url = `${BASE_URL}/remates/clasificados-remates-cod${id}.html`

  try {
    await sleep(DELAY_MS)
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LabProperty/1.0; research)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return null

    const html = await res.text()

    function limpiarHtml(s: string) {
      return s
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&aacute;/g, 'á').replace(/&eacute;/g, 'é')
        .replace(/&iacute;/g, 'í').replace(/&oacute;/g, 'ó')
        .replace(/&uacute;/g, 'ú').replace(/&ntilde;/g, 'ñ')
        .replace(/&#\d+;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }

    // 1. Extraer desde <div id="description"><p>...</p>
    let texto = ''
    const descMatch = html.match(/<div[^>]*id="description"[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i)
    if (descMatch) {
      texto = limpiarHtml(descMatch[1])
    }

    // 2. Fallback: meta description (tiene ~250 chars del aviso)
    if (!texto || texto.length < 50) {
      const metaMatch = html.match(/<meta name="Description" content="([^"]+)"/i)
      if (metaMatch) texto = metaMatch[1]
    }

    if (!texto || texto.length < 50) return null

    return { fuenteId: id, fuenteUrl: url, textoOriginal: texto }
  } catch {
    return null
  }
}

// Scraper principal — obtiene N páginas de remates
export async function scrapearRemates(paginas = 3, region = 'todo_chile') {
  const resultados: Array<RemateRaw & ReturnType<typeof parsearRemate>> = []
  const errores: string[] = []

  for (let pag = 1; pag <= paginas; pag++) {
    const ids = await obtenerIdsRemates(pag, region)
    if (ids.length === 0) break

    for (const id of ids) {
      const raw = await obtenerDetalleRemate(id)
      if (!raw) { errores.push(id); continue }

      const parseado = parsearRemate(raw.textoOriginal)
      resultados.push({ ...raw, ...parseado })
    }
  }

  return { resultados, errores }
}
