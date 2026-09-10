import { crAgroDatabase } from '../data/crAgroDatabase';

const STORAGE_KEYS = {
  CLIENTES: 'agroasesor_clientes_db_v2',
  VISITAS: 'agroasesor_visitas_db_v2',
  VISITA_ACTUAL_ID: 'agroasesor_visita_activa_id_v2',
  CATALOGO_PERSONALIZADO: 'agroasesor_custom_catalog_v2'
};

// Catálogo personalizado inicial (se va nutriendo automáticamente)
const CATALOGO_PERSONALIZADO_INICIAL = {
  cultivos: [],
  variedades: {}, // { 'fresa': ['NuevaVariedad1', ...], ... }
  fertilizantes: [],
  plaguicidas: []
};

// Clientes iniciales con soporte Multi-Finca y Multi-Lote
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
        ubicacion: 'Cascajal, Vázquez de Coronado',
        gps: { lat: 10.0215, lon: -83.9482, altitud: 1680 },
        lotes: [
          { 
            id: 'lote-001', 
            nombre: 'Lote 1 - Macrotúnel A', 
            cultivoId: 'fresa', 
            cultivoNombre: 'Fresa (Fragaria x ananassa)', 
            variedad: 'Albion', 
            area: '3,000 m2', 
            sustrato: 'Suelo con camas plásticas' 
          },
          { 
            id: 'lote-002', 
            nombre: 'Lote 2 - Macrotúnel B', 
            cultivoId: 'fresa', 
            cultivoNombre: 'Fresa (Fragaria x ananassa)', 
            variedad: 'San Andreas', 
            area: '4,500 m2', 
            sustrato: 'Fibra de coco en mesas elevadas' 
          },
          { 
            id: 'lote-003', 
            nombre: 'Lote 3 - Monterrey Nuevo', 
            cultivoId: 'fresa', 
            cultivoNombre: 'Fresa (Fragaria x ananassa)', 
            variedad: 'Monterrey', 
            area: '2,000 m2', 
            sustrato: 'Suelo con fertirriego por goteo' 
          }
        ]
      },
      {
        id: 'finca-001-b',
        nombre: 'Finca Alto Las Nubes',
        ubicacion: 'San Jerónimo de Moravia',
        gps: { lat: 10.0410, lon: -83.9850, altitud: 1850 },
        lotes: [
          {
            id: 'lote-004',
            nombre: 'Invernadero 1 (Fresa Cabrillo)',
            cultivoId: 'fresa',
            cultivoNombre: 'Fresa (Fragaria x ananassa)',
            variedad: 'Cabrillo',
            area: '2,500 m2',
            sustrato: 'Macetas con turba'
          }
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
        gps: { lat: 9.9230, lon: -83.9050, altitud: 2270 },
        lotes: [
          { 
            id: 'lote-101', 
            nombre: 'Invernadero 1 (Crisantemos)', 
            cultivoId: 'crisantemo', 
            cultivoNombre: 'Crisantemo de corte', 
            variedad: 'Spider', 
            area: '2,500 m2', 
            sustrato: 'Suelo volcánico andisol' 
          },
          { 
            id: 'lote-102', 
            nombre: 'Invernadero 2 (Claveles)', 
            cultivoId: 'clavel', 
            cultivoNombre: 'Clavel (Dianthus caryophyllus)', 
            variedad: 'Standard', 
            area: '2,000 m2', 
            sustrato: 'Cascarilla de arroz + suelo' 
          },
          { 
            id: 'lote-103', 
            nombre: 'Invernadero 3 (Rosas de Exportación)', 
            cultivoId: 'rosa', 
            cultivoNombre: 'Rosa de corte', 
            variedad: 'Freedom', 
            area: '3,000 m2', 
            sustrato: 'Bancos elevados con sustrato' 
          }
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
        gps: { lat: 10.1200, lon: -84.2400, altitud: 1600 },
        lotes: [
          { 
            id: 'lote-201', 
            nombre: 'Bloque A - Chile Dulce', 
            cultivoId: 'chile_dulce', 
            cultivoNombre: 'Chile Dulce (Pimiento)', 
            variedad: 'Nathalie', 
            area: '5,000 m2', 
            sustrato: 'Campo abierto con acolchado' 
          },
          { 
            id: 'lote-202', 
            nombre: 'Bloque B - Tomate Indeterminado', 
            cultivoId: 'tomate', 
            cultivoNombre: 'Tomate de mesa', 
            variedad: 'Tropic', 
            area: '6,000 m2', 
            sustrato: 'Invernadero multitúnel' 
          },
          { 
            id: 'lote-203', 
            nombre: 'Bloque C - Papa', 
            cultivoId: 'papa', 
            cultivoNombre: 'Papa (Solanum tuberosum)', 
            variedad: 'Floresta', 
            area: '8,000 m2', 
            sustrato: 'Suelo aporcado tradicional' 
          }
        ]
      }
    ]
  }
];

export const storageService = {
  // ==========================================
  // MOTOR DE AUTO-APRENDIZAJE DE LA BASE DE DATOS
  // ==========================================
  getCatalogoPersonalizado() {
    const raw = localStorage.getItem(STORAGE_KEYS.CATALOGO_PERSONALIZADO);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CATALOGO_PERSONALIZADO, JSON.stringify(CATALOGO_PERSONALIZADO_INICIAL));
      return CATALOGO_PERSONALIZADO_INICIAL;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return CATALOGO_PERSONALIZADO_INICIAL;
    }
  },

  guardarCatalogoPersonalizado(cat) {
    localStorage.setItem(STORAGE_KEYS.CATALOGO_PERSONALIZADO, JSON.stringify(cat));
  },

  // Registrar automáticamente un producto nuevo (plaguicida o fertilizante)
  registrarInsumoSiNoExiste(insumo) {
    if (!insumo || !insumo.nombreComercial) return;
    const cat = this.getCatalogoPersonalizado();
    const nombreNormalizado = insumo.nombreComercial.trim().toLowerCase();

    if (insumo.esFertilizante) {
      const existeBase = crAgroDatabase.fertilizantesFertirriego.some(f => f.nombreComercial.toLowerCase() === nombreNormalizado) ||
                         crAgroDatabase.formulasGranuladasSuelo.some(f => f.nombreComercial.toLowerCase() === nombreNormalizado);
      const existeCustom = (cat.fertilizantes || []).some(f => f.nombreComercial.toLowerCase() === nombreNormalizado);

      if (!existeBase && !existeCustom) {
        cat.fertilizantes = cat.fertilizantes || [];
        cat.fertilizantes.push({
          id: 'custom_fert_' + Date.now(),
          nombreComercial: insumo.nombreComercial.trim(),
          categoria: insumo.categoria || 'Fertilizante Personalizado',
          composicion: insumo.composicion || '',
          dosisTipica: insumo.dosis || '',
          distribuidores: insumo.casaComercial || 'Insumo Local CR',
          esPersonalizado: true
        });
        this.guardarCatalogoPersonalizado(cat);
      }
    } else {
      // Plaguicida
      const existeBase = crAgroDatabase.productosFitosanitarios.some(p => p.nombreComercial.toLowerCase() === nombreNormalizado);
      const existeCustom = (cat.plaguicidas || []).some(p => p.nombreComercial.toLowerCase() === nombreNormalizado);

      if (!existeBase && !existeCustom) {
        cat.plaguicidas = cat.plaguicidas || [];
        cat.plaguicidas.push({
          id: 'custom_plag_' + Date.now(),
          nombreComercial: insumo.nombreComercial.trim(),
          categoria: insumo.categoria || 'Fitosanitario',
          ingredienteActivo: insumo.ingredienteActivo || '',
          codigoFracIrac: insumo.codigoFracIrac || '',
          dosisEstandar: insumo.dosis || '',
          casaComercial: insumo.casaComercial || 'Insumo Local CR',
          esPersonalizado: true
        });
        this.guardarCatalogoPersonalizado(cat);
      }
    }
  },

  // Registrar automáticamente nueva variedad para un cultivo
  registrarVariedadSiNoExiste(cultivoId, nuevaVariedad) {
    if (!cultivoId || !nuevaVariedad || !nuevaVariedad.trim()) return;
    const variedadLimpia = nuevaVariedad.trim();
    const cat = this.getCatalogoPersonalizado();
    cat.variedades = cat.variedades || {};
    cat.variedades[cultivoId] = cat.variedades[cultivoId] || [];

    const cultivoBase = crAgroDatabase.cultivos.find(c => c.id === cultivoId);
    const existeEnBase = cultivoBase && cultivoBase.variedades.some(v => v.toLowerCase() === variedadLimpia.toLowerCase());
    const existeEnCustom = cat.variedades[cultivoId].some(v => v.toLowerCase() === variedadLimpia.toLowerCase());

    if (!existeEnBase && !existeEnCustom) {
      cat.variedades[cultivoId].push(variedadLimpia);
      this.guardarCatalogoPersonalizado(cat);
    }
  },

  // Obtener lista completa de variedades combinadas (Base + Auto-aprendidas)
  getVariedadesPorCultivo(cultivoId) {
    const cultivoBase = crAgroDatabase.cultivos.find(c => c.id === cultivoId);
    const base = cultivoBase ? [...cultivoBase.variedades] : [];
    const cat = this.getCatalogoPersonalizado();
    const custom = (cat.variedades && cat.variedades[cultivoId]) ? cat.variedades[cultivoId] : [];
    return Array.from(new Set([...base, ...custom]));
  },

  // Obtener lista completa de plaguicidas combinados (Excel + Auto-aprendidos)
  getTodosLosPlaguicidas() {
    const cat = this.getCatalogoPersonalizado();
    const base = crAgroDatabase.productosFitosanitarios || [];
    const custom = cat.plaguicidas || [];
    return [...custom, ...base];
  },

  // Obtener lista completa de fertilizantes combinados
  getTodosLosFertilizantes(filtroModalidad = '') {
    const cat = this.getCatalogoPersonalizado();
    const custom = cat.fertilizantes || [];

    if (filtroModalidad === 'granular') {
      return [...custom, ...crAgroDatabase.formulasGranuladasSuelo];
    }
    // Fertirriego o Drench
    return [...custom, ...crAgroDatabase.fertilizantesFertirriego, ...crAgroDatabase.formulasGranuladasSuelo];
  },

  // ==========================================
  // CLIENTES, FINCAS Y LOTES (MULTI-TIER EXPEDIENTE)
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

  // Gestión de Fincas
  agregarFincaACliente(clienteId, nuevaFinca) {
    const clientes = this.getClientes();
    const cli = clientes.find(c => c.id === clienteId);
    if (!cli) return null;
    cli.fincas = cli.fincas || [];
    const fincaConId = {
      id: nuevaFinca.id || 'finca-' + Date.now(),
      nombre: nuevaFinca.nombre || 'Nueva Finca',
      ubicacion: nuevaFinca.ubicacion || cli.ubicacion,
      gps: nuevaFinca.gps || { lat: 9.9760, lon: -83.9920, altitud: 1400 },
      lotes: nuevaFinca.lotes || []
    };
    cli.fincas.push(fincaConId);
    this.guardarCliente(cli);
    return cli;
  },

  editarFinca(clienteId, fincaId, datosFinca) {
    const clientes = this.getClientes();
    const cli = clientes.find(c => c.id === clienteId);
    if (!cli) return null;
    const fIndex = (cli.fincas || []).findIndex(f => f.id === fincaId);
    if (fIndex >= 0) {
      cli.fincas[fIndex] = { ...cli.fincas[fIndex], ...datosFinca };
      this.guardarCliente(cli);
    }
    return cli;
  },

  eliminarFinca(clienteId, fincaId) {
    const clientes = this.getClientes();
    const cli = clientes.find(c => c.id === clienteId);
    if (!cli) return null;
    cli.fincas = (cli.fincas || []).filter(f => f.id !== fincaId);
    this.guardarCliente(cli);
    return cli;
  },

  // Gestión de Lotes
  agregarLoteAFinca(clienteId, fincaId, nuevoLote) {
    const clientes = this.getClientes();
    const cli = clientes.find(c => c.id === clienteId);
    if (!cli) return null;
    const finca = (cli.fincas || []).find(f => f.id === fincaId);
    if (!finca) return null;
    finca.lotes = finca.lotes || [];
    const loteConId = {
      id: nuevoLote.id || 'lote-' + Date.now(),
      nombre: nuevoLote.nombre || `Lote ${finca.lotes.length + 1}`,
      cultivoId: nuevoLote.cultivoId || 'fresa',
      cultivoNombre: nuevoLote.cultivoNombre || 'Fresa',
      variedad: nuevoLote.variedad || 'Estándar',
      area: nuevoLote.area || '1,000 m2',
      sustrato: nuevoLote.sustrato || 'Suelo'
    };
    finca.lotes.push(loteConId);
    this.guardarCliente(cli);

    // Auto-aprender variedad si aplica
    if (loteConId.cultivoId && loteConId.variedad) {
      this.registrarVariedadSiNoExiste(loteConId.cultivoId, loteConId.variedad);
    }
    return cli;
  },

  editarLote(clienteId, fincaId, loteId, datosLote) {
    const clientes = this.getClientes();
    const cli = clientes.find(c => c.id === clienteId);
    if (!cli) return null;
    const finca = (cli.fincas || []).find(f => f.id === fincaId);
    if (!finca) return null;
    const lIndex = (finca.lotes || []).findIndex(l => l.id === loteId);
    if (lIndex >= 0) {
      finca.lotes[lIndex] = { ...finca.lotes[lIndex], ...datosLote };
      this.guardarCliente(cli);
    }
    return cli;
  },

  eliminarLote(clienteId, fincaId, loteId) {
    const clientes = this.getClientes();
    const cli = clientes.find(c => c.id === clienteId);
    if (!cli) return null;
    const finca = (cli.fincas || []).find(f => f.id === fincaId);
    if (!finca) return null;
    finca.lotes = (finca.lotes || []).filter(l => l.id !== loteId);
    this.guardarCliente(cli);
    return cli;
  },

  // ==========================================
  // VISITAS TÉCNICAS (SIN RECOMENDACIONES PRE-LLENADAS)
  // ==========================================
  getHistorialVisitas() {
    const raw = localStorage.getItem(STORAGE_KEYS.VISITAS);
    if (!raw) {
      const inicial = [
        {
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
            ubicacion: 'Cascajal, Vázquez de Coronado',
            gps: { lat: 10.0215, lon: -83.9482, altitud: 1680 }
          },
          lote: {
            id: 'lote-002',
            nombre: 'Lote 2 - Macrotúnel B',
            area: '4,500 m2',
            cultivoId: 'fresa',
            cultivoNombre: 'Fresa (Fragaria x ananassa)',
            variedad: 'San Andreas',
            sustrato: 'Fibra de coco en mesas elevadas'
          },
          clima: {
            temperaturaActual: 18,
            humedadActual: 88,
            vientoKmH: 12,
            lluviaAcumulada7Dias: 64.5,
            horasAltaHumedad: 52,
            riesgoEnfermedades: 'Crítico / Muy Alto',
            razonRiesgo: '64.5 mm de lluvia y 52h de humedad >85% en Coronado.'
          },
          hallazgos: [],
          // LIMPIO: Sin recomendaciones predeterminadas
          recomendacionesFertirriego: [],
          recomendacionesPlaguicidas: []
        }
      ];
      localStorage.setItem(STORAGE_KEYS.VISITAS, JSON.stringify(inicial));
      return inicial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
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
    return null;
  },

  guardarVisitaActiva(visita) {
    if (!visita) return;
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
    if (cultivo && lote?.variedad) {
      this.registrarVariedadSiNoExiste(cultivo.id, lote.variedad);
    }

    // Nueva visita creada completamente limpia sin recomendaciones automáticas
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
        razonRiesgo: 'Condiciones registradas de la zona.'
      },
      hallazgos: [],
      // Totalmente vacías: El agrónomo las genera y propone a su criterio profesional
      recomendacionesFertirriego: [],
      recomendacionesPlaguicidas: []
    };

    this.guardarVisitaActiva(nueva);
    return nueva;
  },

  eliminarVisita(visitaId) {
    const historial = this.getHistorialVisitas().filter(v => v.id !== visitaId);
    localStorage.setItem(STORAGE_KEYS.VISITAS, JSON.stringify(historial));
  }
};
