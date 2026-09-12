/**
 * Servicio de Asistente Virtual Agronómico con Google Gemini API
 * Contextualizado para el Ing. Agr. Ricardo Manuel Barquero Chacón (Colegiado Ord. 5896).
 * Compatible con nuevas claves de autenticación de Google AI Studio (prefijo AQ.Ab...) y estándar (AIzaSy...)
 * Modelos soportados en cascada: gemini-2.0-flash, gemini-2.0-flash-lite, gemini-1.5-flash.
 * "LA ÚLTIMA DECISIÓN LA TOMA EL INGENIERO AGRÓNOMO"
 */

import { storageService } from './storageService';

// Modelos ordenados por prioridad (incorporando soporte oficial para claves AQ.Ab y modelos 3.8 / 3.6 flash)
const MODELOS_DISPONIBLES = [
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.0-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

/**
 * Esperar milisegundos para retroceso exponencial en caso de 429 / 503
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function llamarApiGeminiConCascada({ key, requestBody, modeloPreferido }) {
  let ultimoError = null;
  const keyLimpia = (key || '').trim();

  // Priorizar el modelo configurado por el usuario o sugerido por la clave AQ.Ab
  const modeloConfigurado = modeloPreferido || geminiService.getModel();
  const listaModelos = [
    modeloConfigurado,
    ...MODELOS_DISPONIBLES.filter(m => m !== modeloConfigurado)
  ];

  for (let i = 0; i < listaModelos.length; i++) {
    const modelo = listaModelos[i];
    if (!modelo) continue;

    // Estrategias de autenticación para soportar tanto claves estándar (AIzaSy) como las nuevas (AQ.Ab...)
    const variantesAuth = [
      // 1. Estándar v1beta con query param y header x-goog-api-key
      {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${encodeURIComponent(keyLimpia)}`,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': keyLimpia
        }
      },
      // 2. Solo header x-goog-api-key sin ?key= en URL (recomendado para claves con formato AQ.Ab)
      {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': keyLimpia
        }
      },
      // 3. Autenticación tipo Bearer token
      {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keyLimpia}`
        }
      },
      // 4. Endpoint v1 oficial
      {
        url: `https://generativelanguage.googleapis.com/v1/models/${modelo}:generateContent?key=${encodeURIComponent(keyLimpia)}`,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': keyLimpia
        }
      }
    ];

    for (const ep of variantesAuth) {
      try {
        const response = await fetch(ep.url, {
          method: 'POST',
          headers: ep.headers,
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          const result = await response.json();
          const texto = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
          return {
            exito: true,
            texto,
            modeloUsado: modelo
          };
        }

        const errData = await response.json().catch(() => ({}));
        const msg = errData.error?.message || `HTTP ${response.status}`;
        ultimoError = msg;

        // Si es 404 (modelo no encontrado en esta API o versión), pasar al siguiente modelo
        if (response.status === 404 || msg.toLowerCase().includes('not found')) {
          break; // Pasar al siguiente modelo de la lista
        }

        // Si es 429/503 (servidor saturado), pausar y probar siguiente
        if (response.status === 429 || response.status === 503) {
          console.warn(`Modelo ${modelo} saturado (${response.status}), probando variante...`);
          await delay(800);
          continue;
        }

        // Si es 400 o 401 con error de auth en esta variante, probar la siguiente variante
        if (response.status === 400 || response.status === 401) {
          continue;
        }
      } catch (e) {
        ultimoError = e.message;
        await delay(400);
      }
    }
  }

  return {
    exito: false,
    error: ultimoError || 'No se pudo conectar con los servidores de Google Gemini.'
  };
}

export const geminiService = {
  getApiKey() {
    return localStorage.getItem('agroasesor_gemini_api_key') || '';
  },

  setApiKey(key) {
    const cleanKey = (key || '').trim();
    localStorage.setItem('agroasesor_gemini_api_key', cleanKey);
    // Si la clave empieza con AQ.Ab y no hay modelo específico, predeterminar a gemini-3.8-flash
    if (cleanKey.startsWith('AQ.') && !localStorage.getItem('agroasesor_gemini_model')) {
      this.setModel('gemini-3.8-flash');
    }
  },

  getModel() {
    const saved = localStorage.getItem('agroasesor_gemini_model');
    if (saved) return saved;
    const key = this.getApiKey();
    return (key && key.startsWith('AQ.')) ? 'gemini-3.8-flash' : 'gemini-3.8-flash';
  },

  setModel(model) {
    if (model) {
      localStorage.setItem('agroasesor_gemini_model', model.trim());
    }
  },

  getModelosDisponibles() {
    return MODELOS_DISPONIBLES;
  },

  removeApiKey() {
    localStorage.removeItem('agroasesor_gemini_api_key');
  },

  /**
   * Probar conectividad real con la clave API de Gemini
   */
  async probarConexion(claveAProbar, modeloPersonalizado) {
    const key = (claveAProbar || this.getApiKey() || '').trim();
    if (!key) {
      return { exito: false, error: 'Por favor ingrese una clave de API antes de probar.' };
    }

    const modeloTarget = modeloPersonalizado || this.getModel() || 'gemini-3.8-flash';

    const testBody = {
      contents: [{ parts: [{ text: 'Responde únicamente con la palabra "CONECTADO" si recibes este mensaje de prueba.' }] }]
    };

    const res = await llamarApiGeminiConCascada({ 
      key, 
      requestBody: testBody, 
      modeloPreferido: modeloTarget 
    });

    if (res.exito) {
      if (res.modeloUsado) {
        this.setModel(res.modeloUsado);
      }
      return {
        exito: true,
        mensaje: `¡Conexión exitosa con Google Gemini (${res.modeloUsado})! Clave ${key.startsWith('AQ.') ? 'nueva AQ.Ab (3.8 Flash)' : 'estándar'} verificada y activa.`,
        respuesta: res.texto.trim(),
        modelo: res.modeloUsado
      };
    } else {
      return {
        exito: false,
        error: `Fallo al validar clave con modelo ${modeloTarget}: ${res.error}. El sistema probará automáticamente la cascada de modelos en cada consulta.`
      };
    }
  },

  /**
   * Auto-investigar un insumo nuevo digitado por el agrónomo:
   * Determina tipo, grupo FRAC/IRAC y dosis recomendada por fabricante en Costa Rica
   */
  async investigarInsumo(nombreProducto) {
    if (!nombreProducto || !nombreProducto.trim()) return null;
    const nombreLimpio = nombreProducto.trim();

    // Heurística local agronómica inmediata (para respuesta instantánea u offline)
    const heuristica = this.obtenerHeuristicaInsumo(nombreLimpio);

    const apiKey = this.getApiKey();
    if (!apiKey || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      // Guardar con heurística offline
      storageService.registrarInsumoSiNoExiste({
        nombreComercial: nombreLimpio,
        categoria: heuristica.categoria,
        codigoFracIrac: heuristica.codigoFracIrac,
        dosis: heuristica.dosisEstandar,
        ingredienteActivo: heuristica.ingredienteActivo,
        esFertilizante: heuristica.esFertilizante
      });
      return { ...heuristica, origen: 'Heurística Agronómica Offline' };
    }

    // Consulta en vivo a Gemini para precisión oficial
    const prompt = `Actúa como base de datos fitosanitaria y agronómica de Costa Rica para el Ing. Ricardo Barquero. Identifica el insumo agrícola: "${nombreLimpio}". Responde únicamente con un objeto JSON con las propiedades: { "nombreComercial": "${nombreLimpio}", "categoria": "Fungicida" | "Insecticida" | "Acaricida" | "Foliar" | "Acondicionador" | "Coadyuvante" | "Fertilizante Soluble", "codigoFracIrac": "código FRAC o IRAC", "dosisEstandar": "dosis típica recomendada", "ingredienteActivo": "ingrediente activo", "blancoBiologico": "blanco o función", "esFertilizante": false }`;

    try {
      const requestBody = { contents: [{ parts: [{ text: prompt }] }] };
      const res = await llamarApiGeminiConCascada({ key: apiKey, requestBody });
      if (res.exito && res.texto) {
        const jsonMatch = res.texto.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          storageService.registrarInsumoSiNoExiste({
            nombreComercial: nombreLimpio,
            categoria: parsed.categoria || heuristica.categoria,
            codigoFracIrac: parsed.codigoFracIrac || heuristica.codigoFracIrac,
            dosis: parsed.dosisEstandar || heuristica.dosisEstandar,
            ingredienteActivo: parsed.ingredienteActivo || heuristica.ingredienteActivo,
            casaComercial: 'Investigado por IA',
            esFertilizante: parsed.esFertilizante || false
          });
          return { ...parsed, origen: `Investigado con Gemini (${res.modeloUsado})` };
        }
      }
    } catch (e) {
      console.warn('Error en auto-investigación con IA, usando heurística:', e);
    }

    storageService.registrarInsumoSiNoExiste({
      nombreComercial: nombreLimpio,
      categoria: heuristica.categoria,
      codigoFracIrac: heuristica.codigoFracIrac,
      dosis: heuristica.dosisEstandar,
      ingredienteActivo: heuristica.ingredienteActivo,
      esFertilizante: heuristica.esFertilizante
    });
    return { ...heuristica, origen: 'Heurística Agronómica' };
  },

  /**
   * Reglas heurísticas agronómicas costarricenses para clasificar productos instantáneamente
   */
  obtenerHeuristicaInsumo(nombre) {
    const n = nombre.toLowerCase();

    // Acondicionadores y Coadyuvantes
    if (n.includes('carrier') || n.includes('break') || n.includes('silwet') || n.includes('adherente') || n.includes('acid') || n.includes('surf')) {
      return {
        categoria: 'Acondicionador',
        codigoFracIrac: 'Coadyuvante',
        dosisEstandar: '100 - 150 cc / 200 L',
        ingredienteActivo: 'Regulador de pH / Tensioactivo organosiliconado',
        blancoBiologico: 'Regulación de caldo y penetración',
        esFertilizante: false
      };
    }

    // Nutrición foliar / Quelatos
    if (n.includes('metalosato') || n.includes('cosmoquel') || n.includes('foliar') || n.includes('boro') || n.includes('zinc') || n.includes('calcio') || n.includes('kelpak') || n.includes('stimplex') || n.includes('alga')) {
      return {
        categoria: 'Foliar',
        codigoFracIrac: 'Nutricional',
        dosisEstandar: '200 - 400 cc / 200 L',
        ingredienteActivo: 'Quelatos de aminoácidos / Bioestimulante',
        blancoBiologico: 'Nutrición celular y cuaje de fruto',
        esFertilizante: true
      };
    }

    // Fertilizantes solubles (Tanque A / Tanque B)
    if (n.includes('nitrato') || n.includes('calcinit') || n.includes('sulfato') || n.includes('fosfato') || n.includes('mkp') || n.includes('map') || n.includes('yaramila')) {
      return {
        categoria: 'Fertilizante Soluble',
        codigoFracIrac: 'Fertilizante',
        dosisEstandar: '10 - 25 kg / 1000 L',
        ingredienteActivo: 'Sales solubles de grado fertirriego',
        blancoBiologico: 'Nutrición radical / fertirriego',
        esFertilizante: true
      };
    }

    // Insecticidas y Acaricidas comunes en CR
    if (n.includes('abamect') || n.includes('vertimec') || n.includes('oberon') || n.includes('proclaim') || n.includes('danitol') || n.includes('envidor') || n.includes('spiro') || n.includes('acari') || n.includes('ciper') || n.includes('methomyl') || n.includes('lannate') || n.includes('confidor') || n.includes('imidacloprid')) {
      let irac = 'IRAC 6';
      if (n.includes('oberon') || n.includes('spiro')) irac = 'IRAC 23';
      if (n.includes('proclaim')) irac = 'IRAC 6';
      if (n.includes('danitol') || n.includes('ciper')) irac = 'IRAC 3A';
      if (n.includes('imidacloprid') || n.includes('confidor')) irac = 'IRAC 4A';

      return {
        categoria: n.includes('acari') || n.includes('vertimec') || n.includes('oberon') ? 'Acaricida' : 'Insecticida',
        codigoFracIrac: irac,
        dosisEstandar: '100 - 200 cc / 200 L',
        ingredienteActivo: 'Insecticida / Acaricida específico',
        blancoBiologico: 'Ácaros, trips o larvas masticadoras',
        esFertilizante: false
      };
    }

    // Fungicidas comunes en CR
    if (n.includes('switch') || n.includes('bellis') || n.includes('amistar') || n.includes('serenade') || n.includes('captan') || n.includes('mancozeb') || n.includes('nativo') || n.includes('score') || n.includes('mertect') || n.includes('curzate') || n.includes('strobina') || n.includes('conazol')) {
      let frac = 'FRAC 11';
      if (n.includes('conazol') || n.includes('score') || n.includes('nativo')) frac = 'FRAC 3';
      if (n.includes('switch')) frac = 'FRAC 9 + 12';
      if (n.includes('bellis')) frac = 'FRAC 7 + 11';
      if (n.includes('captan') || n.includes('mancozeb')) frac = 'FRAC M (Multi-sitio)';

      return {
        categoria: 'Fungicida',
        codigoFracIrac: frac,
        dosisEstandar: '150 - 250 g o cc / 200 L',
        ingredienteActivo: 'Fungicida curativo o preventivo',
        blancoBiologico: 'Botrytis, Oídio o Manchas foliares',
        esFertilizante: false
      };
    }

    // Genérico por defecto
    return {
      categoria: 'Fitosanitario',
      codigoFracIrac: 'Grupo Pendiente',
      dosisEstandar: '200 cc / 200 L',
      ingredienteActivo: 'Insumo agrícola comercial',
      blancoBiologico: 'Control fitosanitario / nutricional',
      esFertilizante: false
    };
  },

  /**
   * Consulta multimodal o de texto a la API de Gemini
   */
  async consultarAsistente({ modulo, contexto, imagenBase64 = null, promptUsuario = '' }) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        error: 'No se ha configurado la API Key de Gemini. Ingrésela en Ajustes para activar el asistente en tiempo real.',
        sugerencias: this.generarRespuestaOffline({ modulo, contexto, promptUsuario })
      };
    }

    const systemPrompt = `
Eres el Copiloto Agronómico de Inteligencia Artificial para el Ingeniero Agrónomo Ricardo Manuel Barquero Chacón (Colegiado Ord. 5896, Costa Rica).
El Ing. Barquero es un consultor de alto nivel especializado en fresa, flores de corte (crisantemo, clavel, rosa, gypsophila, gerbera), chile dulce, tomate, papa y hortalizas en Costa Rica.

REGLAS DE ORO OBLIGATORIAS:
1. "LA ÚLTIMA DECISIÓN LA TOMA EL INGENIERO AGRÓNOMO". Eres su apoyo técnico y auditor consultivo.
2. NO IMPONER NI ASUMIR APLICACIONES CALENDARIO: Puede que en una semana, según los hallazgos en campo y umbrales de daño económico, NO sea necesario aplicar plaguicida (fungicida o insecticida). La IA NUNCA debe forzar una aplicación semanal.
3. ROL DE LA IA EN FITOSANITARIOS: La IA interviene EXCLUSIVAMENTE para:
   a) Revisar y auditar técnicamente las recomendaciones propuestas por el agrónomo (rotación FRAC/IRAC, dosis, compatibilidad).
   b) O si el agrónomo solicita explícitamente que la IA elabore la Recomendación 1 (Mezcla Fungicida + Foliar) o la Recomendación 2 (Insecticida + Acaricida) de una semana determinada.
4. REGLA ESTRICTA DE SEGREGACIÓN DE MEZCLAS:
   - Las aplicaciones de FUNGICIDAS con FERTILIZANTES FOLIARES van juntos (metalosatos, elementos menores, bioestimulantes).
   - Las aplicaciones de INSECTICIDAS y ACARICIDAS van en aplicaciones SEPARADAS. NO se mezclan en el mismo caldo que los fungicidas/foliares.
5. FERTIRRIEGO Y NUTRICIÓN MULTIMODAL:
   El módulo de fertirriego maneja 6 modalidades técnicas:
   - Tanque directo
   - Mezclas con Venturi
   - Dosatron (Tanque A y Tanque B con inyección proporcional)
   - Inyección de fertirriego
   - Drench por estañón (200 L) o por planta
   - Fertilización granular al suelo
   En Dosatron, respetar estrictamente la incompatibilidad química: NUNCA mezclar Calcio concentrado con Sulfatos ni Fosfatos en el Tanque A (riesgo de precipitación de sulfato de calcio/yeso que tapa goteros).
6. INSUMOS Y DISTRIBUIDORAS DE COSTA RICA:
   Manejar productos y marcas registrados en Costa Rica (Syngenta, Disagro, Fertica, Casagri, Colono Agropecuario, Agrotico, El Surco, Cosmocel, Eurofertil, Bioeco, Tecnologías Agroambientales, etc.).
7. REDACCIÓN Y ESTILO:
   Respuesta ejecutiva, clara, estructurada con viñetas concisas y legible de inmediato en la pantalla de un teléfono móvil.
`;

    const contenidoPrompt = `
[MÓDULO DE TRABAJO: ${modulo.toUpperCase()}]
[CONTEXTO TÉCNICO DE LA VISITA]:
${JSON.stringify(contexto, null, 2)}

[SOLICITUD O PREGUNTA DEL ING. RICARDO BARQUERO]:
${promptUsuario || 'Revisar la información de este módulo, verificar compatibilidad agronómica, rotación anti-resistencia FRAC/IRAC o balance nutricional para Costa Rica.'}
`;

    const parts = [{ text: `${systemPrompt}\n\n${contenidoPrompt}` }];

    if (imagenBase64) {
      const cleanBase64 = imagenBase64.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64
        }
      });
    }

    const requestBody = { contents: [{ parts }] };

    const res = await llamarApiGeminiConCascada({ key: apiKey, requestBody });

    if (res.exito) {
      return {
        exito: true,
        texto: res.texto,
        origen: `Google Gemini (${res.modeloUsado}) [En vivo]`
      };
    } else {
      console.warn('Error al llamar a Gemini API:', res.error);
      return {
        error: `Error de conexión con Gemini: ${res.error}`,
        sugerencias: this.generarRespuestaOffline({ modulo, contexto, promptUsuario })
      };
    }
  },


  /**
   * Auditoría de recomendaciones de mezclas fitosanitarias contra hallazgos diagnosticados,
   * incompatibilidad física/química y rotación FRAC/IRAC.
   */
  async auditarRecomendacionesMezclas({ visita, aplicaciones = [], hallazgos = [], semana = 1 }) {
    // 1. Diagnóstico de hallazgos
    const problemasReportados = (hallazgos || []).map(h => ({
      titulo: h.titulo || '',
      categoria: h.categoria || '',
      severidad: h.severidad || 'Media',
      lote: h.loteNombre || 'General'
    }));

    const textoHallazgos = problemasReportados.map(p => `${p.titulo} (${p.categoria})`).join(', ');

    // 2. Insumos en la mezcla
    const todosInsumos = [];
    (aplicaciones || []).forEach(app => {
      (app.ordenMezcla || []).forEach(l => {
        if (l.producto) {
          todosInsumos.push({
            producto: l.producto,
            tipo: l.tipo,
            fracIrac: l.fracIrac,
            dosis: l.dosis,
            tipoMezcla: app.tipoMezcla,
            mezclaNombre: app.nombre
          });
        }
      });
    });

    const textoInsumos = todosInsumos.map(i => `${i.producto} [${i.tipo} ${i.fracIrac || ''}]`).join(', ');

    // 3. Reglas agronómicas locales de validación instantánea (Costa Rica)
    const alertas = [];
    const confirmaciones = [];

    // Chequeo de Botrytis
    const tieneBotrytis = textoHallazgos.toLowerCase().includes('botrytis') || textoHallazgos.toLowerCase().includes('moho gris');
    const cubreBotrytis = textoInsumos.toLowerCase().includes('switch') || textoInsumos.toLowerCase().includes('bellis') || textoInsumos.toLowerCase().includes('serenade') || textoInsumos.toLowerCase().includes('captan') || textoInsumos.toLowerCase().includes('botry') || textoInsumos.toLowerCase().includes('frac 9') || textoInsumos.toLowerCase().includes('frac 7');
    if (tieneBotrytis && !cubreBotrytis) {
      alertas.push('⚠️ Se diagnosticó Botrytis en campo pero NO se ha programado ningún botryticida específico (ej. Switch, Bellis, Serenade).');
    } else if (tieneBotrytis && cubreBotrytis) {
      confirmaciones.push('✅ Botrytis cinerea cubierta con producto botryticida específico en mezcla foliar.');
    }

    // Chequeo de Ácaros / Tetranychus
    const tieneAcaros = textoHallazgos.toLowerCase().includes('ácaro') || textoHallazgos.toLowerCase().includes('acaro') || textoHallazgos.toLowerCase().includes('arañita') || textoHallazgos.toLowerCase().includes('tetranychus');
    const cubreAcaros = textoInsumos.toLowerCase().includes('oberon') || textoInsumos.toLowerCase().includes('vertimec') || textoInsumos.toLowerCase().includes('abamect') || textoInsumos.toLowerCase().includes('danitol') || textoInsumos.toLowerCase().includes('envidor') || textoInsumos.toLowerCase().includes('acari') || textoInsumos.toLowerCase().includes('irac 23') || textoInsumos.toLowerCase().includes('irac 6');
    if (tieneAcaros && !cubreAcaros) {
      alertas.push('⚠️ Se diagnosticó afectación por Ácaros / Arañita Roja pero NO hay acaricida específico formulado en Mezcla 2.');
    } else if (tieneAcaros && cubreAcaros) {
      confirmaciones.push('✅ Población de ácaros cubierta con acaricida en aplicación separada.');
    }

    // Chequeo de Trips / Gusanos
    const tieneTrips = textoHallazgos.toLowerCase().includes('trips') || textoHallazgos.toLowerCase().includes('lepidóptero') || textoHallazgos.toLowerCase().includes('gusano') || textoHallazgos.toLowerCase().includes('spodoptera');
    const cubreTrips = textoInsumos.toLowerCase().includes('delegate') || textoInsumos.toLowerCase().includes('proclaim') || textoInsumos.toLowerCase().includes('lannate') || textoInsumos.toLowerCase().includes('vertimec') || textoInsumos.toLowerCase().includes('botanigard') || textoInsumos.toLowerCase().includes('irac 5') || textoInsumos.toLowerCase().includes('irac 6');
    if (tieneTrips && !cubreTrips) {
      alertas.push('⚠️ Se reportaron trips o larvas masticadoras pero no se evidencia insecticida específico en Mezcla 2.');
    }

    // Chequeo de Bacteriosis
    const tieneBacteria = textoHallazgos.toLowerCase().includes('bacteri') || textoHallazgos.toLowerCase().includes('xanthomonas') || textoHallazgos.toLowerCase().includes('erwinia') || textoHallazgos.toLowerCase().includes('ralstonia');
    const cubreBacteria = textoInsumos.toLowerCase().includes('kasumin') || textoInsumos.toLowerCase().includes('phyton') || textoInsumos.toLowerCase().includes('terramicina') || textoInsumos.toLowerCase().includes('cobre') || textoInsumos.toLowerCase().includes('agry-genta');
    if (tieneBacteria && !cubreBacteria) {
      alertas.push('⚠️ Se identificaron síntomas bacterianos en campo pero no se observa bactericida o cobre quelatado en el programa.');
    }

    // Chequeo de Compatibilidad y Segregación
    (aplicaciones || []).forEach(app => {
      const prods = (app.ordenMezcla || []).map(p => `${p.producto} ${p.tipo}`).join(' ').toLowerCase();
      if (app.tipoMezcla === 'fungicida_foliar' && (prods.includes('insecticida') || prods.includes('acaricida'))) {
        alertas.push(`⚠️ Segregación: La aplicación "${app.nombre}" combina fungicidas/foliares con insecticidas/acaricidas. Se recomienda aplicar insecticidas en pase separado.`);
      }
      if (prods.includes('cobre') && prods.includes('fosfito')) {
        alertas.push(`⚠️ Incompatibilidad: Riesgo de fitotoxicidad al mezclar sales de cobre con fosfitos o compuestos fuertemente ácidos.`);
      }
      if (prods.includes('azufre') && (prods.includes('aceite') || prods.includes('organosiliconado'))) {
        alertas.push(`⚠️ Incompatibilidad: Riesgo de quemazón foliar por mezclar azufre elemental con aceites o tensioactivos organosiliconados.`);
      }
    });

    const resultadoLocal = {
      aprobado: alertas.length === 0,
      alertas,
      confirmaciones,
      resumen: alertas.length === 0 
        ? 'Programa fitosanitario agronómicamente compatible, debidamente segregado y con cobertura adecuada de los hallazgos reportados.' 
        : `Se detectaron ${alertas.length} observaciones técnicas que requieren validación por el agrónomo.`,
      fechaAuditoria: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Si hay clave y conexión, enriquecer con Gemini
    const apiKey = this.getApiKey();
    if (!apiKey || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return { ...resultadoLocal, origen: 'Auditoría Heurística Agronómica (Offline)' };
    }

    try {
      const prompt = `Actúa como auditor fitosanitario senior en Costa Rica para el Ing. Ricardo Barquero.
Audita esta mezcla y recomendaciones de la Semana ${semana}:
Hallazgos diagnosticados: ${textoHallazgos || 'Monitoreo preventivo general'}
Aplicaciones programadas: ${JSON.stringify(aplicaciones)}
Verifica:
1. Cobertura de hallazgos (¿Falta algún producto para controlar lo diagnosticado?)
2. Incompatibilidad fisicoquímica o riesgo de fitotoxicidad en el caldo.
3. Rotación FRAC/IRAC anti-resistencia.
Responde en viñetas concisas y profesionales.`;

      const requestBody = { contents: [{ parts: [{ text: prompt }] }] };
      const res = await llamarApiGeminiConCascada({ key: apiKey, requestBody });
      if (res.exito && res.texto) {
        return {
          ...resultadoLocal,
          comentarioIa: res.texto,
          origen: `Google Gemini (${res.modeloUsado}) [En vivo]`
        };
      }
    } catch (e) {
      console.warn('Fallo enriquecimiento con Gemini, retornando auditoría local:', e);
    }

    return { ...resultadoLocal, origen: 'Auditoría Agronómica Costa Rica' };
  },

  /**
   * Respuestas agronómicas inteligentes 100% offline cuando no hay internet en la finca
   */
  generarRespuestaOffline({ modulo, contexto, promptUsuario = '' }) {
    const cultivo = contexto.cultivoNombre || 'Cultivo';

    if (modulo === 'plaguicidas') {
      return `
🔍 **Auditoría Agronómica Offline (Ing. Barquero - Criterio Directo):**

• **Umbral de Intervención:** Si el monitoreo de campo no supera el umbral de daño económico, **no es necesario aplicar plaguicidas esta semana**. Se puede marcar la semana como "Sin aplicación sanitaria requerida".
• **Regla de Segregación de Mezclas:**
  - **Mezcla 1 (Fungicida + Nutrición Foliar):** Aplique fungicidas (ej: Bellis, Switch, Serenade) junto con Metalosato Calcio o elementos menores y regulador de pH (Carrier).
  - **Mezcla 2 (Insecticida + Acaricida):** Aplique en tanque separado (ej: Oberon para ácaros, Proclaim o Vertimec) con coadyuvante adherente. **No mezclar con la nutrición foliar de choque.**
• **Rotación FRAC/IRAC:** Verifique alternar grupos químicos entre semanas para evitar tolerancia o resistencia en poblaciones locales.
      `.trim();
    }

    if (modulo === 'fertirriego') {
      return `
💧 **Revisión de Fertirriego y Nutrición Offline:**

• **Modalidades Disponibles:**
  - **Dosatron (Tanque A y B):** Mantenga en Tanque A los Nitratos, Calcio (Calcinit) y Quelatos de Hierro. Mantenga en Tanque B Fosfatos (MKP), Sulfatos (Sulfato de Magnesio) y Ácido Fosfórico.
  - **Drench:** Para enraizamiento y sanidad radicular (Rootex + Kelpak + Trichoderma) aplicando 150-200 cc por planta al cuello.
  - **Fertilización Granular al Suelo:** Emplear fórmulas compuestas (10-30-10, 12-24-12, YaraMila Hidrocomplex o Blaukorn) según la etapa fenológica con humedad en el suelo.
• **Parámetros Objetivo:** Monitorear en gotero CE entre 1.4 - 1.8 mS/cm y pH entre 5.5 - 6.2 según el cultivo (${cultivo}).
      `.trim();
    }

    if (modulo === 'hallazgos') {
      return `
📸 **Guía Rápida de Hallazgos en ${cultivo}:**

• **Enfermedades Fúngicas:** Evaluar incidencia de Botrytis cinerea, Oídio (Podosphaera), Mancha foliar (Mycosphaerella) o Mildeo velloso según las horas de rocío y lluvia acumulada.
• **Insectos y Ácaros:** Revisar envés de hojas tiernas para detectar Arañita Roja (*Tetranychus urticae*), Trips (*Frankliniella*) o Mosca Blanca (*Bemisia tabaci*).
• **Marcado Fotográfico:** Utilice el lápiz amarillo/rojo para señalar la lesión específica antes de exportar el reporte editorial para el productor.
      `.trim();
    }

    return `
🌱 **Copiloto Agronómico Listo (Modo Campo Offline):**
Sistema adaptado a la práctica agronómica de Costa Rica. La última decisión técnica siempre corresponde a su criterio profesional como Ingeniero Agrónomo.
    `.trim();
  }
};
