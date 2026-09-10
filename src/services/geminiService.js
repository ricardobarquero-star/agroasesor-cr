/**
 * Servicio de Asistente Virtual Agronómico con Google Gemini API
 * Contextualizado para el Ing. Agr. Ricardo Manuel Barquero Chacón (Colegiado Ord. 5896).
 * Compatible con nuevas claves de autenticación de Google AI Studio (prefijo AQ.Ab...) y estándar (AIzaSy...)
 * Modelos soportados: gemini-3.6-flash, gemini-3.6, gemini-2.0-flash, gemini-1.5-flash.
 * "LA ÚLTIMA DECISIÓN LA TOMA EL INGENIERO AGRÓNOMO"
 */

// Modelos ordenados por prioridad de nueva generación
const MODELOS_DISPONIBLES = [
  'gemini-3.6-flash',
  'gemini-3.6',
  'gemini-2.0-flash',
  'gemini-1.5-flash'
];

async function llamarApiGeminiConCascada({ key, requestBody }) {
  let ultimoError = null;

  for (const modelo of MODELOS_DISPONIBLES) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${encodeURIComponent(key)}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key // Obligatorio para las nuevas claves que inician con AQ.
        },
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

      // Si el modelo específico no está disponible en este tier o clave, probar siguiente modelo
      if (response.status === 404 || msg.toLowerCase().includes('not found')) {
        console.warn(`Modelo ${modelo} no encontrado para esta clave, intentando siguiente...`);
        continue;
      } else {
        // Error de credenciales u otro problema
        return { exito: false, error: msg, modeloUsado: modelo };
      }
    } catch (e) {
      ultimoError = e.message;
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
    localStorage.setItem('agroasesor_gemini_api_key', key.trim());
  },

  removeApiKey() {
    localStorage.removeItem('agroasesor_gemini_api_key');
  },

  /**
   * Probar conectividad real con la clave API de Gemini (acepta claves AQ.Ab... y AIzaSy...)
   */
  async probarConexion(claveAProbar) {
    const key = (claveAProbar || this.getApiKey() || '').trim();
    if (!key) {
      return { exito: false, error: 'Por favor ingrese una clave de API antes de probar.' };
    }

    const testBody = {
      contents: [{ parts: [{ text: 'Responde únicamente con la palabra "CONECTADO" si recibes este mensaje de prueba.' }] }]
    };

    const res = await llamarApiGeminiConCascada({ key, requestBody: testBody });
    if (res.exito) {
      return {
        exito: true,
        mensaje: `¡Conexión exitosa con Google Gemini (${res.modeloUsado})! Clave nueva ${key.startsWith('AQ.') ? 'AQ' : 'estándar'} verificada y activa en el teléfono.`,
        respuesta: res.texto.trim(),
        modelo: res.modeloUsado
      };
    } else {
      return {
        exito: false,
        error: `Fallo al validar clave: ${res.error}`
      };
    }
  },

  /**
   * Consulta multimodal o de texto a la API de Gemini
   */
  async consultarAsistente({ modulo, contexto, imagenBase64 = null, promptUsuario = '' }) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        error: 'No se ha configurado la API Key de Gemini. Ingrésela en Ajustes ⚙️ para activar el asistente en tiempo real.',
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
   Respuesta ejecutiva, clara, estructurada con viñetas concisas y legible de inmediato en la pantalla de un iPhone 17.
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
   * Respuestas agronómicas inteligentes 100% offline cuando no hay internet en la finca
   */
  generarRespuestaOffline({ modulo, contexto, promptUsuario = '' }) {
    const cultivo = contexto.cultivoNombre || 'Cultivo';

    if (modulo === 'plaguicidas') {
      return `
🔍 **Auditoría Agronómica Offline (Ing. Barquero - Criterio Directo):**

• **Umbral de Intervención:** Recuerde que si el monitoreo de campo no supera el umbral de daño económico, **no es necesario aplicar plaguicidas esta semana**. Se puede marcar la semana como "Sin aplicación sanitaria requerida".
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
