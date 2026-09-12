import { crAgroDatabase } from '../data/crAgroDatabase';

const STORAGE_KEYS = {
  CLIENTES: 'agroasesor_clientes_db_v2',
  VISITAS: 'agroasesor_visitas_db_v2',
  VISITA_ACTUAL_ID: 'agroasesor_visita_activa_id_v2',
  CATALOGO_PERSONALIZADO: 'agroasesor_custom_catalog_v2',
  PERFIL_INGENIERO: 'agroasesor_perfil_ingeniero_v2',
  REPORTES_EXPEDIENTE: 'agroasesor_reportes_expediente_v2'
};

const PERFIL_INGENIERO_DEFECTO = {
  nombre: 'Ing. Agr. Ricardo Manuel Barquero Chacón',
  titulo: 'Ingeniero Agrónomo',
  colegiado: 'Colegiado Ord. 5896',
  colegio: 'Colegio de Ingenieros Agrónomos de Costa Rica',
  telefono: '+506 8894-5662',
  email: 'h7coordinador@gmail.com',
  ubicacion: 'Vázquez de Coronado, San José, Costa Rica',
  especialidad: 'Especialista en Fresa, Flores de Corte, Solanáceas y Hortalizas',
  firmaDigital: null
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

  editarCliente(clienteId, datosActualizados) {
    const clientes = this.getClientes();
    const index = clientes.findIndex(c => c.id === clienteId);
    if (index >= 0) {
      clientes[index] = { ...clientes[index], ...datosActualizados };
      localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientes));
      return clientes[index];
    }
    return null;
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

    try {
      localStorage.setItem(STORAGE_KEYS.VISITAS, JSON.stringify(historial));
      localStorage.setItem(STORAGE_KEYS.VISITA_ACTUAL_ID, visita.id);
    } catch (err) {
      console.warn('QuotaExceeded al guardar historial en localStorage, protegiendo visita activa:', err);
      // Aliviar cuota de 5MB en Safari: remover fotos en base64 de visitas históricas anteriores
      const historialAligerado = historial.map(v => {
        if (v.id === visita.id) return v;
        return {
          ...v,
          hallazgos: (v.hallazgos || []).map(h => ({
            ...h,
            fotoAnotada: h.fotoAnotada ? 'cached_in_indexeddb' : null
          }))
        };
      });

      try {
        localStorage.setItem(STORAGE_KEYS.VISITAS, JSON.stringify(historialAligerado));
        localStorage.setItem(STORAGE_KEYS.VISITA_ACTUAL_ID, visita.id);
      } catch (err2) {
        console.error('Almacenamiento crítico, persistiendo visita activa prioritaria:', err2);
        try {
          localStorage.setItem(STORAGE_KEYS.VISITAS, JSON.stringify([visita]));
          localStorage.setItem(STORAGE_KEYS.VISITA_ACTUAL_ID, visita.id);
        } catch (err3) {
          console.error('Fallo final de cuota localStorage:', err3);
        }
      }
    }

    // Asegurar persistencia de fotos en IndexedDB
    if (typeof window !== 'undefined' && visita.hallazgos && visita.hallazgos.length > 0) {
      photoStorageService.sincronizarFotosVisita(visita).catch(() => {});
    }
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
      recomendacionesPlaguicidas: [],
      // Mediciones de Suelo en Campo (pH, CE, Temperatura, Humedad)
      medicionesSuelo: [
        {
          id: 'suelo-' + Date.now(),
          loteId: lote.id || 'todos',
          loteNombre: lote.nombre || 'Lote Principal',
          phSuelo: '5.8',
          ceSuelo: '1.4',
          tempSuelo: '19.0',
          humedadSuelo: '70%',
          metodo: 'Sonda directa en rizósfera (15 cm)',
          analisisIa: 'Valores en rango adecuado para ' + (cultivo.nombre || 'el cultivo') + '. Fósforo y cationes con buena disponibilidad.',
          ajusteRecomendado: 'Mantener conductividad eléctrica en 1.3 - 1.5 mS/cm. Sin necesidad de correctores de acidez en este ciclo.',
          estadoAprobacion: 'aprobado' // 'aprobado', 'editado', 'omitido'
        }
      ],
      // Análisis Epidemiológico Clima + Plagas/Hongos (Fenómeno de El Niño)
      analisisEpidemiologico: {
        estadoAprobacion: 'aprobado', // 'aprobado', 'editado', 'omitido'
        fenomenoElNino: true,
        analisisTexto: 'Bajo la influencia del Fenómeno de El Niño en Costa Rica, las alternancias entre días calurosos secos y lluvias vespertinas intensas generan condiciones predisponentes críticas. Durante los períodos secos se aceleran los ciclos biológicos de ácaros (Tetranychus urticae) y trips (Frankliniella occidentalis), mientras que las lluvias prolongadas saturan el suelo y condensan la película de agua foliar, propiciando ataques de Botrytis cinerea y hongos radiculares (Pythium / Phytophthora).',
        medidasCulturales: 'Manejo riguroso de ventilación en macrotúneles e invernaderos (apertura temprana de cortinas para secado de rocío). Eliminación estricta de órganos senescentes o infectados.',
        medidasNutricionales: 'Aplicación de Silicio asimilable (Sili-K / Silitek) para inducir engrosamiento de cutícula epidérmica como barrera física. Mantener relaciones balanceadas de Calcio/Boro y Fosfito de Potasio para activar fitoalexinas.',
        medidasAmbiente: 'Inoculación de la rizósfera con Trichoderma harzianum (Tusal) y aspersiones al follaje con Bacillus subtilis (Serenade) para establecer competencia biológica por nichos.'
      }
    };

    this.guardarVisitaActiva(nueva);
    return nueva;
  },

  eliminarVisita(visitaId) {
    const historial = this.getHistorialVisitas().filter(v => v.id !== visitaId);
    try {
      localStorage.setItem(STORAGE_KEYS.VISITAS, JSON.stringify(historial));
    } catch (e) {
      console.warn('Error guardando visitas tras eliminar:', e);
    }
    const activaId = localStorage.getItem(STORAGE_KEYS.VISITA_ACTUAL_ID);
    if (activaId === visitaId) {
      const siguienteId = historial.length > 0 ? historial[0].id : '';
      localStorage.setItem(STORAGE_KEYS.VISITA_ACTUAL_ID, siguienteId);
    }
  },

  // ==========================================
  // EXPEDIENTE DE REPORTES E INFORMES POR CLIENTE
  // ==========================================
  getTodosLosReportesGuardados() {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTES_EXPEDIENTE);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  getReportesDeCliente(clienteId) {
    if (!clienteId) return [];
    const reportes = this.getTodosLosReportesGuardados();
    return reportes.filter(r => r.clienteId === clienteId);
  },

  guardarReporteEnExpediente(clienteId, reporte) {
    if (!clienteId || !reporte) return null;
    const reportes = this.getTodosLosReportesGuardados();
    const index = reportes.findIndex(r => r.id === reporte.id);
    const nuevoReporte = {
      ...reporte,
      id: reporte.id || 'rep-' + Date.now(),
      clienteId,
      fechaGuardado: new Date().toISOString().split('T')[0],
      horaGuardado: new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })
    };

    if (index >= 0) {
      reportes[index] = nuevoReporte;
    } else {
      reportes.unshift(nuevoReporte);
    }

    try {
      localStorage.setItem(STORAGE_KEYS.REPORTES_EXPEDIENTE, JSON.stringify(reportes));
    } catch (e) {
      console.warn('Quota warning guardando reporte en expediente:', e);
    }
    return nuevoReporte;
  },

  eliminarReporteDeCliente(clienteId, reporteId) {
    const reportes = this.getTodosLosReportesGuardados().filter(r => r.id !== reporteId);
    try {
      localStorage.setItem(STORAGE_KEYS.REPORTES_EXPEDIENTE, JSON.stringify(reportes));
    } catch (e) {
      console.warn('Error eliminando reporte:', e);
    }
  },

  // ==========================================
  // ESTADÍSTICA CLIMÁTICA ACUMULADA POR FINCA / CLIENTE
  // ==========================================
  getEstadisticasClimaClienteFinca(clienteId, fincaId = null) {
    const visitas = this.getHistorialVisitas().filter(v => {
      if (v.clienteId !== clienteId) return false;
      if (fincaId && v.finca?.id !== fincaId) return false;
      return true;
    });

    if (visitas.length === 0) {
      return {
        totalVisitas: 0,
        lluviaTotalAcumulada: 0,
        humedadPromedio: 85,
        temperaturaPromedio: 18,
        horasAltaHumedadTotal: 0,
        riesgoPredominante: 'Moderado',
        fenomenoElNino: true
      };
    }

    let sumaLluvia = 0;
    let sumaHumedad = 0;
    let sumaTemp = 0;
    let sumaHorasHumedad = 0;

    visitas.forEach(v => {
      sumaLluvia += Number(v.clima?.lluviaAcumulada7Dias) || 0;
      sumaHumedad += Number(v.clima?.humedadActual) || 82;
      sumaTemp += Number(v.clima?.temperaturaActual) || 18;
      sumaHorasHumedad += Number(v.clima?.horasAltaHumedad) || 35;
    });

    const total = visitas.length;
    return {
      totalVisitas: total,
      lluviaTotalAcumulada: Math.round(sumaLluvia * 10) / 10,
      humedadPromedio: Math.round(sumaHumedad / total),
      temperaturaPromedio: Math.round((sumaTemp / total) * 10) / 10,
      horasAltaHumedadTotal: Math.round(sumaHorasHumedad),
      riesgoPredominante: sumaLluvia > 100 ? 'Crítico / Fúngico' : (sumaLluvia > 50 ? 'Alto' : 'Moderado'),
      fenomenoElNino: true,
      ultimasVisitas: visitas.slice(0, 5).map(v => ({ fecha: v.fecha, lluvia: v.clima?.lluviaAcumulada7Dias || 0, temp: v.clima?.temperaturaActual || 18 }))
    };
  },

  // ==========================================
  // PERFIL DEL INGENIERO AGRÓNOMO Y DERECHOS
  // ==========================================
  getPerfilIngeniero() {
    const raw = localStorage.getItem(STORAGE_KEYS.PERFIL_INGENIERO);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PERFIL_INGENIERO, JSON.stringify(PERFIL_INGENIERO_DEFECTO));
      return PERFIL_INGENIERO_DEFECTO;
    }
    try {
      return { ...PERFIL_INGENIERO_DEFECTO, ...JSON.parse(raw) };
    } catch {
      return PERFIL_INGENIERO_DEFECTO;
    }
  },

  guardarPerfilIngeniero(perfil) {
    localStorage.setItem(STORAGE_KEYS.PERFIL_INGENIERO, JSON.stringify(perfil));
    return perfil;
  },

  // ==========================================
  // EXPORTACIÓN E IMPORTACIÓN DE RESPALDOS JSON
  // ==========================================
  exportarRespaldoJSON() {
    const data = {
      version: '2.3',
      fechaExportacion: new Date().toISOString(),
      autor: 'Ricardo Manuel Barquero Chacón',
      perfil: this.getPerfilIngeniero(),
      clientes: this.getClientes(),
      visitas: this.getHistorialVisitas(),
      catalogoPersonalizado: this.getCatalogoPersonalizado()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AgroAsesor_Respaldo_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  },

  importarRespaldoJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.clientes || !data.visitas) {
        return { exito: false, error: 'Formato de respaldo no válido.' };
      }
      if (data.perfil) localStorage.setItem(STORAGE_KEYS.PERFIL_INGENIERO, JSON.stringify(data.perfil));
      if (data.clientes) localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(data.clientes));
      if (data.visitas) localStorage.setItem(STORAGE_KEYS.VISITAS, JSON.stringify(data.visitas));
      if (data.catalogoPersonalizado) localStorage.setItem(STORAGE_KEYS.CATALOGO_PERSONALIZADO, JSON.stringify(data.catalogoPersonalizado));
      return { exito: true };
    } catch (e) {
      return { exito: false, error: e.message };
    }
  },
};
