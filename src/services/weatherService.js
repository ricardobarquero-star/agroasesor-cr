/**
 * Servicio Agroclimático basado en Open-Meteo Agrometeorology API
 * Obtiene el clima actual, acumulado de 7 días y altitud automática (msnm) por coordenadas GPS o zona.
 */

export const weatherService = {
  // Zonas agronómicas de referencia en Costa Rica y sus altitudes típicas
  zonasPredeterminadas: {
    coronado: { nombre: 'Vázquez de Coronado, San José', lat: 9.9760, lon: -83.9920, elev: 1414 },
    cascajal: { nombre: 'Cascajal de Coronado, San José', lat: 10.0215, lon: -83.9482, elev: 1680 },
    las_nubes: { nombre: 'San Jerónimo / Las Nubes de Coronado', lat: 10.0410, lon: -83.9850, elev: 1850 },
    llano_grande: { nombre: 'Llano Grande, Cartago', lat: 9.9230, lon: -83.9050, elev: 2270 },
    tierra_blanca: { nombre: 'Tierra Blanca / Prusia, Cartago', lat: 9.9280, lon: -83.8760, elev: 2080 },
    potrero_cerrado: { nombre: 'Potrero Cerrado / Cot de Oreamuno', lat: 9.9140, lon: -83.8640, elev: 1950 },
    zarcero: { nombre: 'Zarcero, Alajuela', lat: 10.1800, lon: -84.4100, elev: 1736 },
    poas: { nombre: 'Poás / Fraijanes, Alajuela', lat: 10.1200, lon: -84.2400, elev: 1650 },
    vara_blanca: { nombre: 'Vara Blanca, Heredia', lat: 10.1700, lon: -84.1500, elev: 1900 },
    pacayas: { nombre: 'Pacayas / Alvarado, Cartago', lat: 9.9170, lon: -83.8050, elev: 1735 },
    frailes: { nombre: 'Frailes / San Cristóbal, Desamparados', lat: 9.7500, lon: -84.0500, elev: 1650 },
    dota: { nombre: 'Santa María de Dota / Los Santos', lat: 9.6500, lon: -83.9700, elev: 1550 }
  },

  /**
   * Obtiene la altitud automáticamente mediante API Open-Meteo Elevation
   * o por inferencia de la zona agronómica en Costa Rica.
   */
  async obtenerAltitudAutomatica(lat = null, lon = null, textoUbicacion = '') {
    // 1. Si hay coordenadas, consultar Open-Meteo Elevation API
    if (lat && lon && typeof lat === 'number' && typeof lon === 'number') {
      try {
        const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.elevation && data.elevation.length > 0 && typeof data.elevation[0] === 'number') {
            return Math.round(data.elevation[0]);
          }
        }
      } catch (err) {
        console.warn('No se pudo consultar API de elevación Open-Meteo:', err);
      }
    }

    // 2. Si no hay coordenadas o falló la red, inferir por el nombre de la zona en Costa Rica
    if (textoUbicacion && typeof textoUbicacion === 'string') {
      const u = textoUbicacion.toLowerCase().trim();
      if (u.includes('llano grande') || u.includes('prado')) return 2270;
      if (u.includes('tierra blanca') || u.includes('sanatorio') || u.includes('prusia')) return 2080;
      if (u.includes('potrero cerrado') || u.includes('cot')) return 1950;
      if (u.includes('vara blanca')) return 1900;
      if (u.includes('nubes') || u.includes('san jerónimo') || u.includes('san jeronimo')) return 1850;
      if (u.includes('zarcero') || u.includes('alfaro')) return 1736;
      if (u.includes('pacayas') || u.includes('cervantes')) return 1735;
      if (u.includes('cascajal')) return 1680;
      if (u.includes('frailes') || u.includes('san cristobal') || u.includes('san cristóbal')) return 1650;
      if (u.includes('poas') || u.includes('poás') || u.includes('fraijanes')) return 1650;
      if (u.includes('dota') || u.includes('santa maría') || u.includes('tarrazu') || u.includes('tarrazú')) return 1550;
      if (u.includes('san rafael de coronado')) return 1510;
      if (u.includes('oreamuno') || u.includes('taras') || u.includes('cartago')) return 1450;
      if (u.includes('coronado')) return 1420;
      if (u.includes('heredia') || u.includes('barva') || u.includes('san isidro')) return 1350;
      if (u.includes('alajuela')) return 950;
    }

    // 3. Fallback agronómico promedio de zona alta templada de Costa Rica
    return 1680;
  },

  /**
   * Obtiene la posición GPS actual del dispositivo con altitud automática
   */
  async obtenerPosicionGPS() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({
          lat: 9.9760,
          lon: -83.9920,
          altitud: 1414,
          precision: 'Simulada (Coronado)',
          zonaNombre: 'Vázquez de Coronado'
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(5));
          const lon = Number(pos.coords.longitude.toFixed(5));
          let alt = pos.coords.altitude ? Math.round(pos.coords.altitude) : null;
          
          if (!alt) {
            try {
              alt = await weatherService.obtenerAltitudAutomatica(lat, lon);
            } catch {
              alt = 1420;
            }
          }

          resolve({
            lat,
            lon,
            altitud: alt || 1420,
            precision: pos.coords.accuracy ? `${Math.round(pos.coords.accuracy)}m` : 'Alta'
          });
        },
        (err) => {
          console.warn('No se pudo obtener GPS nativo, usando ubicación por defecto:', err.message);
          resolve({
            lat: 9.9760,
            lon: -83.9920,
            altitud: 1414,
            precision: 'Estimada (Coronado, CR)',
            errorGps: err.message
          });
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    });
  },

  /**
   * Consulta el clima actual y el histórico acumulado de 7 días, incluyendo altitud oficial
   */
  async consultarClimaYAcumulado(lat = 9.9760, lon = -83.9920) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,precipitation&past_days=7&forecast_days=1&timezone=auto`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();

      const current = data.current || {};
      const hourly = data.hourly || {};
      const altitudDetectada = (data.elevation !== undefined && data.elevation !== null) ? Math.round(data.elevation) : 1420;

      // Calcular acumulados de los últimos 7 días
      let lluviaAcumulada7Dias = 0;
      let horasAltaHumedad = 0; // Horas con HR > 85% (factor crítico para hongos)
      let tempPromedio7Dias = 0;
      let tempMax7Dias = -999;
      let tempMin7Dias = 999;

      if (hourly.precipitation && hourly.precipitation.length > 0) {
        const horasPasadas = Math.min(hourly.precipitation.length, 168);
        let sumaTemp = 0;

        for (let i = 0; i < horasPasadas; i++) {
          const prec = hourly.precipitation[i] || 0;
          const hr = hourly.relative_humidity_2m ? hourly.relative_humidity_2m[i] : 0;
          const temp = hourly.temperature_2m ? hourly.temperature_2m[i] : 0;

          lluviaAcumulada7Dias += prec;
          if (hr >= 85) horasAltaHumedad++;

          sumaTemp += temp;
          if (temp > tempMax7Dias) tempMax7Dias = temp;
          if (temp < tempMin7Dias) tempMin7Dias = temp;
        }

        tempPromedio7Dias = Number((sumaTemp / horasPasadas).toFixed(1));
      }

      // Evaluar nivel de riesgo fitopatológico automático
      let riesgoEnfermedades = 'Bajo';
      let razonRiesgo = 'Condiciones meteorológicas estables.';

      if (lluviaAcumulada7Dias > 45 || horasAltaHumedad > 40) {
        riesgoEnfermedades = 'Crítico / Muy Alto';
        razonRiesgo = `Alta lluvia (${lluviaAcumulada7Dias.toFixed(1)} mm) y ${horasAltaHumedad}h con HR >85%. Alto riesgo de Botrytis, Phytophthora y Mildeo velloso.`;
      } else if (lluviaAcumulada7Dias > 20 || horasAltaHumedad > 20) {
        riesgoEnfermedades = 'Moderado / Alto';
        razonRiesgo = `Lluvia acumulada (${lluviaAcumulada7Dias.toFixed(1)} mm). Monitorear focos de hongos foliares y manchas bacterianas.`;
      }

      return {
        altitud: altitudDetectada,
        temperaturaActual: current.temperature_2m !== undefined ? Math.round(current.temperature_2m) : 19,
        sensacionTermica: current.apparent_temperature !== undefined ? Math.round(current.apparent_temperature) : 19,
        humedadActual: current.relative_humidity_2m || 82,
        vientoKmH: current.wind_speed_10m ? Math.round(current.wind_speed_10m) : 12,
        lluviaHoy: current.precipitation || 0,
        lluviaAcumulada7Dias: Number(lluviaAcumulada7Dias.toFixed(1)),
        horasAltaHumedad,
        tempPromedio7Dias,
        tempMax7Dias: tempMax7Dias !== -999 ? Math.round(tempMax7Dias) : 23,
        tempMin7Dias: tempMin7Dias !== 999 ? Math.round(tempMin7Dias) : 13,
        riesgoEnfermedades,
        razonRiesgo,
        fechaConsulta: new Date().toLocaleDateString('es-CR')
      };
    } catch (e) {
      console.warn('Fallo consulta a Open-Meteo, utilizando valores agroclimáticos típicos de la Meseta Central/Coronado:', e);
      return {
        altitud: 1680,
        temperaturaActual: 18,
        sensacionTermica: 18,
        humedadActual: 86,
        vientoKmH: 14,
        lluviaHoy: 2.4,
        lluviaAcumulada7Dias: 52.8,
        horasAltaHumedad: 48,
        tempPromedio7Dias: 17.5,
        tempMax7Dias: 22,
        tempMin7Dias: 13,
        riesgoEnfermedades: 'Crítico / Muy Alto',
        razonRiesgo: 'Alta humedad y niebla típica de zona alta. Riesgo elevado de Botrytis y Tizón tardío.',
        fechaConsulta: new Date().toLocaleDateString('es-CR'),
        modoOffline: true
      };
    }
  }
};
