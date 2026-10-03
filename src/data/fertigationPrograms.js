/**
 * Catálogo Oficial de Programas y Fórmulas de Fertirriego para Costa Rica
 * Programa de Nutrición de Fresa extraído de Formulas_Fertirriego_Fresa.xlsx (Llano Grande de Cartago)
 * Criterio profesional: Ing. Agr. Ricardo Manuel Barquero Chacón (Colegiado Ord. 5896)
 */

export const FORMULAS_FERTIRRIEGO_BASE = [
  {
    id: 'fresa_f1_vegetativo',
    codigo: 'F1',
    nombre: 'F1 - Vegetativo y Estolones (Llano Grande)',
    cultivoId: 'fresa',
    cultivoNombre: 'Fresa (Fragaria x ananassa)',
    etapaFenologica: 'Vegetativo y estolones',
    duracionTipica: '3-5 semanas',
    frecuenciaRecomendada: 'Lunes y Jueves (Frecuencia 2x)',
    pulsosPorSemana: 2,
    objetivoFertilizacion: 'N alto-moderado, P para raíz, Ca y Mg sostenidos',
    modalidad: 'tanque_directo',
    volumenBaseLitros: 1000,
    ceEstimada: '1.26',
    phEstimado: '5.8',
    salesBase1000L: [
      { producto: 'Nitrato de Calcio (Calcinit)', dosis1000L: 580, unidad: 'g / tanque 1000 L', orden: 5, tipo: 'sal_fertilizante' },
      { producto: 'Nitrato de Potasio (Multi-K / Krista K)', dosis1000L: 130, unidad: 'g / tanque 1000 L', orden: 2, tipo: 'sal_fertilizante' },
      { producto: 'Fosfato Monoamónico (MAP 12-61-0)', dosis1000L: 130, unidad: 'g / tanque 1000 L', orden: 1, tipo: 'sal_fertilizante' },
      { producto: 'Sulfato de Potasio (SoluSOP 0-0-50 + 18S)', dosis1000L: 170, unidad: 'g / tanque 1000 L', orden: 3, tipo: 'sal_fertilizante' },
      { producto: 'Sulfato de Magnesio (Sal de Epsom)', dosis1000L: 305, unidad: 'g / tanque 1000 L', orden: 4, tipo: 'sal_fertilizante' }
    ],
    ppmAportadas: {
      nTotal: 122.4,
      nNitrico: 100.4,
      nAmoniacal: 22.0,
      p: 34.1,
      p2o5: 78.0,
      k: 120.2,
      k2o: 144.9,
      ca: 110.2,
      mg: 29.9,
      s: 70.3
    },
    suplementosSugeridos: [
      { producto: 'Trichoderma (Tusal WG / Trichobiol)', dosisSugerida: 200, unidad: 'g / tanque 1000 L', tipo: 'biologico', motivo: 'Protección biológica radicular contra hongos de suelo' }
    ],
    totalSalesGramos: 1315,
    instruccionesPreparacion: 'Orden de preparación para tanque directo:\n1. Llenar el tanque al 60-70% con agua limpia.\n2. Disolver primero fosfatos (MAP 12-61-0) en un balde con agitación y verter al tanque.\n3. Disolver sulfatos (Sulfato de potasio y Sulfato de magnesio) e incorporar.\n4. Al final disolver Nitrato de calcio con agitación continua enérgica.\n5. Completar aforando al volumen final del tanque (1000 L o capacidad real).\n6. Verificar pH (óptimo 5.5 - 6.2) y Conductividad Eléctrica (~1.26 dS/m).',
    origen: 'Programa Oficial Fresa - Llano Grande, Cartago (Formulas_Fertirriego_Fresa.xlsx)',
    esOficial: true
  },
  {
    id: 'fresa_f2_induccion',
    codigo: 'F2',
    nombre: 'F2 - Inducción a Floración (Llano Grande)',
    cultivoId: 'fresa',
    cultivoNombre: 'Fresa (Fragaria x ananassa)',
    etapaFenologica: 'Inducción y diferenciación floral (Pre-floración)',
    duracionTipica: '2-3 semanas',
    frecuenciaRecomendada: 'Lunes y Jueves (Frecuencia 2x)',
    pulsosPorSemana: 2,
    objetivoFertilizacion: 'Baja N, sube P y K para favorecer la diferenciación floral',
    modalidad: 'tanque_directo',
    volumenBaseLitros: 1000,
    ceEstimada: '1.14',
    phEstimado: '5.8',
    salesBase1000L: [
      { producto: 'Nitrato de Calcio (Calcinit)', dosis1000L: 525, unidad: 'g / tanque 1000 L', orden: 5, tipo: 'sal_fertilizante' },
      { producto: 'Fosfato Monoamónico (MAP 12-61-0)', dosis1000L: 20, unidad: 'g / tanque 1000 L', orden: 1, tipo: 'sal_fertilizante' },
      { producto: 'Fosfato Monopotásico (MKP 0-52-34)', dosis1000L: 200, unidad: 'g / tanque 1000 L', orden: 2, tipo: 'sal_fertilizante' },
      { producto: 'Sulfato de Potasio (SoluSOP 0-0-50 + 18S)', dosis1000L: 200, unidad: 'g / tanque 1000 L', orden: 3, tipo: 'sal_fertilizante' },
      { producto: 'Sulfato de Magnesio (Sal de Epsom)', dosis1000L: 285, unidad: 'g / tanque 1000 L', orden: 4, tipo: 'sal_fertilizante' }
    ],
    ppmAportadas: {
      nTotal: 83.8,
      nNitrico: 75.6,
      nAmoniacal: 8.2,
      p: 50.6,
      p2o5: 116.0,
      k: 139.4,
      k2o: 168.0,
      ca: 99.8,
      mg: 27.9,
      s: 73.1
    },
    suplementosSugeridos: [
      { producto: 'Boro soluble (Solubor 20.5% B)', dosisSugerida: 100, unidad: 'g / tanque 1000 L', tipo: 'suplemento', motivo: 'Viabilidad del polen y amarre de primordios florales' }
    ],
    totalSalesGramos: 1230,
    instruccionesPreparacion: 'Orden de preparación para tanque directo:\n1. Llenar el tanque al 60-70% con agua limpia.\n2. Disolver primero los fosfatos (MKP 0-52-34 y MAP) con buena agitación.\n3. Disolver sulfatos (Sulfato de potasio y Sulfato de magnesio).\n4. Agregar al final el Nitrato de calcio con agitación continua.\n5. Completar aforando el tanque; medir pH (5.5 - 6.2) y CE (~1.14 dS/m).',
    origen: 'Programa Oficial Fresa - Llano Grande, Cartago (Formulas_Fertirriego_Fresa.xlsx)',
    esOficial: true
  },
  {
    id: 'fresa_f3_llenado',
    codigo: 'F3',
    nombre: 'F3 - Llenado y Calidad de Fruto (Llano Grande)',
    cultivoId: 'fresa',
    cultivoNombre: 'Fresa (Fragaria x ananassa)',
    etapaFenologica: 'Llenado, engrose y calibre de fruto',
    duracionTipica: 'Toda la cosecha',
    frecuenciaRecomendada: 'Lunes y Jueves (Frecuencia 2x)',
    pulsosPorSemana: 2,
    objetivoFertilizacion: 'K alto, Ca 120 ppm para firmeza, tamaño y vida de anaquel',
    modalidad: 'tanque_directo',
    volumenBaseLitros: 1000,
    ceEstimada: '1.43',
    phEstimado: '5.8',
    salesBase1000L: [
      { producto: 'Nitrato de Calcio (Calcinit)', dosis1000L: 630, unidad: 'g / tanque 1000 L', orden: 5, tipo: 'sal_fertilizante' },
      { producto: 'Fosfato Monoamónico (MAP 12-61-0)', dosis1000L: 10, unidad: 'g / tanque 1000 L', orden: 1, tipo: 'sal_fertilizante' },
      { producto: 'Fosfato Monopotásico (MKP 0-52-34)', dosis1000L: 190, unidad: 'g / tanque 1000 L', orden: 2, tipo: 'sal_fertilizante' },
      { producto: 'Sulfato de Potasio (SoluSOP 0-0-50 + 18S)', dosis1000L: 355, unidad: 'g / tanque 1000 L', orden: 3, tipo: 'sal_fertilizante' },
      { producto: 'Sulfato de Magnesio (Sal de Epsom)', dosis1000L: 325, unidad: 'g / tanque 1000 L', orden: 4, tipo: 'sal_fertilizante' }
    ],
    ppmAportadas: {
      nTotal: 98.9,
      nNitrico: 90.7,
      nAmoniacal: 8.1,
      p: 45.8,
      p2o5: 104.8,
      k: 200.9,
      k2o: 242.1,
      ca: 119.7,
      mg: 31.9,
      s: 106.2
    },
    suplementosSugeridos: [
      { producto: 'BioAct Prime (Purpureocillium lilacinum)', dosisSugerida: 250, unidad: 'cc / tanque 1000 L', tipo: 'nematicida', motivo: 'Control biológico de nematodos fitoparásitos en zona radicular' }
    ],
    totalSalesGramos: 1510,
    instruccionesPreparacion: 'Orden de preparación para tanque directo:\n1. Llenar el tanque al 60-70% con agua limpia.\n2. Disolver primero fosfatos (MKP y MAP).\n3. Disolver sulfatos: el Sulfato de potasio disuelve lento en agua fría, usar agitación enérgica.\n4. Incorporar Sulfato de magnesio.\n5. Al final verter Nitrato de calcio con agitación constante.\n6. Aforar el tanque; verificar pH (5.5 - 6.2) y CE (~1.43 dS/m).',
    origen: 'Programa Oficial Fresa - Llano Grande, Cartago (Formulas_Fertirriego_Fresa.xlsx)',
    esOficial: true
  },
  {
    id: 'fresa_f4_recuperacion',
    codigo: 'F4',
    nombre: 'F4 - Recuperación Poscosecha (Llano Grande)',
    cultivoId: 'fresa',
    cultivoNombre: 'Fresa (Fragaria x ananassa)',
    etapaFenologica: 'Planta saliendo de cosecha / Recuperación',
    duracionTipica: '2-4 semanas',
    frecuenciaRecomendada: 'Lunes y Jueves (Frecuencia 2x)',
    pulsosPorSemana: 2,
    objetivoFertilizacion: 'Reponer reservas de la corona, raíz y hoja nueva; luego pasar a F2',
    modalidad: 'tanque_directo',
    volumenBaseLitros: 1000,
    ceEstimada: '1.30',
    phEstimado: '5.8',
    salesBase1000L: [
      { producto: 'Nitrato de Calcio (Calcinit)', dosis1000L: 580, unidad: 'g / tanque 1000 L', orden: 5, tipo: 'sal_fertilizante' },
      { producto: 'Nitrato de Potasio (Multi-K / Krista K)', dosis1000L: 130, unidad: 'g / tanque 1000 L', orden: 2, tipo: 'sal_fertilizante' },
      { producto: 'Fosfato Monoamónico (MAP 12-61-0)', dosis1000L: 145, unidad: 'g / tanque 1000 L', orden: 1, tipo: 'sal_fertilizante' },
      { producto: 'Sulfato de Potasio (SoluSOP 0-0-50 + 18S)', dosis1000L: 195, unidad: 'g / tanque 1000 L', orden: 3, tipo: 'sal_fertilizante' },
      { producto: 'Sulfato de Magnesio (Sal de Epsom)', dosis1000L: 305, unidad: 'g / tanque 1000 L', orden: 4, tipo: 'sal_fertilizante' }
    ],
    ppmAportadas: {
      nTotal: 124.2,
      nNitrico: 100.4,
      nAmoniacal: 23.8,
      p: 38.0,
      p2o5: 87.0,
      k: 130.6,
      k2o: 157.4,
      ca: 110.2,
      mg: 29.9,
      s: 74.8
    },
    suplementosSugeridos: [
      { producto: 'Rootex (Enraizante y Fósforo asimilable)', dosisSugerida: 250, unidad: 'g / tanque 1000 L', tipo: 'bioestimulante', motivo: 'Reactivación de biomasa radicular tras corte de cosecha' }
    ],
    totalSalesGramos: 1355,
    instruccionesPreparacion: 'Manejo previo y preparación:\n1. Realizar deshoje sanitario de hojas senescentes, retirar fruta remanente y estolones no deseados (baja inóculo de patógenos).\n2. En el tanque: disolver MAP, luego sulfatos y Nitrato de potasio.\n3. Incorporar Nitrato de calcio al final con agitación continua.\n4. Aforar y verificar pH (5.5 - 6.2) y CE (~1.30 dS/m).',
    origen: 'Programa Oficial Fresa - Llano Grande, Cartago (Formulas_Fertirriego_Fresa.xlsx)',
    esOficial: true
  }
];

export const SUPLEMENTOS_FERTIRRIEGO_CR = [
  {
    id: 'sup_trichoderma_tusal',
    nombre: 'Trichoderma (Tusal WG / Trichobiol)',
    categoria: 'Controlador Biológico / Sanidad Radicular',
    dosisSugerida1000L: 200,
    unidad: 'g / tanque 1000 L',
    tipo: 'biologico',
    icono: '🦠',
    descripcion: 'Inoculación de Trichoderma asperellum/atroviride para protección de bulbo húmedo y prevención de Phytophthora/Pythium.'
  },
  {
    id: 'sup_nematicida_bioact',
    nombre: 'BioAct Prime (Purpureocillium lilacinum)',
    categoria: 'Bionematicida Ovoparásito Microbiano',
    dosisSugerida1000L: 250,
    unidad: 'cc / tanque 1000 L',
    tipo: 'nematicida',
    icono: '🪱',
    descripcion: 'Hongo parásito de huevos y hembras de Meloidogyne y Pratylenchus en fresa y hortalizas.'
  },
  {
    id: 'sup_nematicida_verango',
    nombre: 'Verango 500 SC (Fluopyram)',
    categoria: 'Nematicida Químico Sistémico',
    dosisSugerida1000L: 200,
    unidad: 'cc / tanque 1000 L',
    tipo: 'nematicida',
    icono: '🧪',
    descripcion: 'Nematicida de alta eficacia y bajo impacto en nematofauna benéfica para inyección en fertirriego.'
  },
  {
    id: 'sup_nematicida_nimitz',
    nombre: 'Nimitz 480 EC (Fluensulfone)',
    categoria: 'Nematicida No Fumigante',
    dosisSugerida1000L: 300,
    unidad: 'cc / tanque 1000 L',
    tipo: 'nematicida',
    icono: '🧪',
    descripcion: 'Inhibe motilidad e infectividad de nematodos en suelo.'
  },
  {
    id: 'sup_enraizante_rootex',
    nombre: 'Rootex (Cosmocel Enraizante y Fósforo)',
    categoria: 'Bioestimulante Radicular',
    dosisSugerida1000L: 250,
    unidad: 'g / tanque 1000 L',
    tipo: 'bioestimulante',
    icono: '🌱',
    descripcion: 'Estimulación de emisión de raíces secundarias y pelos absorbentes en fertirriego.'
  },
  {
    id: 'sup_algas_kelpak',
    nombre: 'Kelpak (Extracto de Ecklonia maxima)',
    categoria: 'Extracto de Algas / Auxinas Naturales',
    dosisSugerida1000L: 500,
    unidad: 'cc / tanque 1000 L',
    tipo: 'bioestimulante',
    icono: '🌿',
    descripcion: 'Balance auxinas/citoquininas para estimulación radicular y tolerancia a estrés hídrico.'
  },
  {
    id: 'sup_acidos_humicos',
    nombre: 'Ácidos Húmicos y Fúlvicos Líquidos',
    categoria: 'Mejorador de Rizosfera y CIC',
    dosisSugerida1000L: 500,
    unidad: 'cc / tanque 1000 L',
    tipo: 'acondicionador',
    icono: '🪵',
    descripcion: 'Mejora la capacidad de intercambio catiónico (CIC) y quelatación natural de micronutrientes.'
  }
];

/**
 * Escala las dosis de una fórmula según la capacidad real del tanque en litros (base 1000 L)
 * @param {Object} formula - Objeto de fórmula con salesBase1000L
 * @param {number} volumenLitros - Capacidad del tanque del productor (ej: 500, 1000, 2000)
 * @returns {Array} Líneas de productos con dosis y unidades reescaladas
 */
export function escalarFormulaPorVolumen(formula, volumenLitros = 1000) {
  if (!formula || !formula.salesBase1000L) return [];
  const v = Math.max(1, Number(volumenLitros) || 1000);
  const factor = v / 1000.0;

  return formula.salesBase1000L.map(sal => {
    const dosisBase = Number(sal.dosis1000L) || 0;
    const dosisEscalada = dosisBase * factor;

    // Si la dosis escalada es >= 1000 g, se puede expresar en kg o mantener en g con etiqueta clara
    const enKg = dosisEscalada >= 1000;
    const valorFormateado = enKg
      ? (dosisEscalada / 1000.0).toFixed(2).replace(/\.00$/, '')
      : (Math.round(dosisEscalada * 10) / 10).toString();
    const unidad = enKg ? `kg / tanque ${v} L` : `g / tanque ${v} L`;

    return {
      producto: sal.producto,
      dosis: valorFormateado,
      unidad,
      aporte: sal.aporte || '',
      esManual: false,
      tipo: sal.tipo || 'sal_fertilizante'
    };
  });
}

/**
 * Escala una lista genérica de productos por el ratio nuevoVolumen / volumenAnterior
 */
export function reescalarLineasPorVolumen(lineas = [], volumenAnterior = 1000, nuevoVolumen = 1000) {
  const vAnt = Math.max(1, Number(volumenAnterior) || 1000);
  const vNue = Math.max(1, Number(nuevoVolumen) || 1000);
  if (vAnt === vNue) return lineas;
  const factor = vNue / vAnt;

  return lineas.map(linea => {
    const dosisNum = parseFloat(String(linea.dosis).replace(',', '.'));
    if (isNaN(dosisNum) || dosisNum <= 0) return linea;

    const nuevaDosisNum = dosisNum * factor;
    const unidadLimpia = (linea.unidad || '').replace(/tanque\s*\d+\s*L/i, `tanque ${vNue} L`).replace(/\d+\s*L/i, `${vNue} L`);

    let valorFormateado;
    if (nuevaDosisNum >= 100) {
      valorFormateado = (Math.round(nuevaDosisNum * 10) / 10).toString();
    } else {
      valorFormateado = (Math.round(nuevaDosisNum * 100) / 100).toString();
    }

    return {
      ...linea,
      dosis: valorFormateado,
      unidad: unidadLimpia || `g / tanque ${vNue} L`
    };
  });
}
