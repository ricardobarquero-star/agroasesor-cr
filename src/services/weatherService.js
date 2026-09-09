/**
 * Servicio Agroclimático basado en Open-Meteo Agrometeorology API
 * Obtiene el clima actual y el acumulado de los últimos 7 días por coordenadas GPS.
 */

export const weatherService = {
  // Zonas agronómicas de referencia en Costa Rica
  zonasPredeterminadas: {
    coronado: { nombre: 'Vázquez de Coronado, San José', lat: 9.9760, lon: -83.9920, elev: 1414 },
    llano_grande: { nombre: 'Llano Grande, Cartago', lat: 9.9230, lon: -83.9050, elev: 2270 },
    poas: { nombre: 'Poás, Alajuela', lat: 10.1200, lon: -84.2400, elev: 1600 },
    zarcero: { nombre: 'Zarcero, Alajuela', lat: 10.1800, lon: -84.4100, elev: 1736 }
  },

  /**
   * Obtiene la posición GPS actual del dispositivo
   */
  async obtenerPosicionGPS() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        resolve({
          lat: 9.9760,
          lon: -83.9920,
          precision: 'Simulada (Coronado)',
          zonaNombre: 'Vázquez de Coronado'
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: Number(pos.coords.latitude.toFixed(5)),
            lon: Number(pos.coords.longitude.toFixed(5)),
            altitud: pos.coords.altitude ? Math.round(pos.coords.altitude) : 1420,
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
   * Consulta el clima actual y el histórico acumulado de 7 días
   */
  async consultarClimaYAcumulado(lat = 9.9760, lon = -83.9920) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,precipitation&past_days=7&forecast_days=1&timezone=auto`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();

      const current = data.current || {};
      const hourly = data.hourly || {};

      // Calcular acumulados de los últimos 7 días
      let lluviaAcumulada7Dias = 0;
      let horasAltaHumedad = 0; // Horas con HR > 85% (factor crítico para hongos)
      let tempPromedio7Dias = 0;
      let tempMax7Dias = -999;
      let tempMin7Dias = 999;

      if (hourly.precipitation && hourly.precipitation.length > 0) {
        // Tomar hasta 168 horas (7 días x 24h)
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
