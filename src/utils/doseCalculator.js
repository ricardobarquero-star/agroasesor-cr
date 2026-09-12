/**
 * Utilidad agronómica para cálculo y conversión dual de dosis de aplicación:
 * - Dosis por Litro (cc/L, g/L, ml/L)
 * - Dosis por Estañón de 200 Litros (cc / 200 L, g / 200 L, kg / 200 L, L / 200 L)
 * Diseñado conforme a las prácticas de aplicación de campo en Costa Rica.
 * Ing. Agr. Ricardo Manuel Barquero Chacón (Col. 5896)
 */

export function calcularDosisDual(dosisStr) {
  if (!dosisStr || typeof dosisStr !== 'string' || !dosisStr.trim()) {
    return {
      dosisLitro: '—',
      dosisEstanon: '—',
      textoCompleto: '—'
    };
  }

  const raw = dosisStr.trim();

  // Caso 1: Expresado por estañón o tanque de 200 L (ej. "200 - 300 cc / 200 L", "400 g / estañón", "1 kg / 200 L", "0.5 L / 200 L")
  const regexEstanon = /([0-9]+(?:\.[0-9]+)?)(?:\s*-\s*([0-9]+(?:\.[0-9]+)?))?\s*(cc|ml|g|kg|l)?\s*(?:\/|\s+en\s+|\s+por\s+)?\s*(?:200\s*l|estañ[oó]n)/i;
  const mEstanon = raw.match(regexEstanon);

  if (mEstanon) {
    const minVal = parseFloat(mEstanon[1]);
    const maxVal = mEstanon[2] ? parseFloat(mEstanon[2]) : null;
    const unit = (mEstanon[3] || 'cc').toLowerCase();

    let lMin = minVal / 200;
    let lMax = maxVal ? maxVal / 200 : null;
    let lUnit = unit === 'ml' ? 'cc/L' : `${unit}/L`;

    if (unit === 'kg') {
      lMin = (minVal * 1000) / 200;
      lMax = maxVal ? (maxVal * 1000) / 200 : null;
      lUnit = 'g/L';
    } else if (unit === 'l') {
      lMin = (minVal * 1000) / 200;
      lMax = maxVal ? (maxVal * 1000) / 200 : null;
      lUnit = 'cc/L';
    }

    const fmt = (n) => Number(n.toFixed(2)).toString();
    const dLitro = lMax ? `${fmt(lMin)} - ${fmt(lMax)} ${lUnit}` : `${fmt(lMin)} ${lUnit}`;
    const dEstanon = maxVal ? `${fmt(minVal)} - ${fmt(maxVal)} ${unit} / 200 L` : `${fmt(minVal)} ${unit} / 200 L`;

    return {
      dosisLitro: dLitro,
      dosisEstanon: dEstanon,
      textoCompleto: `${dLitro} (${dEstanon})`
    };
  }

  // Caso 2: Expresado por Litro (ej. "1.5 cc / L", "1 - 2 cc/L", "2 g/L", "0.5 ml/L", o simplemente "1.5 cc")
  const regexLitro = /([0-9]+(?:\.[0-9]+)?)(?:\s*-\s*([0-9]+(?:\.[0-9]+)?))?\s*(cc|ml|g|kg|l)?(?:\s*(?:\/|\s+por\s+)\s*l|\s*cc\/l|\s*g\/l|\s*ml\/l)?/i;
  const mLitro = raw.match(regexLitro);

  if (mLitro && mLitro[1]) {
    const minVal = parseFloat(mLitro[1]);
    const maxVal = mLitro[2] ? parseFloat(mLitro[2]) : null;
    const unit = (mLitro[3] || 'cc').toLowerCase();

    const eMin = minVal * 200;
    const eMax = maxVal ? maxVal * 200 : null;
    let eUnit = unit === 'ml' ? 'cc' : unit;

    const fmt = (n) => Number(n.toFixed(2)).toString();
    const lUnit = unit === 'ml' ? 'cc/L' : `${unit}/L`;
    const dLitro = maxVal ? `${fmt(minVal)} - ${fmt(maxVal)} ${lUnit}` : `${fmt(minVal)} ${lUnit}`;
    const dEstanon = eMax ? `${fmt(eMin)} - ${fmt(eMax)} ${eUnit} / 200 L` : `${fmt(eMin)} ${eUnit} / 200 L`;

    return {
      dosisLitro: dLitro,
      dosisEstanon: dEstanon,
      textoCompleto: `${dLitro} (${dEstanon})`
    };
  }

  return {
    dosisLitro: raw,
    dosisEstanon: raw.includes('200') ? raw : `${raw} / 200 L`,
    textoCompleto: raw
  };
}

/**
 * Convierte un valor por litro a estañón de 200 L
 */
export function convertirLitroAEstanon(valorLitro, unidad = 'cc') {
  const num = parseFloat(valorLitro);
  if (isNaN(num)) return '';
  const total = num * 200;
  return `${Number(total.toFixed(2))} ${unidad} / 200 L`;
}

/**
 * Convierte un valor de estañón de 200 L a dosis por litro
 */
export function convertirEstanonALitro(valorEstanon, unidad = 'cc') {
  const num = parseFloat(valorEstanon);
  if (isNaN(num)) return '';
  const porLitro = num / 200;
  return `${Number(porLitro.toFixed(2))} ${unidad}/L`;
}
