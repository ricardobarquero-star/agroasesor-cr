/**
 * Servicio de Almacenamiento Local Offline-First y Respaldo
 * Gestiona Directorio de Clientes, Fincas, Lotes y Visitas Técnicas del Ing. Ricardo Barquero.
 */

const STORAGE_KEYS = {
  CLIENTES: 'agroasesor_clientes_db',
  VISITAS: 'agroasesor_visitas_db',
  VISITA_ACTUAL_ID: 'agroasesor_visita_activa_id'
};

// Clientes iniciales precargados representativos de las zonas productivas de Costa Rica
const CLIENTES_INICIALES = [
  {
    id: 'cli-001',
    nombre: 'Don Álvaro Montero Segura',
    telefono: '+506 8345-2198',
    email: 'alvaro.montero@agricola.cr',
    cedula: '1-0845-0321',
    ubicacion: 'Cascajal, Vázquez de Coronado, San José',
    fincas: [
      {
        id: 'finca-001',
        nombre: 'Finca Las Fresas de Coronado',
        ubicacion: 'Cascajal, Vázquez de Coronado, San José',
        gps: { lat: 10.0215, lon: -83.9482, altitud: 1680, precision: '4m' },
        lotes: [
          { id: 'lote-001', nombre: 'Lote 1 - Macrotúnel A', cultivoId: 'fresa', cultivoNombre: 'Fresa (Fragaria x ananassa)', variedad: 'Albion', area: '3,000 m2', sustrato: 'Suelo con camas plásticas' },
          { id: 'lote-002', nombre: 'Lote 2 - Macrotúnel B', cultivoId: 'fresa', cultivoNombre: 'Fresa (Fragaria x ananassa)', variedad: 'San Andreas', area: '4,500 m2', sustrato: 'Fibra de coco en mesas elevadas' }
        ]
      }
    ]
  },
  {
    id: 'cli-002',
    nombre: 'Florícola El Volcán (Doña Patricia Solís)',
    telefono: '+506 8712-4455',
    email: 'flores.elvolcan@gmail.com',
    cedula: '3-0102-0943',
    ubicacion: 'Llano Grande, Cartago',
    fincas: [
      {
        id: 'finca-002',
        nombre: 'Finca Las Flores de Llano Grande',
        ubicacion: 'Llano Grande, Cartago',
        gps: { lat: 9.9230, lon: -83.9050, altitud: 2270, precision: '3m' },
        lotes: [
          { id: 'lote-101', nombre: 'Invernadero 1 (Crisantemos)', cultivoId: 'crisantemo', cultivoNombre: 'Crisantemo de corte', variedad: 'Spider', area: '2,500 m2', sustrato: 'Suelo volcánico andisol' },
          { id: 'lote-102', nombre: 'Invernadero 2 (Claveles)', cultivoId: 'clavel', cultivoNombre: 'Clavel (Dianthus caryophyllus)', variedad: 'Standard', area: '2,000 m2', sustrato: 'Cascarilla de arroz + suelo' }
        ]
      }
    ]
  },
  {
    id: 'cli-003',
    nombre: 'Agrícola Poás S.A. (Don Carlos Calderón)',
    telefono: '+506 8831-9022',
    email: 'carlos.calderon@agropoas.cr',
    cedula: '2-0341-0872',
    ubicacion: 'San Pedro de Poás, Alajuela',
    fincas: [
      {
        id: 'finca-003',
        nombre: 'Finca La Cima de Poás',
        ubicacion: 'Poás, Alajuela',
        gps: { lat: 10.1200, lon: -84.2400, altitud: 1600, precision: '5m' },
        lotes: [
          { id: 'lote-201', nombre: 'Bloque A - Chile Dulce', cultivoId: 'chile_dulce', cultivoNombre: 'Chile Dulce (Pimiento)', variedad: 'Nathalie', area: '5,000 m2', sustrato: 'Campo abierto con acolchado' },
          { id: 'lote-202', nombre: 'Bloque B - Tomate Indeterminado', cultivoId: 'tomate', cultivoNombre: 'Tomate de mesa', variedad: 'Tropic', area: '6,000 m2', sustrato: 'Invernadero multitúnel' }
        ]
      }
    ]
  }
];

// Visita inicial de demostración
const VISITA_DEMO = {
  id: 'visita-demo-001',
  fecha: new Date().toISOString().split('T')[0],
  hora: '09:30 AM',
  clienteId: 'cli-001',
  productor: {
    nombre: 'Don Álvaro Montero Segura',
    telefono: '+506 8345-2198',
    email: 'alvaro.montero@agricola.cr',
    cedula: '1-0845-0321'
  },
  finca: {
    id: 'finca-001',
    nombre: 'Finca Las Fresas de Coronado',
    ubicacion: 'Cascajal, Vázquez de Coronado, San José',
    gps: { lat: 10.0215, lon: -83.9482, altitud: 1680, precision: '4m' }
  },
  lote: {
    id: 'lote-002',
    nombre: 'Lote 2 - Macrotúnel B',
    area: '4,500 m2',
    cultivoId: 'fresa',
    cultivoNombre: 'Fresa (Fragaria x ananassa)',
    variedad: 'San Andreas',
    edadSemanas: '14 semanas (Plena producción)',
    sustrato: 'Fibra de coco en mesas elevadas'
  },
  clima: {
    temperaturaActual: 18,
    humedadActual: 88,
    vientoKmH: 12,
    lluviaAcumulada7Dias: 64.5,
    horasAltaHumedad: 52,
    tempMax7Dias: 21,
    tempMin7Dias: 12,
    riesgoEnfermedades: 'Crítico / Muy Alto',
    razonRiesgo: '64.5 mm de lluvia y 52h de humedad >85% en Coronado. Máximo riesgo de Botrytis cinerea y Colletotrichum.'
  },
  hallazgos: [
    {
      id: 'h-01',
      categoria: 'Enfermedades Fitosanitarias',
      titulo: 'Foco inicial de Moho Gris (Botrytis cinerea) en cáliz floral',
      descripcion: 'Se observa esporulación grisácea incipiente en cálices y pedúnculos florales con fruta verde en desarrollo. Favorecido por condensación nocturna bajo el plástico.',
      severidad: 'Alta',
      fotoAnotada: null,
      fecha: new Date().toLocaleDateString('es-CR')
    },
    {
      id: 'h-02',
      categoria: 'Problemas Fisiológicos / Nutricionales',
      titulo: 'Ligera necrosis en margen de hoja nueva (Deficiencia de Calcio / Tip-burn)',
      descripcion: 'Brote tierno con borde quemado. Alta transpiración matutina y baja presión radicular. Se requiere aporte foliar urgente con Metalosato de Calcio.',
      severidad: 'Media',
      fotoAnotada: null,
      fecha: new Date().toLocaleDateString('es-CR')
    }
  ],
  recomendacionesFertirriego: [
    {
      semana: 1,
      titulo: 'Semana 1 - Nutrición Balanceada Fresa en Pico de Cosecha',
      alcance: 'Toda la Finca',
      eventos: [
        {
          id: 'ev-fert-1',
          tipo: 'Fertirriego Tanque A y B (Inyección Dosatron 1:100)',
          nombreEvento: 'Fertirriego 1: Llenado de Fruta y Calcio Estructural',
          sistema: 'Dosatron Tanques Concentrados (1000 L c/u)',
          conductividadObjetivo: '1.5 mS/cm',
          phObjetivo: '5.8',
          lineasTanqueA: [
            { producto: 'YaraTera Calcinit (Nitrato de Calcio)', dosis: '60 kg / tanque 1000 L', unidad: 'kg/tanque' },
            { producto: 'Haifa Multi-K 13-0-46', dosis: '35 kg / tanque 1000 L', unidad: 'kg/tanque' },
            { producto: 'Librel Fe-DP (Hierro Quelatado DTPA)', dosis: '2.5 kg / tanque 1000 L', unidad: 'kg/tanque' }
          ],
          lineasTanqueB: [
            { producto: 'Haifa MKP 0-52-34', dosis: '30 kg / tanque 1000 L', unidad: 'kg/tanque' },
            { producto: 'Sulfato de Magnesio Soluble', dosis: '25 kg / tanque 1000 L', unidad: 'kg/tanque' },
            { producto: 'Ácido Fosfórico 85%', dosis: '8 L / tanque 1000 L (según pH)', unidad: 'L/tanque' }
          ],
          observacionesPie: 'Inyectar al 1% con el Dosatron. Mantener pulsos de riego cortos (4 minutos, 6 veces al día) para no saturar la fibra de coco.'
        },
        {
          id: 'ev-drench-1',
          tipo: 'Drench por Estañón (200 L)',
          nombreEvento: 'Drench 1: Sanidad Radicular y Promotor de Pelos Absorbentes',
          sistema: 'Estañón de 200 L con bomba de espalda / lanza',
          volumenPlanta: '50 cc por planta al cuello',
          productos: [
            { producto: 'Rootex WP (Cosmocel)', dosis: '350 g / estañón (200 L)', unidad: 'g/estañón' },
            { producto: 'Kelpak Alga Marina', dosis: '400 cc / estañón (200 L)', unidad: 'cc/estañón' },
            { producto: 'TrikoEco (Trichoderma asperellum)', dosis: '250 g / estañón (200 L)', unidad: 'g/estañón' }
          ],
          observacionesPie: 'Aplicar directamente en el cuello de la planta con el sustrato previamente húmedo para garantizar colonización micorrícica.'
        }
      ]
    }
  ],
  recomendacionesPlaguicidas: [
    {
      semana: 1,
      titulo: 'Semana 1 - Control Fitosanitario Antirresistencia FRAC / IRAC',
      alcance: 'Lote 2 - Macrotúnel B (Foco identificado)',
      aplicaciones: [
        {
          id: 'ap-foliar-1',
          nombre: 'Aplicación Foliar 1 (Choque contra Botrytis y Prevención de Ácaro)',
          volumenTanque: 'Estañón de 200 L',
          ordenMezcla: [
            { orden: 1, tipo: 'Acondicionador Agua', producto: 'Carrier / Acid-Fix', dosis: '60 cc / estañón', funcion: 'Bajar pH a 5.8 y secuestrar dureza' },
            { orden: 2, tipo: 'Fungicida FRAC 7 + 11', producto: 'Bellis 38 WG', dosis: '140 g / estañón (200 L)', funcion: 'Control curativo de Botrytis (Boscalid + Piraclostrobina)' },
            { orden: 3, tipo: 'Acaricida IRAC 23', producto: 'Oberon 240 SC', dosis: '100 cc / estañón (200 L)', funcion: 'Ovicida y ninficida de arañita roja' },
            { orden: 4, tipo: 'Foliar Nutricional', producto: 'Metalosato Calcio (Cosmocel)', dosis: '400 cc / estañón (200 L)', funcion: 'Firmeza de epidermis del fruto' },
            { orden: 5, tipo: 'Coadyuvante', producto: 'Break-Thru S-240', dosis: '35 cc / estañón (200 L)', funcion: 'Super-humectación y penetración' }
          ],
          observacionesPie: 'Calibrar boquillas cono hueco a 45 PSI. Aplicar temprano (6:30 AM a 8:30 AM) o después de las 4:00 PM con follaje seco.'
        },
        {
          id: 'ap-foliar-2',
          nombre: 'Aplicación Foliar 2 (Rotación Biológica Cero Días a Cosecha)',
          volumenTanque: 'Estañón de 200 L',
          ordenMezcla: [
            { orden: 1, tipo: 'Biológico FRAC BM02', producto: 'Serenade ASO (Bacillus subtilis)', dosis: '500 cc / estañón (200 L)', funcion: 'Barrera antagónica contra Botrytis y bacterias' },
            { orden: 2, tipo: 'Foliar Nutricional', producto: 'Metalosato Zinc', dosis: '250 cc / estañón (200 L)', funcion: 'Estimulación de brotes nuevos' }
          ],
          observacionesPie: 'Aplicar 4 días después de la primera aplicación. Cero días de carencia; se puede cosechar el mismo día.'
        }
      ]
    }
  ]
};

export const storageService = {
  // ==========================================
  // CLIENTES Y FINCAS
  // ==========================================
  getClientes() {
    const raw = localStorage.getItem(STORAGE_KEYS.CLIENTES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(CLIENTES_INICIALES));
      return CLIENTES_INICIALES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return CLIENTES_INICIALES;
    }
  },

  guardarCliente(cliente) {
    const clientes = this.getClientes();
    const index = clientes.findIndex(c => c.id === cliente.id);
    if (index >= 0) {
      clientes[index] = cliente;
    } else {
      clientes.unshift(cliente);
    }
    localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientes));
    return cliente;
  },

  eliminarCliente(clienteId) {
    const clientes = this.getClientes().filter(c => c.id !== clienteId);
    localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientes));
  },

  // ==========================================
  // VISITAS TÉCNICAS
  // ==========================================
  getHistorialVisitas() {
    const raw = localStorage.getItem(STORAGE_KEYS.VISITAS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.VISITAS, JSON.stringify([VISITA_DEMO]));
      return [VISITA_DEMO];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [VISITA_DEMO];
    }
  },

  getVisitaActiva() {
    const historial = this.getHistorialVisitas();
    const activaId = localStorage.getItem(STORAGE_KEYS.VISITA_ACTUAL_ID);
    if (activaId) {
      const encontrada = historial.find(v => v.id === activaId);
      if (encontrada) return encontrada;
    }
    if (historial.length > 0) return historial[0];
    return VISITA_DEMO;
  },

  guardarVisitaActiva(visita) {
    const historial = this.getHistorialVisitas();
    const index = historial.findIndex(v => v.id === visita.id);
    if (index >= 0) {
      historial[index] = visita;
    } else {
      historial.unshift(visita);
    }
    localStorage.setItem(STORAGE_KEYS.VISITAS, JSON.stringify(historial));
    localStorage.setItem(STORAGE_KEYS.VISITA_ACTUAL_ID, visita.id);
  },

  setVisitaActivaId(visitaId) {
    localStorage.setItem(STORAGE_KEYS.VISITA_ACTUAL_ID, visitaId);
  },

  crearNuevaVisita({ cliente, finca, lote, cultivo, clima, gps }) {
    const nueva = {
      id: 'visita-' + Date.now(),
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }),
      clienteId: cliente.id,
      productor: {
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        email: cliente.email,
        cedula: cliente.cedula
      },
      finca: {
        id: finca.id,
        nombre: finca.nombre,
        ubicacion: finca.ubicacion,
        gps: gps || finca.gps || { lat: 9.9760, lon: -83.9920, altitud: 1414 }
      },
      lote: {
        id: lote.id,
        nombre: lote.nombre,
        area: lote.area || '1 Ha',
        cultivoId: cultivo.id,
        cultivoNombre: cultivo.nombre,
        variedad: lote.variedad || (cultivo.variedades ? cultivo.variedades[0] : ''),
        sustrato: lote.sustrato || 'Suelo'
      },
      clima: clima || {
        temperaturaActual: 19,
        humedadActual: 82,
        vientoKmH: 12,
        lluviaAcumulada7Dias: 45.0,
        horasAltaHumedad: 38,
        riesgoEnfermedades: 'Moderado',
        razonRiesgo: 'Condiciones típicas de la zona.'
      },
      hallazgos: [],
      recomendacionesFertirriego: [
        {
          semana: 1,
          titulo: 'Semana 1 - Fertirriego',
          alcance: 'Toda la Finca',
          eventos: []
        }
      ],
      recomendacionesPlaguicidas: [
        {
          semana: 1,
          titulo: 'Semana 1 - Manejo Fitosanitario',
          alcance: 'Toda la Finca',
          aplicaciones: []
        }
      ]
    };

    this.guardarVisitaActiva(nueva);
    return nueva;
  },

  eliminarVisita(visitaId) {
    const historial = this.getHistorialVisitas().filter(v => v.id !== visitaId);
    localStorage.setItem(STORAGE_KEYS.VISITAS, JSON.stringify(historial));
  },

  // ==========================================
  // RESPALDO Y RESTAURACIÓN
  // ==========================================
  exportarRespaldoJSON() {
    const data = {
      fechaExportacion: new Date().toISOString(),
      asesor: {
        nombre: 'Ing. Agr. Ricardo Barquero Chacón',
        colegiado: 'Ord. 5896',
        telefono: '+506 8894-5662',
        email: 'h7coordinador@gmail.com',
        ubicacion: 'Vázquez de Coronado, San José, Costa Rica'
      },
      clientes: this.getClientes(),
      historialVisitas: this.getHistorialVisitas(),
      visitaActivaId: localStorage.getItem(STORAGE_KEYS.VISITA_ACTUAL_ID)
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AgroAsesor_Respaldo_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importarRespaldoJSON(contenidoJson) {
    try {
      const data = JSON.parse(contenidoJson);
      if (data.clientes && Array.isArray(data.clientes)) {
        localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(data.clientes));
      }
      if (data.historialVisitas && Array.isArray(data.historialVisitas)) {
        localStorage.setItem(STORAGE_KEYS.VISITAS, JSON.stringify(data.historialVisitas));
      }
      if (data.visitaActivaId) {
        localStorage.setItem(STORAGE_KEYS.VISITA_ACTUAL_ID, data.visitaActivaId);
      }
      return { exito: true };
    } catch (e) {
      return { exito: false, error: e.message };
    }
  }
};
