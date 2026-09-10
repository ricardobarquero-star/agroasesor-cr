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
          distribuidores: insumo.casaComercial || 'Insumo Local',
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
  // CLIENTES, FINCAS Y LOTES (MULTI-TIER)
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

  agregarFincaACliente(clienteId, nuevaFinca) {
    const clientes = this.getClientes();
    const cli = clientes.find(c => c.id === clienteId);
    if (!cli) return null;
    cli.fincas = cli.fincas || [];
    cli.fincas.push(nuevaFinca);
    this.guardarCliente(cli);
    return cli;
  },

  agregarLoteAFinca(clienteId, fincaId, nuevoLote) {
    const clientes = this.getClientes();
    const cli = clientes.find(c => c.id === clienteId);
    if (!cli) return null;
    const finca = (cli.fincas || []).find(f => f.id === fincaId);
    if (!finca) return null;
    finca.lotes = finca.lotes || [];
    finca.lotes.push(nuevoLote);
    this.guardarCliente(cli);
    return cli;
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
    // Si la variedad es nueva, guardarla en el catálogo auto-aprendiz
    if (cultivo && lote?.variedad) {
      this.registrarVariedadSiNoExiste(cultivo.id, lote.variedad);
    }

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
          titulo: 'Semana 1 - Fertirriego y Nutrición',
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
      catalogoPersonalizado: this.getCatalogoPersonalizado(),
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
      if (data.catalogoPersonalizado) {
        localStorage.setItem(STORAGE_KEYS.CATALOGO_PERSONALIZADO, JSON.stringify(data.catalogoPersonalizado));
      }
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
