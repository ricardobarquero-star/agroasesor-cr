/**
 * Servicio de Cálculo Estequiométrico, Incompatibilidad Química y Balance Fenológico
 * Especializado para fertirriego y nutrición de cultivos en Costa Rica.
 * Criterio agronómico profesional: Ing. Agr. Ricardo Manuel Barquero Chacón (Col. 5896).
 */

// Composición nutricional estequiométrica de fertilizantes solubles de Costa Rica
export const FERTILIZANTES_QUIMICA = {
  // --- FUENTES DE NITRÓGENO Y CALCIO ---
  'calcinit': {
    nombre: 'Nitrato de Calcio (Calcinit)',
    alias: ['calcinit', 'nitrato de calcio', 'calcio nitrato', 'yara liva calcinit'],
    nTotal: 15.5, nNitrico: 14.4, nAmoniacal: 1.1, p2o5: 0, k2o: 0, cao: 26.5, mgo: 0, s: 0,
    tanqueRecomendado: 'A',
    tipo: 'calcio_nitrato'
  },
  'nitrato de potasio': {
    nombre: 'Nitrato de Potasio (Multi-K / Krista K)',
    alias: ['nitrato de potasio', 'multi-k', 'krista k', 'kno3', 'nitropotasio'],
    nTotal: 13.0, nNitrico: 13.0, nAmoniacal: 0, p2o5: 0, k2o: 46.0, cao: 0, mgo: 0, s: 0,
    tanqueRecomendado: 'A',
    tipo: 'nitrato_potasio'
  },
  'nitrato de magnesio': {
    nombre: 'Nitrato de Magnesio (Magnisal / Krista MAG N)',
    alias: ['nitrato de magnesio', 'magnisal', 'krista mag n', 'magnesio nitrato'],
    nTotal: 11.0, nNitrico: 11.0, nAmoniacal: 0, p2o5: 0, k2o: 0, cao: 0, mgo: 16.0, s: 0,
    tanqueRecomendado: 'A',
    tipo: 'nitrato_magnesio'
  },

  // --- FUENTES DE FÓSFORO, POTASIO Y SULFATOS ---
  'mkp': {
    nombre: 'Fosfato Monopotásico (MKP 0-52-34)',
    alias: ['mkp', 'fosfato monopotásico', 'fosfato monopotasico', 'krista mkp', 'pekaacid'],
    nTotal: 0, nNitrico: 0, nAmoniacal: 0, p2o5: 52.0, k2o: 34.0, cao: 0, mgo: 0, s: 0,
    tanqueRecomendado: 'B',
    tipo: 'fosfato_potasio'
  },
  'map': {
    nombre: 'Fosfato Monoamónico (MAP 12-61-0)',
    alias: ['map', 'fosfato monoamónico', 'fosfato monoamonico', 'krista map'],
    nTotal: 12.0, nNitrico: 0, nAmoniacal: 12.0, p2o5: 61.0, k2o: 0, cao: 0, mgo: 0, s: 0,
    tanqueRecomendado: 'B',
    tipo: 'fosfato_amonio'
  },
  'sulfato de potasio': {
    nombre: 'Sulfato de Potasio (SoluSOP 0-0-50 + 18S)',
    alias: ['sulfato de potasio', 'solusop', 'krista sop', 'sop', 'k2so4'],
    nTotal: 0, nNitrico: 0, nAmoniacal: 0, p2o5: 0, k2o: 50.0, cao: 0, mgo: 0, s: 18.0,
    tanqueRecomendado: 'B',
    tipo: 'sulfato_potasio'
  },
  'sulfato de magnesio': {
    nombre: 'Sulfato de Magnesio (Sal de Epsom)',
    alias: ['sulfato de magnesio', 'sal de epsom', 'krista mg', 'krista epsom', 'epsomita', 'mgso4'],
    nTotal: 0, nNitrico: 0, nAmoniacal: 0, p2o5: 0, k2o: 0, cao: 0, mgo: 16.0, s: 13.0,
    tanqueRecomendado: 'B',
    tipo: 'sulfato_magnesio'
  },
  'sulfato de amonio': {
    nombre: 'Sulfato de Amonio soluble',
    alias: ['sulfato de amonio', 'sulfato amónico', 'sam soluble'],
    nTotal: 21.0, nNitrico: 0, nAmoniacal: 21.0, p2o5: 0, k2o: 0, cao: 0, mgo: 0, s: 24.0,
    tanqueRecomendado: 'B',
    tipo: 'sulfato_amonio'
  },
  'acido fosforico': {
    nombre: 'Ácido Fosfórico 85%',
    alias: ['ácido fosfórico', 'acido fosforico', 'h3po4'],
    nTotal: 0, nNitrico: 0, nAmoniacal: 0, p2o5: 61.6, k2o: 0, cao: 0, mgo: 0, s: 0,
    tanqueRecomendado: 'B',
    tipo: 'acido_fosforico'
  },
  'urea soluble': {
    nombre: 'Urea soluble (46-0-0)',
    alias: ['urea', 'urea soluble', 'urea foliar'],
    nTotal: 46.0, nNitrico: 0, nAmoniacal: 46.0, p2o5: 0, k2o: 0, cao: 0, mgo: 0, s: 0,
    tanqueRecomendado: 'B',
    tipo: 'urea'
  },

  // --- MICROELEMENTOS ---
  'quelato hierro eddha': {
    nombre: 'Quelato de Hierro Fe-EDDHA 6%',
    alias: ['quelato de hierro', 'fe eddha', 'hierro eddha', 'ferrostran', 'sequestrene', 'librel fe-lo'],
    fe: 6.0, zn: 0, mn: 0, b: 0, cu: 0, mo: 0,
    tanqueRecomendado: 'A',
    tipo: 'micro_fe'
  },
  'quelato hierro edta': {
    nombre: 'Quelato de Hierro Fe-EDTA 13%',
    alias: ['librel fe', 'fe edta', 'hierro edta'],
    fe: 13.0, zn: 0, mn: 0, b: 0, cu: 0, mo: 0,
    tanqueRecomendado: 'A',
    tipo: 'micro_fe'
  },
  'boro soluble': {
    nombre: 'Boro soluble (Solubor 20.5% B)',
    alias: ['solubor', 'boro soluble', 'ácido bórico', 'borax', 'boro'],
    fe: 0, zn: 0, mn: 0, b: 20.5, cu: 0, mo: 0,
    tanqueRecomendado: 'B',
    tipo: 'micro_b'
  },
  'sulfato de zinc': {
    nombre: 'Sulfato de Zinc heptahidratado',
    alias: ['sulfato de zinc', 'zinc sulfato', 'librel zn', 'zn-edta'],
    fe: 0, zn: 22.0, mn: 0, b: 0, cu: 0, mo: 0,
    tanqueRecomendado: 'B',
    tipo: 'micro_zn'
  },
  'sulfato de manganeso': {
    nombre: 'Sulfato de Manganeso monohidratado',
    alias: ['sulfato de manganeso', 'manganeso sulfato', 'librel mn'],
    fe: 0, zn: 0, mn: 31.0, b: 0, cu: 0, mo: 0,
    tanqueRecomendado: 'B',
    tipo: 'micro_mn'
  },
  'mezcla microelementos': {
    nombre: 'Complejo de Microelementos Quelatados (Librel BMX / Cosmoquel)',
    alias: ['librel bmx', 'cosmoquel', 'micromix', 'hortrilon', 'tradecorp az', 'microelementos'],
    fe: 4.0, zn: 4.0, mn: 3.0, b: 0.8, cu: 0.5, mo: 0.1,
    tanqueRecomendado: 'B',
    tipo: 'micro_mix'
  }
};

// Catálogo de Etapas Fenológicas recomendadas
export const ETAPAS_FENOLOGICAS = [
  'Planta saliendo de cosecha / Recuperación',
  'Enraizamiento y establecimiento inicial',
  'Desarrollo vegetativo activo',
  'Inducción y diferenciación floral (Pre-floración)',
  'Floración y amarre de botón',
  'Cuajado y desarrollo inicial de fruto',
  'Llenado, engrose y calibre de fruto',
  'Maduración y concentración de azúcares (°Brix)',
  'Post-cosecha y acumulación de reservas'
];

// Catálogo de Objetivos de Fertilización recomendados
export const OBJETIVOS_FERTILIZACION = [
  'Promoción de floración y fertilidad de polen',
  'Estimulación radicular y emisión de pelos absorbentes',
  'Crecimiento vegetativo y área foliar fotosintética',
  'Llenado, peso específico y calibre comercial de fruto',
  'Firmeza, resistencia de pared celular y vida de anaquel (Calcio)',
  'Corrección de clorosis y activación fotosintética (Mg + Fe)',
  'Recuperación de vigor post-cosecha y sanidad de corona',
  'Alineación de conductividad eléctrica (CE) y pH en rizosfera'
];

/**
 * Busca las propiedades químicas de un fertilizante por nombre comercial
 */
export function identificarFertilizante(nombreProducto) {
  if (!nombreProducto || typeof nombreProducto !== 'string') return null;
  const lower = nombreProducto.toLowerCase().trim();

  // Búsqueda directa por alias
  for (const key of Object.keys(FERTILIZANTES_QUIMICA)) {
    const fert = FERTILIZANTES_QUIMICA[key];
    if (fert.alias.some(a => lower.includes(a))) {
      return fert;
    }
  }

  return null;
}

/**
 * Convierte cualquier dosis y unidad ingresada por el usuario a KILOGRAMOS (kg)
 */
export function normalizarDosisAKg(dosisStr, unidadStr = '') {
  if (!dosisStr) return 0;
  const num = parseFloat(String(dosisStr).replace(',', '.').trim());
  if (isNaN(num) || num <= 0) return 0;

  const u = (unidadStr || '').toLowerCase();

  // 1. Si está en kilogramos (evaluar primero para que 'kg /' no coincida con 'g /')
  if (u.includes('kg') || u.includes('kilo')) {
    return num;
  }

  // 2. Si está en gramos
  if (u.includes('g /') || u.includes('g/') || u.includes('gramo')) {
    return num / 1000.0;
  }

  // 3. Si está en cc o ml (asumiendo densidad ~1.0 g/cc)
  if (u.includes('cc') || u.includes('ml')) {
    return num / 1000.0;
  }

  // 4. Si está en litros (asumiendo densidad ~1.2 kg/L promedio para sales líquidas/ácidos)
  if (u.includes('l /') || u.includes('l/') || u.includes('litro')) {
    return num * 1.2;
  }

  return num;
}

/**
 * Calcula el aporte estequiométrico total de nutrientes de una lista de productos
 * @param {Array} lineasProductos - [{ producto: string, dosis: string/number, unidad: string }]
 * @returns {Object} Aporte elemental acumulado (kg o g) y balances catiónicos
 */
export function calcularNutrientesTotales(lineasProductos = []) {
  const acumulado = {
    nTotalKg: 0,
    nNitricoKg: 0,
    nAmoniacalKg: 0,
    p2o5Kg: 0,
    k2oKg: 0,
    caoKg: 0,
    mgoKg: 0,
    sKg: 0,
    feGramos: 0,
    znGramos: 0,
    mnGramos: 0,
    bGramos: 0,
    cuGramos: 0,
    moGramos: 0,
    fertilizantesDetectados: 0,
    fertilizantesTotales: lineasProductos.filter(l => l.producto && l.dosis).length
  };

  lineasProductos.forEach(linea => {
    const producto = linea.producto || '';
    const kg = normalizarDosisAKg(linea.dosis, linea.unidad);
    if (kg <= 0) return;

    const datosQuimicos = identificarFertilizante(producto);
    if (datosQuimicos) {
      acumulado.fertilizantesDetectados++;
      // Macronutrientes (kg aportados)
      acumulado.nTotalKg += kg * ((datosQuimicos.nTotal || 0) / 100.0);
      acumulado.nNitricoKg += kg * ((datosQuimicos.nNitrico || 0) / 100.0);
      acumulado.nAmoniacalKg += kg * ((datosQuimicos.nAmoniacal || 0) / 100.0);
      acumulado.p2o5Kg += kg * ((datosQuimicos.p2o5 || 0) / 100.0);
      acumulado.k2oKg += kg * ((datosQuimicos.k2o || 0) / 100.0);
      acumulado.caoKg += kg * ((datosQuimicos.cao || 0) / 100.0);
      acumulado.mgoKg += kg * ((datosQuimicos.mgo || 0) / 100.0);
      acumulado.sKg += kg * ((datosQuimicos.s || 0) / 100.0);

      // Micronutrientes (gramos aportados)
      const gramosFert = kg * 1000.0;
      acumulado.feGramos += gramosFert * ((datosQuimicos.fe || 0) / 100.0);
      acumulado.znGramos += gramosFert * ((datosQuimicos.zn || 0) / 100.0);
      acumulado.mnGramos += gramosFert * ((datosQuimicos.mn || 0) / 100.0);
      acumulado.bGramos += gramosFert * ((datosQuimicos.b || 0) / 100.0);
      acumulado.cuGramos += gramosFert * ((datosQuimicos.cu || 0) / 100.0);
      acumulado.moGramos += gramosFert * ((datosQuimicos.mo || 0) / 100.0);
    }
  });

  // Factores de conversión estequiométrica a elementos puros
  const pElementalKg = acumulado.p2o5Kg * 0.4364;
  const kElementalKg = acumulado.k2oKg * 0.8302;
  const caElementalKg = acumulado.caoKg * 0.7147;
  const mgElementalKg = acumulado.mgoKg * 0.6030;

  // Relaciones y balances nutricionales
  const relacionNK = acumulado.k2oKg > 0 ? (acumulado.nTotalKg / acumulado.k2oKg) : 0;
  const relacionKN = acumulado.nTotalKg > 0 ? (acumulado.k2oKg / acumulado.nTotalKg) : 0;
  const totalCationes = acumulado.k2oKg + acumulado.caoKg + acumulado.mgoKg;
  const pctK = totalCationes > 0 ? ((acumulado.k2oKg / totalCationes) * 100) : 0;
  const pctCa = totalCationes > 0 ? ((acumulado.caoKg / totalCationes) * 100) : 0;
  const pctMg = totalCationes > 0 ? ((acumulado.mgoKg / totalCationes) * 100) : 0;
  const pctNitrico = acumulado.nTotalKg > 0 ? ((acumulado.nNitricoKg / acumulado.nTotalKg) * 100) : 100;
  const pctAmoniacal = acumulado.nTotalKg > 0 ? ((acumulado.nAmoniacalKg / acumulado.nTotalKg) * 100) : 0;

  return {
    ...acumulado,
    pElementalKg,
    kElementalKg,
    caElementalKg,
    mgElementalKg,
    relacionNK: parseFloat(relacionNK.toFixed(2)),
    relacionKN: parseFloat(relacionKN.toFixed(2)),
    balanceCationico: {
      pctK: parseFloat(pctK.toFixed(1)),
      pctCa: parseFloat(pctCa.toFixed(1)),
      pctMg: parseFloat(pctMg.toFixed(1))
    },
    formasNitrogeno: {
      pctNitrico: parseFloat(pctNitrico.toFixed(1)),
      pctAmoniacal: parseFloat(pctAmoniacal.toFixed(1))
    }
  };
}

/**
 * Audita incompatibilidades fisicoquímicas en tanques de fertirriego
 */
export function auditarIncompatibilidadQuimica({ modalidad, lineasA = [], lineasB = [], lineasProductos = [] }) {
  const alertas = [];
  const advertencias = [];

  if (modalidad === 'dosatron') {
    // 1. Incompatibilidad de Calcio con Sulfatos o Fosfatos en Tanque A
    const nombresA = lineasA.map(l => (l.producto || '').toLowerCase()).join(' ');
    const tieneCalcioEnA = nombresA.includes('calcinit') || nombresA.includes('calcio');
    const tieneFosfatoEnA = nombresA.includes('mkp') || nombresA.includes('fosfato') || nombresA.includes('map') || nombresA.includes('ácido fosfórico') || nombresA.includes('acido fosforico');
    const tieneSulfatoEnA = nombresA.includes('sulfato') || nombresA.includes('solusop') || nombresA.includes('epsom');

    if (tieneCalcioEnA && tieneSulfatoEnA) {
      alertas.push('🚨 PRECIPITACIÓN CRÍTICA EN TANQUE A: Se detectó Calcio (Calcinit) mezclado con Sulfatos. Esto formará Yeso insoluble (CaSO4) obturando irreversiblemente los goteros.');
    }
    if (tieneCalcioEnA && tieneFosfatoEnA) {
      alertas.push('🚨 PRECIPITACIÓN CRÍTICA EN TANQUE A: Se detectó Calcio mezclado con Fosfatos (MKP/MAP). Se precipitará Fosfato Dicálcico insoluble.');
    }

    // 2. Incompatibilidad en Tanque B (Ácidos muy concentrados con Quelatos)
    const nombresB = lineasB.map(l => (l.producto || '').toLowerCase()).join(' ');
    if ((nombresB.includes('ácido') || nombresB.includes('acido')) && (nombresB.includes('eddha') || nombresB.includes('edta'))) {
      advertencias.push('⚠️ RIESGO DE RUPTURA DE QUELATOS EN TANQUE B: No vierta ácido fosfórico puro directamente sobre polvos de quelatos de hierro; diluya primero el ácido en agua antes de incorporar microelementos.');
    }
  } else {
    // Modalidad tanque directo o venturi único
    const nombresUnicos = lineasProductos.map(l => (l.producto || '').toLowerCase()).join(' ');
    const tieneCalcio = nombresUnicos.includes('calcinit') || nombresUnicos.includes('calcio');
    const tieneFosfato = nombresUnicos.includes('mkp') || nombresUnicos.includes('fosfato') || nombresUnicos.includes('map');
    const tieneSulfato = nombresUnicos.includes('sulfato') || nombresUnicos.includes('solusop') || nombresUnicos.includes('epsom');

    if (tieneCalcio && (tieneSulfato || tieneFosfato)) {
      alertas.push('⚠️ PRECAUCIÓN DE SOLUBILIDAD EN TANQUE ÚNICO: Al preparar mezclas directas de Calcio con Sulfatos/Fosfatos, mantenga una alta dilución (concentración < 1.5 g/L en tanque final) para evitar precipitados insolubles.');
    }
  }

  return {
    incompatible: alertas.length > 0,
    alertas,
    advertencias
  };
}

/**
 * Analiza la fórmula propuesta con respecto a la etapa fenológica y al objetivo de fertilización
 */
export function auditarObjetivoFenologico({ cultivo = '', etapaFenologica = '', objetivoFertilizacion = '', metricas }) {
  const sugerencias = [];
  const observaciones = [];
  let estadoBalance = 'adecuado';

  const eLower = (etapaFenologica || '').toLowerCase();
  const oLower = (objetivoFertilizacion || '').toLowerCase();

  const { nTotalKg, p2o5Kg, k2oKg, caoKg, relacionKN, formasNitrogeno } = metricas;

  // 1. Regla de nitrógeno amoniacal en fertirriego
  if (formasNitrogeno && formasNitrogeno.pctAmoniacal > 25) {
    sugerencias.push(`⚠️ Elevado porcentaje de N amoniacal (${formasNitrogeno.pctAmoniacal}%): En fertirriego de ${cultivo || 'cultivos'}, el N amoniacal debe ser ≤ 15-20% del N total para no acidificar excesivamente la rizosfera ni competir con la absorción de Calcio y Magnesio.`);
    estadoBalance = 'requiere_ajuste';
  }

  // 2. OBJETIVO: Promoción de Floración
  if (oLower.includes('floraci') || eLower.includes('floraci') || eLower.includes('pre-floraci')) {
    if (p2o5Kg <= 0) {
      sugerencias.push('🌸 Para inducir y promover floración, incorpore una fuente rica en Fósforo asimilable (ej: MKP 0-52-34) para suministrar ATP en la diferenciación de primordios florales.');
      estadoBalance = 'requiere_ajuste';
    }
    if (relacionKN < 1.2 && k2oKg > 0 && nTotalKg > 0) {
      observaciones.push('💡 En floración, mantenga una relación K:N de 1.2 a 1.5 para evitar abortos florales por exceso de vigor vegetativo.');
    }
    if (metricas.bGramos <= 0 && metricas.znGramos <= 0) {
      sugerencias.push('🐝 Se recomienda adicionar Boro (Solubor) y Zinc para garantizar viabilidad del polen, elongación del tubo polínico y óptimo cuajado.');
    }
  }

  // 3. ETAPA: Planta saliendo de cosecha / Recuperación
  if (eLower.includes('saliendo de cosecha') || eLower.includes('recuperaci') || eLower.includes('post-cosecha') || oLower.includes('recuperaci')) {
    if (nTotalKg > k2oKg * 1.5 && k2oKg > 0) {
      sugerencias.push('🌱 En plantas saliendo de cosecha, evite un shock excesivo de Nitrógeno que genere brotes tiernos susceptibles a patógenos. Priorice una relación equilibrada N:K (1:1.2) junto con bioestimulación radicular.');
      estadoBalance = 'requiere_ajuste';
    } else {
      observaciones.push('✅ Fórmula orientada a restauración fisiológica sin forzar elongación excesiva en el tercio superior.');
    }
    if (p2o5Kg > 0) {
      observaciones.push('💧 Excelente aporte de Fósforo para reactivar la masa radicular y nuevos pelos absorbentes tras el estrés de corte.');
    }
  }

  // 4. OBJETIVO: Llenado de Fruto y Calibre
  if (oLower.includes('llenado') || oLower.includes('calibre') || eLower.includes('llenado') || eLower.includes('engrose')) {
    if (k2oKg <= nTotalKg && nTotalKg > 0) {
      sugerencias.push('🍉 Para llenado y calibre de fruto, la curva de absorción exige dominancia de Potasio (relación K:N de 1.6 a 2.2). Aumente Sulfato de Potasio o Nitrato de Potasio.');
      estadoBalance = 'requiere_ajuste';
    }
    if (caoKg <= 0) {
      sugerencias.push('🧱 No descuide el Calcio soluble (Calcinit) durante el llenado para evitar problemas de ablandamiento, rajado de fruto o necrosis apical (Blossom End Rot).');
    }
  }

  // 5. OBJETIVO: Firmeza y Calcio estructural
  if (oLower.includes('firmeza') || oLower.includes('calcio') || oLower.includes('pared celular')) {
    if (caoKg <= 0) {
      sugerencias.push('🛡️ Para lograr firmeza de pared celular y vida de anaquel, es indispensable suministrar Nitrato de Calcio (Calcinit) en Tanque A.');
      estadoBalance = 'requiere_ajuste';
    }
  }

  // 6. Diagnóstico general si no hay sugerencias críticas
  if (sugerencias.length === 0) {
    observaciones.push(`✅ La fórmula propuesta se alinea coherentemente con la curva de absorción para ${cultivo || 'el cultivo'} en etapa "${etapaFenologica || 'actual'}" con meta de "${objetivoFertilizacion || 'nutrición balanceada'}".`);
  }

  return {
    estadoBalance,
    sugerencias,
    observaciones
  };
}
