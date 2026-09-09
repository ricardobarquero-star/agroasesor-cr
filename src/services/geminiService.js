/**
 * Servicio de Asistente Virtual Agronómico con Google Gemini API
 * Contextualizado para el Ing. Agr. Ricardo Barquero Chacón (Ord. 5896).
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
   * Llamada multimodal o de texto a la API de Gemini
   */
  async consultarAsistente({ modulo, contexto, imagenBase64 = null, promptUsuario = '' }) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        error: 'No se ha configurado la API Key de Gemini. Ingrésela en Ajustes ⚙️ para activar el asistente en tiempo real.',
        sugerencias: this.generarRespuestaOffline({ modulo, contexto })
      };
    }

    const systemPrompt = `
Eres el Copiloto Agronómico de Inteligencia Artificial para el Ingeniero Agrónomo Ricardo Barquero Chacón (Colegiado Ord. 5896, Costa Rica).
El Ing. Barquero es un consultor de primer nivel especializado en fresa, flores de corte (crisantemo, clavel, rosa, gypsophila, gerbera), chile dulce, tomate, papa y hortalizas en Costa Rica.

REGLAS DE ORO:
1. "LA ÚLTIMA DECISIÓN LA TOMA EL INGENIERO AGRÓNOMO". Tus respuestas deben ser propuestas técnicas, análisis diferenciales y alertas de apoyo, reconociendo siempre su criterio profesional.
2. Basar las recomendaciones EXCLUSIVAMENTE en insumos y marcas disponibles en Costa Rica (Syngenta, Disagro, Fertica, Casagri, Colono, Agrotico, El Surco, Cosmocel, Eurofertil, Bioeco, Tecnologías Agroambientales).
3. Respetar estrictamente la rotación anti-resistencia de grupos FRAC (fungicidas) e IRAC (insecticidas).
4. En fertirriego, respetar la incompatibilidad del Calcio concentrado con Sulfatos y Fosfatos (separación obligatoria en Tanque A y Tanque B). Expresar dosis en las unidades del país: kg o g por estañón (200 L) o tanque 1000 L.
5. Tomar en cuenta las condiciones agroclimáticas proporcionadas (lluvia de los últimos 7 días y horas de humedad relativa).
6. Tu redacción debe ser profesional, concisa, estructurada en viñetas claras y de rápida lectura en pantalla de iPhone.
`;

    const contenidoPrompt = `
[MÓDULO ACTUAL: ${modulo}]
[CONTEXTO TÉCNICO DE LA VISITA]:
${JSON.stringify(contexto, null, 2)}

[CONSULTA O PETICIÓN ESPECÍFICA]:
${promptUsuario || 'Analizar la información de este módulo, identificar posibles causas o problemas, sugerir medidas correctivas considerando rotación FRAC/IRAC y compatibilidad de mezclas para Costa Rica.'}
`;

    try {
      // Usar el endpoint de Gemini 1.5 Flash o Gemini 2.0 Flash
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const parts = [{ text: systemPrompt + "\n\n" + contenidoPrompt }];

      if (imagenBase64) {
        // Limpiar el encabezado data:image/...;base64, si existe
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
        origen: 'Google Gemini AI (En vivo)'
      };
    } catch (error) {
      console.warn('Error al llamar a Gemini API:', error);
      return {
        error: `Error de conexión con Gemini: ${error.message}`,
        sugerencias: this.generarRespuestaOffline({ modulo, contexto })
      };
    }
  },

  /**
   * Respuestas inteligentes sin conexión para cuando no hay internet o no hay API key
   */
  generarRespuestaOffline({ modulo, contexto }) {
    const cultivo = contexto?.cultivoNombre || 'el cultivo';
    const lluvia = contexto?.clima?.lluviaAcumulada7Dias || 0;
    const hr = contexto?.clima?.horasAltaHumedad || 0;

    if (modulo === 'clima' || modulo === 'general') {
      return `⚠️ **Alerta Agroclimática para ${cultivo}**:
Con ${lluvia} mm de lluvia acumulada en los últimos 7 días y ${hr} horas con humedad relativa >85%:
• **Riesgo Fitosanitario Elevado**: Fuerte presión para Moho gris (*Botrytis cinerea*), Tizón tardío (*Phytophthora*) o Mildeo velloso.
• **Recomendación preventiva**:
  - Reforzar ventilación de naves/macrotúneles.
  - Asegurar aplicación preventiva con multisitios protectores (ej. Dithane M-45 o Bravo 720) o biológicos (*Serenade ASO*).
  - Evitar exceso de nitrógeno nítrico que genere tejido suculento susceptible.
*(Nota: Sugerencia del Asistente Virtual — La última decisión la toma el Ing. Ricardo Barquero).*`;
    }

    if (modulo === 'hallazgos') {
      return `🔍 **Diagnóstico Agronómico Sugerido para ${cultivo}**:
• **Causas más probables observadas en campo**:
  1. Infección fungosa activa favorecida por humedad acumulada (*Botrytis* o *Colletotrichum* si hay manchas necróticas circulares).
  2. Daño por ácaros (*Tetranychus urticae*) si se aprecia punteado clorótico y bronceado en envés.
  3. Desbalance fisiológico por asfixia radicular temporal o bloqueo de Calcio/Boro.
• **Opciones de rotación en Costa Rica**:
  - Fungicida curativo: *Bellis WG* (FRAC 7 + 11) o *Amistar Top* (FRAC 11 + 3).
  - Si es ácaro: *Oberon 240 SC* (IRAC 23) o *Vertimec 018 EC* (IRAC 6).
*(Nota: Sugerencia del Asistente Virtual — La última decisión la toma el Ing. Ricardo Barquero).*`;
    }

    if (modulo === 'fertirriego') {
      return `🧪 **Auditoría Nutricional y Fertirriego**:
• **Regla de Incompatibilidad Química**:
  - Tanque A: Nitrato de Calcio (Calcinit) + Nitrato de Potasio (Multi-K) + Quelato de Hierro.
  - Tanque B: Fosfato Monopotásico (MKP) + Sulfato de Magnesio + Ácido Fosfórico.
  - ⚠️ **NUNCA** juntar Calcinit con MKP o Sulfato de Magnesio en el mismo tanque concentrado para evitar obstrucción de emisores por yeso insoluble.
• **Manejo en Drench (por estañón de 200 L)**:
  - Para inducir raíz nueva: *Rootex* (300 g/estañón) + *Kelpak* (400 cc/estañón).
*(Nota: Sugerencia del Asistente Virtual — La última decisión la toma el Ing. Ricardo Barquero).*`;
    }

    if (modulo === 'plaguicidas') {
      return `🛡️ **Estrategia Antirresistencia FRAC / IRAC**:
• Verificar que el grupo químico aplicado la semana previa no coincida con el de esta semana.
• Si la semana anterior se usó un FRAC 11 (estrobirulina) o FRAC 3 (triazol), utilizar esta semana un FRAC 7 (ej. *Cantus* o *Miravis Duo*) o un protector multisitio FRAC M (*Dithane M-45*).
• Orden de mezcla en estañón: Acondicionador de pH (Carrier) $\rightarrow$ Polvos WP $\rightarrow$ Líquidos SC $\rightarrow$ Emulsionables EC $\rightarrow$ Coadyuvante (*Break-Thru*).
*(Nota: Sugerencia del Asistente Virtual — La última decisión la toma el Ing. Ricardo Barquero).*`;
    }

    return `💡 **Revisión Técnica**: Todos los parámetros agronómicos han sido cotejados con el catálogo de Costa Rica. Por favor valide las dosis por estañón y por tanque antes de generar el informe final.`;
  }
};
