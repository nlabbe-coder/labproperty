// Parser de texto libre de avisos de remate judicial chileno

export interface RemateParseado {
  tribunal?: string
  direccionTribunal?: string
  fechaRemate?: Date
  horaRemate?: string
  modalidad?: string
  direccion?: string
  comuna?: string
  region?: string
  tipoInmueble?: string
  precioMinimo?: number
  garantia?: number
  rolCausa?: string
  caratulada?: string
  rolAvaluo?: string
  inscripcionCBR?: string
  emailTribunal?: string
}

const MESES: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
}

export function parsearRemate(texto: string): RemateParseado {
  const t = texto.toLowerCase()
  const result: RemateParseado = {}

  // Tribunal
  const tribunalMatch = texto.match(/(\d+[°º]?\s+juzgado[^,\n]+)/i)
  if (tribunalMatch) result.tribunal = tribunalMatch[1].trim()

  // Dirección tribunal
  const dirTribunalMatch = texto.match(/ubicado en ([^,]+\d+[^,]*)/i)
  if (dirTribunalMatch) result.direccionTribunal = dirTribunalMatch[1].trim()

  // Fecha del remate
  const fechaMatch = texto.match(/(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})/i)
  if (fechaMatch) {
    const dia = parseInt(fechaMatch[1])
    const mes = MESES[fechaMatch[2].toLowerCase()]
    const anio = parseInt(fechaMatch[3])
    result.fechaRemate = new Date(anio, mes, dia)
  }

  // Hora
  const horaMatch = texto.match(/a las (\d{1,2}:\d{2})\s*hrs?/i)
  if (horaMatch) result.horaRemate = horaMatch[1]

  // Modalidad
  if (t.includes('presencialmente') || t.includes('presencial')) {
    result.modalidad = 'presencial'
  } else if (t.includes('zoom') || t.includes('videoconferencia')) {
    result.modalidad = 'videoconferencia'
  }

  // Precio mínimo — en Chile los puntos son separadores de miles, la coma es decimal
  const precioMatch = texto.match(/m[íi]nimo[^$\n]{0,30}\$\s*([\d.,]+)/i) ||
                      texto.match(/\$\s*([\d.,]+)[^,\n]{0,20}m[íi]nimo/i) ||
                      texto.match(/suma de\s*\$\s*([\d.,]+)/i)
  if (precioMatch) {
    // Eliminar puntos (miles) y convertir coma decimal si existe
    const numStr = precioMatch[1].replace(/\./g, '').replace(',', '.')
    const valor = parseFloat(numStr)
    // Ignorar precios menores a 1.000.000 (probablemente mal parseado)
    if (valor >= 1_000_000) {
      result.precioMinimo = valor
      result.garantia = Math.round(valor * 0.1)
    }
  }

  // Tipo de inmueble — solo si es remate de propiedad (no autos/vehículos)
  const esVehiculo = /autom[oó]vil|veh[ií]culo|camioneta|camión|moto|taxi/i.test(texto)
  if (!esVehiculo) {
    const tipos = ['departamento', 'casa', 'terreno', 'sitio', 'local comercial', 'bodega', 'oficina', 'parcela', 'lote', 'inmueble']
    for (const tipo of tipos) {
      if (t.includes(tipo)) {
        result.tipoInmueble = tipo
        break
      }
    }
  }

  // Dirección del inmueble — buscar "calle X número Y"
  const dirMatch = texto.match(/(?:calle|avenida|av\.|pasaje|psje\.?)\s+([^,]+?\d+[^,]*)/i) ||
                   texto.match(/ubicado en\s+([^,]+?\d+[^,]*,\s*(?:lote|manzana|conjunto)[^,]*)/i)
  if (dirMatch) result.direccion = dirMatch[1].trim()

  // Comuna
  const comunaMatch = texto.match(/comuna de ([a-záéíóúüñ\s]+?)(?:\.|,|;|\n|$)/i)
  if (comunaMatch) result.comuna = normalizar(comunaMatch[1].trim())

  // Región (inferir desde tribunal o texto)
  const regionMatch = texto.match(/(?:tribunal|juzgado)[^\n]*(?:de|en)\s+([A-ZÁÉÍÓÚ][a-záéíóúüñ]+)/i)
  if (regionMatch) result.region = regionMatch[1]

  // Rol de causa
  const rolMatch = texto.match(/rol\s+(?:c[- ]?)?(\d+-\d+)/i) ||
                   texto.match(/(?:causa|autos)\s+(?:rol\s+)?n[°º]?\s*(\d+-\d+)/i)
  if (rolMatch) result.rolCausa = rolMatch[1]

  // Caratulada
  const caratuladaMatch = texto.match(/caratulada\s+"?([^"]+?)"?\s*(?:,|\.|\n)/i) ||
                          texto.match(/caratulada\s+([^,\n]+)/i)
  if (caratuladaMatch) result.caratulada = caratuladaMatch[1].trim()

  // Rol avalúo
  const avaluoMatch = texto.match(/rol de avalu[óo]\s+n[°º]?\s*([\d-]+)/i)
  if (avaluoMatch) result.rolAvaluo = avaluoMatch[1]

  // Inscripción CBR
  const cbrMatch = texto.match(/fojas\s+([\d\w\s.]+n[°º]?\s*[\d]+[^.]+)/i)
  if (cbrMatch) result.inscripcionCBR = cbrMatch[1].trim()

  // Email tribunal
  const emailMatch = texto.match(/[\w._-]+@[\w.-]+\.[a-z]{2,}/i)
  if (emailMatch) result.emailTribunal = emailMatch[0]

  return result
}

function normalizar(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .trim()
}
