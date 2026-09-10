/**
 * Servicio de Asistente Virtual Agronómico con Google Gemini API
 * Contextualizado para el Ing. Agr. Ricardo Barquero Chacón (Colegiado Ord. 5896).
 * "LA ÚLTIMA DECISIÓN LA TOMA EL INGENIERO AGRÓNOMO"
 */

export const geminiService = {
  // Clave guardada en localStorage
  getApiKey() {
    return localStorage.getItem('agroasesor_gemini_api_key') || '';
  },

  setApiKey(key) {
    localStorage.setItem('agroasesor_gemini_api_key', key.trim());
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
Eres el Copiloto Agronómico de Inteligencia Artificial para el Ingeniero Agrónomo Ricardo Barquero Chacón (Colegiado Ord. 5896, Costa Rica).
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
   El módulo de fertirriego no se limita a riego básico ni solo a tanques A/B. Se manejan 6 modalidades técnicas:
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

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }]
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || `Error HTTP ${response.status}`);
      }

      const result = await response.json();
      const texto = result.candidates?.[0]?.content?.parts?.[0]?.text || 'No se recibió respuesta del modelo.';

      return {
        exito: true,
        texto,
        origen: 'Google Gemini 1.5 Flash (En vivo)'
      };
    } catch (error) {
      console.warn('Error al llamar a Gemini API:', error);
      return {
        error: `Error de conexión con Gemini: ${error.message}`,
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
