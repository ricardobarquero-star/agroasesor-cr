/**
 * Servicio de Inteligencia Artificial Epidemiológica y Agroclimática
 * Contextualizado para Costa Rica y la asesoría técnica del Ing. Agr. Ricardo M. Barquero Chacón (Col. 5896).
 * Analiza en tiempo real el impacto de la Temperatura, Humedad Relativa, Lluvia Semanal y Altitud (msnm)
 * sobre el cultivo evaluado, determinando qué enfermedades fúngicas/bacterianas e insectos/ácaros son propensos a activarse.
 */

export const agroEpidemiologyService = {
  /**
   * Genera el análisis agroclimático y fitosanitario completo para el cultivo y condiciones dadas.
   */
  generarAnalisisClimaticoIa({
    cultivoNombre = 'Fresa',
    variedad = '',
    temp = 20,
    humedad = 80,
    lluvia7d = 30,
    altitud = 1680,
    loteNombre = 'Lote Principal',
    hallazgos = []
  }) {
    const t = Number(temp) || 20;
    const hr = Number(humedad) || 80;
    const ll = Number(lluvia7d) || 0;
    const alt = Number(altitud) || 1680;
    const c = (cultivoNombre || 'Fresa').toLowerCase();

    // 1. Determinar el piso altitudinal en Costa Rica
    let pisoAltitudinal = 'Piso Medio-Alto (1400 - 1999 msnm)';
    let descAltitud = 'Condiciones templadas con formación periódica de niebla vespertina y amplitudes térmicas moderadas.';
    if (alt >= 2000) {
      pisoAltitudinal = 'Piso Alto de Altura (2000+ msnm - Cartago/Zarcero/Prusia)';
      descAltitud = 'Temperaturas nocturnas bajas, rocío persistente hasta media mañana y alta radiación UV matutina.';
    } else if (alt < 1400) {
      pisoAltitudinal = 'Piso Basal / Medio (Menor a 1400 msnm - Valle Central/Bajuras)';
      descAltitud = 'Mayor tasa de evapotranspiración diurna, aceleración metabólica y rápido secado del dosel.';
    }

    // 2. Análisis agronómico especializado según cultivo
    let impactoFisiologico = '';
    let enfermedadesPropensas = [];
    let insectosAcarosPropensos = [];
    let medidasPreventivas = '';
    let resumenEjecutivo = '';

    const hrCond = hr >= 75 ? '75% de HR' : 'niveles moderados de humedad';

    if (c.includes('fresa') || c.includes('fragaria')) {
      // FRESA (Fragaria x ananassa)
      impactoFisiologico = 'En cultivo de Fresa a ' + t + '°C y ' + hr + '% de Humedad Relativa (' + alt + ' msnm), el microclima bajo macrotúnel/invernadero favorece una transpiración intermedia. Al superar ' + hrCond + ', se ralentiza el flujo transpiratorio xilemático en horas diurnas, lo que dificulta el transporte masivo de Calcio hacia las hojas jóvenes y cálices de los frutos (riesgo de tip-burn y ablandamiento del fruto). La alternancia de días cálidos (' + t + '°C) con condensación nocturna de rocío en el polietileno genera el ambiente ideal de película líquida para la germinación conidial.';

      // Enfermedades Fúngicas / Bacterianas
      enfermedadesPropensas = [
        {
          patogeno: 'Botrytis cinerea (Moho Gris)',
          tipo: 'Hongo Foliar y de Fruto',
          riesgo: (hr >= 75 || ll > 25) ? 'Crítico / Muy Alto' : 'Moderado',
          condicionPredisponente: 'HR de ' + hr + '% con temperaturas de ' + t + '°C y rocío en pétalos senescentes.',
          organoAfectado: 'Flores, botones, receptáculo y fruto cuajado.',
          sintomaAlerta: 'Pudrición blanda acuosa con eflorescencia algodonosa de conidióforos grisáceos en cálices y fruta.'
        },
        {
          patogeno: 'Podosphaera aphanis / Oídio (Mildeo Polvoriento)',
          tipo: 'Hongo Foliar',
          riesgo: (t >= 19 && hr >= 65) ? 'Alto' : 'Moderado',
          condicionPredisponente: 'Temperaturas templadas diurnas (' + t + '°C) alternadas con noches húmedas (' + hr + '% HR) sin agua libre directa.',
          organoAfectado: 'Envés foliar, estolones, pedúnculos florales y frutillos jóvenes.',
          sintomaAlerta: "Polvillo blanco harinoso en el envés y encorvamiento ascendente de los bordes foliares ('cuchareo')."
        },
        {
          patogeno: 'Mycosphaerella fragariae (Mancha Púrpura / Viruela)',
          tipo: 'Hongo Foliar',
          riesgo: hr >= 70 ? 'Moderado / Alto' : 'Bajo',
          condicionPredisponente: 'Humedad foliar prolongada (>6 horas continuas de humedad relativa superior al 75%).',
          organoAfectado: 'Hojas maduras y peciolos.',
          sintomaAlerta: 'Manchas redondeadas con centro blanquecino/grisáceo y halo púrpura o rojizo bien delimitado.'
        },
        {
          patogeno: 'Phytophthora cactorum / Pythium spp.',
          tipo: 'Oomicete de Raíz y Corona',
          riesgo: (ll > 35 || hr >= 80) ? 'Alto' : 'Bajo',
          condicionPredisponente: 'Lluvia semanal (' + ll + ' mm) y saturación del sustrato o drenaje deficiente.',
          organoAfectado: 'Corona de la planta, raíces absorbentes y estolones.',
          sintomaAlerta: 'Marchitez vascular súbita en horas de sol, anillo necrótico pardo-rojizo al corte longitudinal de la corona.'
        },
        {
          patogeno: 'Xanthomonas fragariae (Mancha Angular)',
          tipo: 'Bacteria Foliar',
          riesgo: (ll > 20 || hr >= 80) ? 'Moderado' : 'Bajo',
          condicionPredisponente: 'Salpicaduras de agua, rocío prolongado y aspersiones tardías al caer la tarde.',
          organoAfectado: 'Follaje en hojas intermedias.',
          sintomaAlerta: 'Lesiones poligonales translúcidas observadas a contraluz, delimitadas por las nervaduras secundarias.'
        }
      ];

      // Insectos y Ácaros
      insectosAcarosPropensos = [
        {
          plaga: 'Tetranychus urticae (Arañita Roja / Ácaro de dos puntos)',
          tipo: 'Ácaro Tetraníquido',
          riesgo: t >= 20 ? 'Crítico / Aceleración Reproductiva' : 'Moderado',
          dinamicaPoblacional: 'A ' + t + '°C, el ciclo biológico se acorta a 7 - 9 días de huevo a adulto. En microclima cálido de macrotúnel y ausencia de lluvias directas que laven el follaje, la tasa neta de reproducción es explosiva.',
          sintomaAlerta: 'Punteado clorótico amarillento en haz foliar, presencia de finas telarañas y colonias activas en envés.'
        },
        {
          plaga: 'Frankliniella occidentalis (Trips de las flores)',
          tipo: 'Insecto Tisanóptero',
          riesgo: t >= 18 ? 'Alto' : 'Moderado',
          dinamicaPoblacional: 'Gran actividad de vuelo y cópula favorecida por temperaturas de ' + t + '°C. Se refugian dentro de los estambres y carpelos de flores abiertas.',
          sintomaAlerta: "Pistilos ennegrecidos, estambres secos, frutos con bronceado superficial, agrietamiento y deformación ('cara de gato')."
        },
        {
          plaga: 'Bemisia tabaci / Trialeurodes (Mosca Blanca)',
          tipo: 'Insecto Hemíptero',
          riesgo: 'Moderado',
          dinamicaPoblacional: 'Colonización en hojas jóvenes. Secreción de mielecilla que promueve desarrollo posterior de fumagina.',
          sintomaAlerta: 'Adultos al mover el dosel, ninfas sésiles amarillentas adheridas al envés de foliolos.'
        },
        {
          plaga: 'Gusanos cortadores y defoliadores (Spodoptera / Agrotis)',
          tipo: 'Larvas de Lepidóptero',
          riesgo: ll > 25 ? 'Moderado / Alto' : 'Bajo',
          dinamicaPoblacional: 'Favorecidos por la humedad del suelo (' + ll + ' mm de lluvia semanal). Salen durante la noche a cortar plántulas y mordisquear coronas.',
          sintomaAlerta: 'Plantas cortadas a nivel del cuello, mordeduras irregulares en hojas y heces oscuras en acolchado.'
        }
      ];

      medidasPreventivas = '1. Ventilación temprana de macrotúneles abriendo cortinas laterales antes de las 8:30 a.m. para abatir la humedad relativa a menos del 70% y evaporar la película de rocío foliar.\n2. Deshoje sanitario riguroso retirando hojas viejas con manchas de Mycosphaerella y pétalos senescentes que sirven de cabeza de puente para Botrytis.\n3. Aplicación de Silicio asimilable (Sili-K o Silitek) junto con Fosfito de Potasio para engrosar la cutícula epidérmica foliar (barrera física contra estiletes de arañita roja y haustorios de oídio).\n4. Muestreo de envés con lupa 20x en los lotes evaluados para detectar arañita roja antes de que supere el umbral de 3 a 5 individuos por foliolo.';

      resumenEjecutivo = 'Bajo el clima actual (' + t + '°C, ' + hr + '% HR, ' + ll + ' mm lluvia, ' + alt + ' msnm), el cultivo de Fresa se encuentra en ALERTA MÁXIMA para Botrytis cinerea y Oídio por alta humedad, sumado a una ACELERACIÓN BIOLÓGICA de la Arañita Roja por la condición térmica (' + t + '°C). Se requiere control preventivo dual y ventilación estricta.';

    } else if (c.includes('papa') || c.includes('patata')) {
      // PAPA (Solanum tuberosum)
      impactoFisiologico = 'En cultivo de Papa a ' + t + '°C con ' + hr + '% de HR en ' + pisoAltitudinal + ', las condiciones de alta humedad relativa (' + hr + '%) y lluvia acumulada (' + ll + ' mm) prolongan el mojado foliar por más de 10 horas continuas. Esto detona el período de incubación de oomicetes y hongos foliares devastadores.';

      enfermedadesPropensas = [
        {
          patogeno: 'Phytophthora infestans (Tizón Tardío / Lancha)',
          tipo: 'Oomicete Foliar y Tallo',
          riesgo: (hr >= 80 || ll > 20) ? 'Crítico / Emergencia' : 'Alto',
          condicionPredisponente: 'HR de ' + hr + '% y temperaturas entre 14-20°C con niebla o lluvia persistente.',
          organoAfectado: 'Hojas, peciolos, tallos y tubérculos en desarrollo.',
          sintomaAlerta: 'Manchas verde oscuras acuosas de rápida expansión con moho blanquecino algodonoso en el envés bajo alta humedad.'
        },
        {
          patogeno: 'Alternaria solani (Tizón Temprano)',
          tipo: 'Hongo Foliar',
          riesgo: t >= 18 ? 'Alto' : 'Moderado',
          condicionPredisponente: 'Alternancia de períodos secos con lluvias (' + ll + ' mm) y días templados.',
          organoAfectado: 'Hojas bajas maduras.',
          sintomaAlerta: 'Manchas concéntricas en forma de diana o anillos concéntricos con halo amarillento.'
        },
        {
          patogeno: 'Rhizoctonia solani (Costra Negra / Chancro del Tallo)',
          tipo: 'Hongo de Suelo',
          riesgo: ll > 30 ? 'Alto' : 'Moderado',
          condicionPredisponente: 'Suelos húmedos y fríos con exceso de saturación hídrica.',
          organoAfectado: 'Brotes emergentes, estolones y base de tallos.',
          sintomaAlerta: 'Chancros marrones hundidos en la base del tallo y estrangulamiento de brotes.'
        }
      ];

      insectosAcarosPropensos = [
        {
          plaga: 'Tecia solanivora / Phthorimaea (Polilla de la papa)',
          tipo: 'Lepidóptero',
          riesgo: hr < 75 ? 'Alto' : 'Moderado',
          dinamicaPoblacional: 'Mayor vuelo crepuscular y oviposición en la base de la planta durante días sin lluvia intensa.',
          sintomaAlerta: 'Galerías superficiales y profundas en tubérculos con presencia de deyecciones y aserrín.'
        },
        {
          plaga: 'Liriomyza huidobrensis (Mosca Minadora)',
          tipo: 'Díptero',
          riesgo: t >= 17 ? 'Alto' : 'Moderado',
          dinamicaPoblacional: 'Actividad de picaduras de alimentación y puestas foliares favorecidas por temperaturas diurnas templadas.',
          sintomaAlerta: 'Minas serpentiformes blancas en el mesófilo foliar y punteado de picaduras en el haz.'
        }
      ];

      medidasPreventivas = '1. Cobertura estricta con fungicidas protectores multisitio (Mancozeb, Clorotalonil o Cobre) antes de lluvias previstas.\n2. Monitoreo diario del envés foliar para detectar el vello blanquecino de Phytophthora infestans.\n3. Buen aporcado para proteger los tubérculos del lavado de esporas de tizón y oviposición de polilla.';
      resumenEjecutivo = 'Condiciones de ' + hr + '% HR y ' + ll + ' mm de lluvia disparan el riesgo de Phytophthora infestans (Lancha). Mantener esquema de protección foliar preventivo sin dilatar intervalos.';

    } else if (c.includes('tomate') || c.includes('chile')) {
      // TOMATE Y CHILE DULCE
      impactoFisiologico = 'A ' + t + '°C y ' + hr + '% de Humedad Relativa (' + alt + ' msnm), el cultivo presenta una tasa de crecimiento activa pero susceptible a condensación interna y bacteriosis por salpicadura.';

      enfermedadesPropensas = [
        {
          patogeno: 'Passalora fulva / Cladosporium (Moho de la Hoja)',
          tipo: 'Hongo Foliar',
          riesgo: hr >= 80 ? 'Alto' : 'Moderado',
          condicionPredisponente: 'HR prolongada superior a 80% en invernaderos con ventilación reducida.',
          organoAfectado: 'Follaje intermedio e inferior.',
          sintomaAlerta: 'Manchas amarillas difusas en el haz con terciopelo pardo oliváceo en el envés correspondiente.'
        },
        {
          patogeno: 'Ralstonia solanacearum / Clavibacter (Marchitez Bacteriana)',
          tipo: 'Bacteria Vascular',
          riesgo: (ll > 30 && t >= 20) ? 'Crítico' : 'Bajo',
          condicionPredisponente: 'Suelos húmedos y temperaturas cálidas con heridas radiculares.',
          organoAfectado: 'Sistema vascular y médula del tallo.',
          sintomaAlerta: 'Marchitez foliar diurna rápida sin amarillamiento previo; exudado lechoso bacteriano en prueba de vaso.'
        },
        {
          patogeno: 'Leveillula taurica / Oidiopsis (Oídio)',
          tipo: 'Hongo Endofítico',
          riesgo: t >= 21 ? 'Alto' : 'Moderado',
          condicionPredisponente: 'Temperaturas cálidas diurnas con noches templadas secas o con HR moderada.',
          organoAfectado: 'Hojas maduras.',
          sintomaAlerta: 'Zonas cloróticas brillantes en el haz y vello pulverulento tenue en el envés.'
        }
      ];

      insectosAcarosPropensos = [
        {
          plaga: 'Polyphagotarsonemus latus (Ácaro Blanco / Acarosis)',
          tipo: 'Ácaro Tarsonémido',
          riesgo: (t >= 20 && hr >= 70) ? 'Alto' : 'Moderado',
          dinamicaPoblacional: 'Se ubican en los puntos de crecimiento y cogollos tiernos, inyectando toxinas salivares.',
          sintomaAlerta: 'Brotaciones deformes, hojas abarquilladas hacia abajo, acorchamiento y endurecimiento bronceado.'
        },
        {
          plaga: 'Tuta absoluta (Polilla del Tomate) / Spodoptera',
          tipo: 'Lepidóptero',
          riesgo: t >= 20 ? 'Alto' : 'Moderado',
          dinamicaPoblacional: 'Activa emergencia de adultos con noches templadas.',
          sintomaAlerta: 'Minas transparentes en hojas que no respetan nervaduras y perforaciones en fruto.'
        }
      ];

      medidasPreventivas = '1. Ventilación cruzada y elevación de cortinas para mantener HR < 75%.\n2. Aplicación de inductores de fitoalexinas (Fosfito de Potasio) y extractos de canela/cobre quelatado.\n3. Eliminación de chupones y brotes con desinfección estricta de tijeras entre plantas.';
      resumenEjecutivo = 'Riesgo de moho foliar y ácaro blanco acentuado por la combinación de ' + t + '°C y ' + hr + '% HR. Foco en ventilación y sanidad de poda.';

    } else {
      // HORTALIZAS / FLORES / CULTIVO GENERAL
      impactoFisiologico = 'En ' + cultivoNombre + ' a ' + t + '°C y ' + hr + '% HR con ' + ll + ' mm de lluvia semanal en ' + pisoAltitudinal + ', el balance hídrico foliar muestra períodos de condensación prolongados que facilitan la penetración de tubos germinativos fúngicos.';

      enfermedadesPropensas = [
        {
          patogeno: 'Botrytis spp. / Sclerotinia (Pudriciones Blandas y Mohos)',
          tipo: 'Hongo Necrótrofo',
          riesgo: hr >= 75 ? 'Alto' : 'Moderado',
          condicionPredisponente: 'Alta humedad relativa (' + hr + '%) y presencia de agua libre sobre hojas y flores.',
          organoAfectado: 'Tejidos florales, peciolos y base de tallos.',
          sintomaAlerta: 'Pudrición acuosa de avance rápido con micelio algodonoso gris o blanco.'
        },
        {
          patogeno: 'Puccinia spp. / Royas y Mildeos',
          tipo: 'Hongos Foliares Parásitos Obligados',
          riesgo: hr >= 70 ? 'Alto' : 'Moderado',
          condicionPredisponente: 'Rocío matutino persistente a ' + t + '°C.',
          organoAfectado: 'Follaje principal.',
          sintomaAlerta: 'Pústulas pulverulentas de color canela, blanco o anaranjado en el envés de hojas.'
        }
      ];

      insectosAcarosPropensos = [
        {
          plaga: 'Ácaros y Trips fitófagos',
          tipo: 'Plaga Artrópoda',
          riesgo: t >= 19 ? 'Alto' : 'Moderado',
          dinamicaPoblacional: 'Aceleración de ciclos vitales a ' + t + '°C en ausencia de lluvias directas fuertes.',
          sintomaAlerta: 'Plateado, bronceado y deformación de tejidos tiernos.'
        }
      ];

      medidasPreventivas = '1. Mantener adecuada densidad de siembra y aireación del dosel vegetal.\n2. Aplicaciones preventivas con bioinsumos o fungicidas protectores antes de eventos de alta condensación.\n3. Monitoreo fitosanitario semanal en puntos críticos de la finca.';
      resumenEjecutivo = 'Parámetros agroclimáticos (' + t + '°C, ' + hr + '% HR, ' + ll + ' mm lluvia) demandan vigilancia activa contra mohos foliares y control de poblaciones iniciales de ácaros/trips.';
    }

    return {
      cultivo: cultivoNombre,
      variedad: variedad || 'Estándar',
      temperatura: t,
      humedadRelativa: hr,
      lluviaSemanal: ll,
      altitud: alt,
      pisoAltitudinal,
      descAltitud,
      impactoFisiologico,
      enfermedadesPropensas,
      insectosAcarosPropensos,
      medidasPreventivas,
      resumenEjecutivo,
      estadoAprobacion: 'aprobado',
      fechaGeneracion: new Date().toISOString().split('T')[0]
    };
  }
};
