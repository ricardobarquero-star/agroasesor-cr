/**
 * Servicio de Generación de Informes Web Digitales Autónomos (.html)
 * Formato Mobile-First de Alta Fidelidad para Productores Agrícolas
 * Permite apertura nativa en cualquier smartphone (Android / iPhone) vía WhatsApp
 * Criterio agronómico profesional: Ing. Agr. Ricardo Manuel Barquero Chacón (Col. 5896)
 */

import { calcularDosisDual } from '../utils/doseCalculator.js';
import { calcularNutrientesTotales, calcularDetalleCuadroFertilizacion, normalizarSalDosisUnidad } from './nutritionCalculatorService.js';

/**
 * Escapa cadenas de texto para inserción segura en HTML
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Genera el documento HTML completo, autónomo, responsivo y enriquecido
 */
export function generarHtmlReporte(datos = {}) {
  const {
    visita = {},
    productor = {},
    finca = {},
    lote = {},
    filtroLote = 'todos',
    perfilIngeniero = {},
    hallazgosFiltrados = datos.hallazgosFiltrados || datos.hallazgos || datos.visita?.hallazgos || [],
    medicionesSuelo = datos.medicionesSuelo || datos.visita?.medicionesSuelo || [],
    recFertirriegoFiltradas = datos.recFertirriegoFiltradas || datos.recomendacionesFertirriego || datos.visita?.recomendacionesFertirriego || [],
    recPlaguicidasFiltradas = datos.recPlaguicidasFiltradas || datos.recomendacionesPlaguicidas || datos.visita?.recomendacionesPlaguicidas || [],
    analisisClimaIa = {},
    estadisticasClima = null,
    analisisEpidemiologico = {},
    altitudFinca = 1680,
    tempFinca = 19,
    humedadFinca = 82,
    lluvia7d = 0
  } = datos;

  const fechaVisita = visita?.fecha || new Date().toISOString().slice(0, 10);
  const nombreFinca = finca?.nombre || 'Finca Principal';
  const nombreProductor = productor?.nombre || 'Productor';
  const cultivoNombre = lote?.cultivoNombre || 'Cultivo';
  const variedad = lote?.variedad || 'Estándar';
  const folio = `AGRO-CR-${visita?.id?.slice(-5) || '001'}`;
  const loteTexto = filtroLote === 'todos' ? 'Consolidado Toda la Finca' : `Lote: ${filtroLote}`;
  const telefonoIngeniero = perfilIngeniero?.telefono || '+506 8894-5662';
  const emailIngeniero = perfilIngeniero?.email || 'h7coordinador@gmail.com';
  const ubicacionIngeniero = perfilIngeniero?.ubicacion || 'Coronado, San José, Costa Rica';

  // Renderizar hallazgos fotográficos en formato Revista Científica (2 columnas, sin barras negras)
  const renderHallazgos = () => {
    if (!hallazgosFiltrados || hallazgosFiltrados.length === 0) {
      return `
        <div class="empty-card">
          <p>✅ No se registraron anomalías críticas durante el recorrido de campo.</p>
        </div>
      `;
    }

    return `
      <div class="findings-magazine-grid">
        ${hallazgosFiltrados.map((h, idx) => {
          const severidad = (h.severidad || 'Media').toLowerCase();
          let badgeCls = 'badge-mod';
          let sevLabel = 'Moderada';
          if (severidad.includes('alt') || severidad.includes('crít') || severidad.includes('crit')) {
            badgeCls = 'badge-crit';
            sevLabel = 'Alta / Crítica';
          } else if (severidad.includes('baj') || severidad.includes('lev')) {
            badgeCls = 'badge-leve';
            sevLabel = 'Leve / Preventiva';
          }

          const fotoSrc = h.fotoAnotada || h.fotoUrl || h.foto || '';

          return `
            <article class="card finding-card">
              <div class="finding-header">
                <div class="finding-meta">
                  <span class="specimen-pill">Figura ${idx + 1}</span>
                  <span class="category-tag">${escapeHtml(h.categoria || 'Fitopatología')}</span>
                </div>
                <span class="badge ${badgeCls}">${sevLabel}</span>
              </div>

              ${fotoSrc ? `
                <div class="photo-box" onclick="abrirModalFoto('${escapeHtml(fotoSrc)}', '${escapeHtml(h.titulo || 'Evidencia')}')">
                  <img src="${escapeHtml(fotoSrc)}" alt="${escapeHtml(h.titulo || 'Evidencia')}" loading="lazy" />
                  <div class="photo-overlay">
                    <span class="zoom-icon">🔍 Toca para ampliar HD</span>
                  </div>
                </div>
              ` : ''}

              <div class="finding-body">
                <h3 class="finding-title">${escapeHtml(h.titulo || 'Hallazgo de campo')}</h3>
                ${h.loteNombre ? `<p class="finding-location">📍 <strong>Ubicación:</strong> ${escapeHtml(h.loteNombre)}</p>` : ''}
                <p class="finding-desc">${escapeHtml(h.descripcion || 'Sin descripción adicional.')}</p>

                ${(h.organoAfectado || h.agenteCausal) ? `
                  <div class="spec-grid">
                    ${h.organoAfectado ? `<div><span class="lbl">Órgano:</span> <strong>${escapeHtml(h.organoAfectado)}</strong></div>` : ''}
                    ${h.agenteCausal ? `<div><span class="lbl">Agente causal:</span> <strong>${escapeHtml(h.agenteCausal)}</strong></div>` : ''}
                  </div>
                ` : ''}

                ${(h.analisisIa || h.recomendacionIa) ? `
                  <div class="ai-advice">
                    <div class="ai-advice-title">
                      <span>✨ Criterio & Recomendación Técnica:</span>
                    </div>
                    <p>${escapeHtml(h.analisisIa || h.recomendacionIa)}</p>
                  </div>
                ` : ''}
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `;
  };

  // Renderizar mediciones de suelo
  const renderSuelo = () => {
    if (!medicionesSuelo || medicionesSuelo.length === 0) return '';
    return `
      <section class="section-block">
        <div class="section-head">
          <h2 class="section-title">🧪 Mediciones Físico-Químicas de Suelo</h2>
          <span class="section-sub">Lecturas directas tomadas en rizosfera</span>
        </div>
        <div class="cards-grid">
          ${medicionesSuelo.map(m => `
            <div class="card telemetry-card">
              <div class="card-top-bar">
                <strong class="soil-lote">📍 ${escapeHtml(m.loteNombre || 'Lote')}</strong>
                <span class="ph-badge">pH ${m.phSuelo || '—'}</span>
              </div>
              <div class="soil-metrics-grid">
                <div class="soil-metric">
                  <span class="soil-lbl">Conductividad</span>
                  <span class="soil-val">${m.ceSuelo ? `${m.ceSuelo} mS/cm` : '—'}</span>
                </div>
                <div class="soil-metric">
                  <span class="soil-lbl">Temp. Suelo</span>
                  <span class="soil-val">${m.tempSuelo ? `${m.tempSuelo} °C` : '—'}</span>
                </div>
                <div class="soil-metric">
                  <span class="soil-lbl">Humedad Suelo</span>
                  <span class="soil-val">${escapeHtml(m.humedadSuelo || 'Adecuada')}</span>
                </div>
              </div>
              ${m.ajusteRecomendado ? `
                <div class="soil-adjust">
                  <strong>💡 Ajuste agronómico:</strong> ${escapeHtml(m.ajusteRecomendado)}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </section>
    `;
  };

  // Renderizar Fertirriego y Nutrición con Aporte Elemental Acumulado y Segregación por Día
  const renderFertirriego = () => {
    if (!recFertirriegoFiltradas || recFertirriegoFiltradas.length === 0) return '';
    return `
      <section class="section-block">
        <div class="section-head">
          <h2 class="section-title">💧 Programa Nutricional y Fertirriego</h2>
          <span class="section-sub">Soluciones segregadas por día y evento nutricional</span>
        </div>

        ${recFertirriegoFiltradas.map(s => {
          // Balance estequiométrico total semanal acumulado
          const todasLineas = (s.eventos || []).flatMap(ev => [
            ...(ev.lineasTanqueA || []),
            ...(ev.lineasTanqueB || []),
            ...(ev.productos || [])
          ]);
          const balance = calcularNutrientesTotales(todasLineas);
          const tieneBalance = balance && (balance.nTotalKg > 0 || balance.p2o5Kg > 0 || balance.k2oKg > 0);

          return `
            <div class="card week-card">
              <div class="week-header">
                <div>
                  <h3 class="week-title">Semana ${s.semana}</h3>
                  ${s.etapaFenologica ? `<div class="stage-tag">🌱 Etapa: ${escapeHtml(s.etapaFenologica)}</div>` : ''}
                </div>
                <span class="week-tag">Fertirriego</span>
              </div>

              ${(s.eventos || []).map(ev => {
                const volTanque = Number(ev.volumenTanqueDirectoLitros) || 1000;
                const rawProducts = (Array.isArray(ev.productos) && ev.productos.length > 0)
                  ? ev.productos
                  : (Array.isArray(ev.lineasProductos) && ev.lineasProductos.length > 0)
                    ? ev.lineasProductos
                    : (Array.isArray(ev.sales) && ev.sales.length > 0)
                      ? ev.sales
                      : (Array.isArray(ev.fertilizantes) && ev.fertilizantes.length > 0)
                        ? ev.fertilizantes
                        : (ev.productos || []);

                const prodsDirectos = rawProducts.map(p => normalizarSalDosisUnidad(p, volTanque)).filter(p => p.producto && p.producto.trim());
                const totalDosisDirecto = prodsDirectos.reduce((acc, p) => acc + p.dosisNum, 0);

                const volMadre = Number(ev.volumenTanqueMadreLitros) || 1000;
                const prodsA = (Array.isArray(ev.lineasTanqueA) ? ev.lineasTanqueA : []).map(p => normalizarSalDosisUnidad(p, volMadre)).filter(p => p.producto && p.producto.trim());
                const totalDosisA = prodsA.reduce((acc, p) => acc + p.dosisNum, 0);

                const prodsB = (Array.isArray(ev.lineasTanqueB) ? ev.lineasTanqueB : []).map(p => normalizarSalDosisUnidad(p, volMadre)).filter(p => p.producto && p.producto.trim());
                const totalDosisB = prodsB.reduce((acc, p) => acc + p.dosisNum, 0);

                const tieneProdsDual = prodsA.length > 0 || prodsB.length > 0;
                const esDual = (ev.modalidad === 'dosatron' && tieneProdsDual) || (prodsA.length > 0 && prodsB.length > 0);
                const tieneSuplementos = prodsDirectos.some(it => it.esSuplemento);
                const obsTexto = ev.observacionesPie || ev.observaciones || ev.instrucciones || '';

                return `
                <div class="event-block">
                  <div class="event-header">
                    <div>
                      <h4 class="event-name">${escapeHtml(ev.nombreEvento || ev.nombre || 'Aplicación Nutricional')}</h4>
                      <div class="event-pills-row">
                        ${ev.dia ? `<span class="event-day-pill">📅 ${escapeHtml(ev.dia)}</span>` : ''}
                        ${ev.objetivo ? `<span class="event-obj-pill">🎯 ${escapeHtml(ev.objetivo)}</span>` : ''}
                      </div>
                    </div>
                    <span class="event-scope">${escapeHtml(ev.alcance || 'Finca')}</span>
                  </div>

                  <div class="event-meta-chips">
                    ${ev.modalidadNombre ? `<span>⚙️ ${escapeHtml(ev.modalidadNombre)}</span>` : ''}
                    ${ev.volumenTanqueMadreLitros ? `<span>🛢️ Tanque Madre: ${ev.volumenTanqueMadreLitros} L</span>` : ''}
                    ${ev.volumenTanqueDirectoLitros ? `<span>🛢️ Tanque Seleccionado: ${ev.volumenTanqueDirectoLitros} L de Agua</span>` : ''}
                    ${ev.relacionInyeccion ? `<span>💉 Inyección: ${escapeHtml(ev.relacionInyeccion)}</span>` : ''}
                    ${ev.conductividadObjetivo ? `<span>⚡ CE Esperada: ${escapeHtml(ev.conductividadObjetivo)}</span>` : ''}
                    ${ev.phObjetivo ? `<span>🧪 pH: ${escapeHtml(ev.phObjetivo)}</span>` : ''}
                  </div>

                  <!-- CUADRO DE DOSIFICACIÓN PARA EL PRODUCTOR (TABLA ESTRUCTURADA EN 3 COLUMNAS: SAL, DOSIS, UNIDADES) -->
                  ${!esDual ? `
                    <div class="cuadro-fert-wrapper">
                      <div class="cuadro-fert-header">
                        <div class="cuadro-fert-title">
                          <span>📋</span>
                          <span>CUADRO DE FERTILIZACIÓN (${escapeHtml(ev.nombreEvento || ev.nombre || 'Fórmula Nutricional')})</span>
                        </div>
                        <div class="cuadro-fert-volumen">
                          🛢️ Cantidad de Agua: <strong>${volTanque.toLocaleString()} Litros</strong>
                        </div>
                      </div>

                      <div class="table-responsive-container">
                        <table class="cuadro-fert-tabla">
                          <thead>
                            <tr>
                              <th>Sal / Fertilizante</th>
                              <th style="width: 120px; text-align: center;">Dosis</th>
                              <th style="width: 150px; text-align: center;">Unidades</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${prodsDirectos.length > 0 ? prodsDirectos.map(it => `
                              <tr>
                                <td>
                                  <div class="fert-name-cell">
                                    <strong>${escapeHtml(it.producto)}</strong>
                                    ${it.esSuplemento ? `<span class="badge-suplemento">🌿 Suplemento</span>` : ''}
                                  </div>
                                </td>
                                <td style="text-align: center;">
                                  <span class="dose-number-cell">${escapeHtml(it.dosis)}</span>
                                </td>
                                <td style="text-align: center;">
                                  <span class="dose-unit-cell">${escapeHtml(it.unidad)}</span>
                                </td>
                              </tr>
                            `).join('') : `
                              <tr>
                                <td colspan="3" style="text-align: center; padding: 12px; color: #64748b; font-style: italic;">
                                  Sin sales especificadas todavía en esta aplicación.
                                </td>
                              </tr>
                            `}
                          </tbody>
                          ${prodsDirectos.length > 0 ? `
                            <tfoot>
                              <tr class="cuadro-fert-total-row">
                                <td><strong>TOTAL DE SALES A DISOLVER</strong></td>
                                <td style="text-align: center;">
                                  <strong class="total-grams-badge">${totalDosisDirecto.toLocaleString()}</strong>
                                </td>
                                <td style="text-align: center;">
                                  <strong class="total-kg-sub">g / ${volTanque} L</strong>
                                </td>
                              </tr>
                            </tfoot>
                          ` : ''}
                        </table>
                      </div>

                      <!-- AL PIE DEL CUADRO SE DEJAN LAS INSTRUCCIONES -->
                      <div class="cuadro-observaciones">
                        <div class="cuadro-obs-header">
                          <span>📝</span> <strong>Instrucciones al Pie del Cuadro:</strong>
                        </div>

                        <div class="orden-mezcla-card">
                          <div class="orden-titulo">🔄 <strong>Orden Estricto de Disolución en Tanque (${volTanque.toLocaleString()} L de agua):</strong></div>
                          <ol class="orden-lista">
                            <li><strong>1. Llenado previo:</strong> Llenar el tanque con el 60% – 70% de agua limpia (aprox. ${Math.round(volTanque * 0.65).toLocaleString()} L) antes de incorporar las sales. Nunca verter fertilizantes en seco al fondo del tanque.</li>
                            <li><strong>2. Fosfatos y Sulfatos primero:</strong> Disolver primero las fuentes de fósforo (MAP / MKP) y luego los sulfatos (Sulfato de Potasio SoluSOP y Sulfato de Magnesio Epsom). Agitar enérgicamente hasta disolución total.</li>
                            <li><strong>3. Nitrato de Calcio de último:</strong> Con el agitador o retorno de bomba activo, incorporar el Calcinit (Nitrato de Calcio) de último para evitar precipitación de yeso. Completar con agua limpia hasta la marca de los ${volTanque.toLocaleString()} Litros.</li>
                            ${tieneSuplementos ? '<li><strong>4. Suplementos / Biológicos:</strong> Agregar los productos biológicos (ej. <em>Trichoderma</em>, nematicidas o bioestimulantes) al final con el tanque a volumen completo y aplicar preferiblemente en las primeras horas de la mañana.</li>' : ''}
                          </ol>
                        </div>

                        ${obsTexto ? `
                          <div class="instruccion-productor-card">
                            <strong>👨‍🌾 Indicación Agronómica para el Productor:</strong>
                            <p>${escapeHtml(obsTexto)}</p>
                          </div>
                        ` : ''}

                        ${ev.analisisIa ? `
                          <div class="dictamen-ia-card">
                            <strong>✨ Dictamen Técnico y Validación de Compatibilidad:</strong>
                            <p>${escapeHtml(ev.analisisIa)}</p>
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  ` : ''}

                  <!-- CASO DOSATRON (TANQUE A Y TANQUE B) -->
                  ${esDual ? `
                    <div class="grid-tanques-dual">
                      ${prodsA.length > 0 ? `
                        <div class="cuadro-fert-wrapper tank-a-wrapper">
                          <div class="cuadro-fert-header tank-a-header">
                            <div class="cuadro-fert-title">
                              <span>🔵</span>
                              <span>TANQUE A: CALCIO, NITRATOS Y QUELATOS</span>
                            </div>
                            <div class="cuadro-fert-volumen">
                              Tanque Concentrado: <strong>${volMadre.toLocaleString()} L</strong>
                            </div>
                          </div>
                          <div class="table-responsive-container">
                            <table class="cuadro-fert-tabla">
                              <thead>
                                <tr>
                                  <th>Sal / Fertilizante</th>
                                  <th style="width: 120px; text-align: center;">Dosis</th>
                                  <th style="width: 150px; text-align: center;">Unidades</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${prodsA.map(it => `
                                  <tr>
                                    <td>
                                      <div class="fert-name-cell">
                                        <strong>${escapeHtml(it.producto)}</strong>
                                        ${it.esSuplemento ? `<span class="badge-suplemento">🌿 Suplemento</span>` : ''}
                                      </div>
                                    </td>
                                    <td style="text-align: center;"><span class="dose-number-cell blue-dose">${escapeHtml(it.dosis)}</span></td>
                                    <td style="text-align: center;"><span class="dose-unit-cell">${escapeHtml(it.unidad)}</span></td>
                                  </tr>
                                `).join('')}
                              </tbody>
                              <tfoot>
                                <tr class="cuadro-fert-total-row blue-total">
                                  <td><strong>TOTAL TANQUE A</strong></td>
                                  <td style="text-align: center;"><strong>${totalDosisA.toLocaleString()}</strong></td>
                                  <td style="text-align: center;"><strong>g / ${volMadre} L</strong></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      ` : ''}

                      ${prodsB.length > 0 ? `
                        <div class="cuadro-fert-wrapper tank-b-wrapper">
                          <div class="cuadro-fert-header tank-b-header">
                            <div class="cuadro-fert-title">
                              <span>🟡</span>
                              <span>TANQUE B: FÓSFORO, SULFATOS Y MAGNESIO</span>
                            </div>
                            <div class="cuadro-fert-volumen">
                              Tanque Concentrado: <strong>${volMadre.toLocaleString()} L</strong>
                            </div>
                          </div>
                          <div class="table-responsive-container">
                            <table class="cuadro-fert-tabla">
                              <thead>
                                <tr>
                                  <th>Sal / Fertilizante</th>
                                  <th style="width: 120px; text-align: center;">Dosis</th>
                                  <th style="width: 150px; text-align: center;">Unidades</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${prodsB.map(it => `
                                  <tr>
                                    <td>
                                      <div class="fert-name-cell">
                                        <strong>${escapeHtml(it.producto)}</strong>
                                        ${it.esSuplemento ? `<span class="badge-suplemento">🌿 Suplemento</span>` : ''}
                                      </div>
                                    </td>
                                    <td style="text-align: center;"><span class="dose-number-cell amber-dose">${escapeHtml(it.dosis)}</span></td>
                                    <td style="text-align: center;"><span class="dose-unit-cell">${escapeHtml(it.unidad)}</span></td>
                                  </tr>
                                `).join('')}
                              </tbody>
                              <tfoot>
                                <tr class="cuadro-fert-total-row amber-total">
                                  <td><strong>TOTAL TANQUE B</strong></td>
                                  <td style="text-align: center;"><strong>${totalDosisB.toLocaleString()}</strong></td>
                                  <td style="text-align: center;"><strong>g / ${volMadre} L</strong></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      ` : ''}
                    </div>

                    <!-- OBSERVACIONES ABAJO DE LOS CUADROS EN DOSATRON -->
                    <div class="cuadro-observaciones">
                      <div class="cuadro-obs-header">
                        <span>📝</span> <strong>Instrucciones de Inyección y Observaciones para el Productor</strong>
                      </div>
                      <div class="orden-mezcla-card">
                        <div class="orden-titulo">💉 <strong>Inyección Proporcional Dual Dosatron (${escapeHtml(ev.relacionInyeccion || '1:100')}):</strong></div>
                        <ol class="orden-lista">
                          <li><strong>Calibración del Dosatron:</strong> Ajustar los inyectores a la tasa ${escapeHtml(ev.relacionInyeccion || '1:100')} (${ev.relacionInyeccion === '1:100' ? '1.0%' : 'según calibración'}).</li>
                          <li><strong>Segregación Química:</strong> Nunca mezclar los concentrados de Tanque A y Tanque B en el mismo recipiente para evitar precipitados insolubles de sulfato de calcio (yeso) o fosfato tricálcico.</li>
                          <li><strong>Orden en Tanque B:</strong> Disolver primero los fosfatos (MAP/MKP), luego los sulfatos y finalmente los micronutrientes quelatados.</li>
                        </ol>
                      </div>
                      ${obsTexto ? `
                        <div class="instruccion-productor-card">
                          <strong>👨‍🌾 Indicación del Agrónomo:</strong>
                          <p>${escapeHtml(obsTexto)}</p>
                        </div>
                      ` : ''}
                      ${ev.analisisIa ? `
                        <div class="dictamen-ia-card">
                          <strong>✨ Dictamen Técnico y Compatibilidad:</strong>
                          <p>${escapeHtml(ev.analisisIa)}</p>
                        </div>
                      ` : ''}
                    </div>
                  ` : ''}
                </div>
                `;
              }).join('')}

              ${tieneBalance ? `
                <div class="stoich-box">
                  <div class="stoich-head">
                    <div>
                      <strong>⚖️ Aporte Elemental Acumulado de la Semana ${s.semana}</strong>
                      <p class="stoich-sub">Suma estequiométrica total acumulada de todas las aplicaciones de la semana</p>
                    </div>
                    <span class="kn-ratio">Relación K:N = ${balance.relacionKN || 'Equilibrado'}</span>
                  </div>
                  <div class="stoich-grid">
                    <div class="stoich-cell">
                      <span class="s-elem">N Total</span>
                      <strong class="s-val n-col">${balance.nTotalKg} kg</strong>
                      <span class="s-extra">Nítrico: ${balance.formasNitrogeno?.pctNitrico || 0}%</span>
                    </div>
                    <div class="stoich-cell">
                      <span class="s-elem">P₂O₅</span>
                      <strong class="s-val p-col">${balance.p2o5Kg} kg</strong>
                      <span class="s-extra">Fosfato</span>
                    </div>
                    <div class="stoich-cell">
                      <span class="s-elem">K₂O</span>
                      <strong class="s-val k-col">${balance.k2oKg} kg</strong>
                      <span class="s-extra">Potasio</span>
                    </div>
                    <div class="stoich-cell">
                      <span class="s-elem">CaO</span>
                      <strong class="s-val ca-col">${balance.caoKg} kg</strong>
                      <span class="s-extra">Calcio</span>
                    </div>
                    <div class="stoich-cell">
                      <span class="s-elem">MgO</span>
                      <strong class="s-val mg-col">${balance.mgoKg} kg</strong>
                      <span class="s-extra">Magnesio</span>
                    </div>
                    <div class="stoich-cell">
                      <span class="s-elem">Azufre (S)</span>
                      <strong class="s-val s-col">${balance.sKg} kg</strong>
                      <span class="s-extra">Sulfatos</span>
                    </div>
                  </div>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </section>
    `;
  };

  // Renderizar Manejo Fitosanitario Foliar Segregado (CERO FUNCIÓN/BLANCO, DOBLE DOSIS)
  const renderPlaguicidas = () => {
    if (!recPlaguicidasFiltradas || recPlaguicidasFiltradas.length === 0) return '';
    return `
      <section class="section-block">
        <div class="section-head">
          <h2 class="section-title">🛡️ Manejo Fitosanitario Foliar Segregado</h2>
          <span class="section-sub">Orden de mezcla estricto y doble dosificación de campo</span>
        </div>

        ${recPlaguicidasFiltradas.map(s => `
          <div class="card week-card">
            <div class="week-header">
              <h3 class="week-title">Semana ${s.semana}</h3>
              <span class="week-tag fit-tag">Fitosanitario</span>
            </div>

            ${s.sinAplicacion ? `
              <div class="empty-card ok-card">
                <p>✅ <strong>Semana sin aplicación fitosanitaria:</strong> Mantener monitoreo preventivo continuo.</p>
              </div>
            ` : `
              ${(s.aplicaciones || []).map(app => `
                <div class="event-block">
                  <div class="event-header">
                    <h4 class="event-name">${escapeHtml(app.nombre || 'Aplicación Foliar')}</h4>
                    <span class="tank-size">Tanque: ${escapeHtml(app.volumenTanque || '200 L')}</span>
                  </div>

                  <div class="mix-list">
                    ${(app.ordenMezcla || []).map((l, lIdx) => {
                      const dual = calcularDosisDual(l.dosis || '');
                      const dLitro = l.dosisLitro || dual.dosisLitro;
                      const dEstanon = l.dosisEstanon || dual.dosisEstanon;

                      return `
                        <div class="mix-item">
                          <div class="mix-step-badge">${lIdx + 1}</div>
                          <div class="mix-content">
                            <div class="mix-top">
                              <strong class="product-title">${escapeHtml(l.producto)}</strong>
                              ${(l.fracIrac || l.tipo) ? `
                                <span class="frac-tag">${escapeHtml(l.fracIrac || l.tipo)}</span>
                              ` : ''}
                            </div>

                            <div class="dose-dual-box">
                              <div class="dose-chip litro-chip">
                                <span class="dose-chip-lbl">💧 Por Litro:</span>
                                <strong class="dose-chip-val">${escapeHtml(dLitro)}</strong>
                              </div>
                              <div class="dose-chip estanon-chip">
                                <span class="dose-chip-lbl">🛢️ Por Estañón 200 L:</span>
                                <strong class="dose-chip-val">${escapeHtml(dEstanon)}</strong>
                              </div>
                            </div>

                            <div class="mix-sub-meta">
                              ${l.periodoCarencia ? `<span>⏳ Carencia: <strong>${escapeHtml(l.periodoCarencia)} días</strong></span>` : ''}
                              ${l.intervaloReingreso ? `<span>🚪 Reingreso: <strong>${escapeHtml(l.intervaloReingreso)} h</strong></span>` : ''}
                              ${l.registroSfe ? `<span>🏛️ Reg: ${escapeHtml(l.registroSfe)}</span>` : ''}
                            </div>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>

                  ${app.observaciones ? `
                    <p class="event-note"><em>Observaciones de aplicación:</em> ${escapeHtml(app.observaciones)}</p>
                  ` : ''}
                </div>
              `).join('')}
            `}
          </div>
        `).join('')}
      </section>
    `;
  };

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
  <title>Informe Agronómico Oficial - ${escapeHtml(nombreFinca)} - ${escapeHtml(fechaVisita)}</title>
  
  <!-- Tipografía Editorial Moderna Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600;700&family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">

  <style>
    :root {
      --primary: #00652c;
      --primary-dark: #004d21;
      --primary-light: #d3ffd5;
      --primary-container: #e6f9e8;
      --surface: #f8f9fc;
      --card-bg: #ffffff;
      --text-main: #131b2e;
      --text-muted: #475569;
      --border-color: #dae2fd;
      --border-subtle: #e2e8f0;
      --amber-dark: #b45309;
      --amber-bg: #fef3c7;
      --red-dark: #b91c1c;
      --red-bg: #fee2e2;
      --radius-lg: 20px;
      --radius-md: 14px;
      --radius-sm: 8px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 15px;
      line-height: 1.55;
      color: var(--text-main);
      background-color: var(--surface);
      padding-bottom: 90px;
    }

    /* Tipografía ergonómica para teléfono */
    h1, h2, h3, h4 {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 700;
      line-height: 1.25;
    }

    /* Contenedor principal centrado para lectura ergonómica */
    .app-container {
      max-width: 680px;
      margin: 0 auto;
      padding: 14px 16px;
    }

    /* Barra Superior Flotante */
    .top-action-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border-subtle);
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.03);
    }

    .brand-logo-area {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .brand-seed {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      background: var(--primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }

    .brand-name {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 14px;
      font-weight: 800;
      color: var(--primary);
      letter-spacing: -0.2px;
    }

    .action-btn-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 7px 12px;
      font-size: 13px;
      font-weight: 700;
      border-radius: 10px;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: transform 0.1s, opacity 0.2s;
    }
    .btn-action:active { transform: scale(0.96); }

    .btn-print {
      background: #1e293b;
      color: white;
    }

    .btn-whatsapp {
      background: #25d366;
      color: white;
    }

    /* Tarjetas principales */
    .card {
      background: var(--card-bg);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      box-shadow: 0 4px 16px -2px rgba(19, 27, 46, 0.04);
      padding: 18px;
      margin-bottom: 16px;
    }

    /* Tarjeta Oficial de Identificación */
    .official-header-card {
      border-top: 5px solid var(--primary);
    }

    .official-title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 10px;
    }

    .colegiado-pill {
      font-family: 'Fira Code', monospace;
      font-size: 11px;
      font-weight: 700;
      color: var(--primary-dark);
      background: var(--primary-light);
      padding: 4px 8px;
      border-radius: 6px;
      display: inline-block;
    }

    .folio-stamp {
      font-family: 'Fira Code', monospace;
      font-size: 11px;
      color: #64748b;
      text-align: right;
    }

    .engineer-name {
      font-size: 18px;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 2px;
    }

    .engineer-sub {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 10px;
    }

    .dossier-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      background: #f1f5f9;
      padding: 12px;
      border-radius: var(--radius-md);
      margin-top: 10px;
    }

    .dossier-item span {
      display: block;
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
    }

    .dossier-item strong {
      font-size: 14px;
      color: var(--text-main);
    }

    /* Resumen Guía de Trabajo */
    .summary-box {
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      border-radius: var(--radius-md);
      padding: 14px;
      margin-bottom: 16px;
    }

    .summary-box h3 {
      font-size: 13px;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }

    .summary-box p {
      font-size: 14px;
      line-height: 1.5;
    }

    /* Banner AgroIA Vision */
    .ai-banner {
      background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
      border: 1px solid #c7d2fe;
      border-radius: var(--radius-lg);
      padding: 16px;
      margin-bottom: 18px;
      display: flex;
      gap: 14px;
      align-items: flex-start;
    }

    .ai-avatar {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      background: var(--primary);
      color: white;
      font-size: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .ai-badge-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }

    .ai-badge {
      font-family: 'Fira Code', monospace;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--primary);
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #22c55e;
      border-radius: 50%;
      animation: pulse 1.6s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.95); opacity: 0.8; }
    }

    .ai-text {
      font-size: 13.5px;
      line-height: 1.5;
      color: #1e293b;
    }

    /* Secciones */
    .section-block {
      margin-bottom: 24px;
    }

    .section-head {
      margin-bottom: 12px;
      padding-left: 4px;
    }

    .section-title {
      font-size: 17px;
      font-weight: 800;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .section-sub {
      font-size: 12.5px;
      color: var(--text-muted);
      display: block;
      margin-top: 2px;
    }

    /* Telemetría Clima */
    .telemetry-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }

    .telemetry-cell {
      background: white;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 12px;
      text-align: center;
    }

    .telemetry-lbl {
      font-size: 11px;
      color: #64748b;
      display: block;
      font-weight: 600;
    }

    .telemetry-val {
      font-family: 'Fira Code', monospace;
      font-size: 16px;
      font-weight: 700;
      color: var(--primary);
      margin-top: 2px;
      display: block;
    }

    /* Suelo */
    .soil-lote {
      font-size: 14px;
      color: var(--text-main);
    }

    .card-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .ph-badge {
      background: #dbeafe;
      color: #1e40af;
      font-family: 'Fira Code', monospace;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 12px;
    }

    .soil-metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      text-align: center;
      background: #f8fafc;
      padding: 10px;
      border-radius: 10px;
    }

    .soil-lbl {
      font-size: 10.5px;
      color: #64748b;
      display: block;
    }

    .soil-val {
      font-family: 'Fira Code', monospace;
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
    }

    .soil-adjust {
      margin-top: 10px;
      font-size: 12.5px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      padding: 8px 10px;
      border-radius: 8px;
      color: #92400e;
    }

    /* Hallazgos Fotográficos HD */
    .finding-card {
      padding: 16px;
      margin-bottom: 14px;
    }

    .finding-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .finding-meta {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .specimen-pill {
      font-family: 'Fira Code', monospace;
      font-size: 11px;
      font-weight: 700;
      background: #e2e8f0;
      color: #334155;
      padding: 2px 7px;
      border-radius: 6px;
    }

    .category-tag {
      font-size: 12px;
      font-weight: 600;
      color: var(--primary);
    }

    .badge {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .badge-crit { background: var(--red-bg); color: var(--red-dark); }
    .badge-mod { background: var(--amber-bg); color: var(--amber-dark); }
    .badge-leve { background: var(--primary-container); color: var(--primary-dark); }

    .finding-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 10px;
    }

    /* Cuadrícula de Revista Científica para Hallazgos (2 columnas en tablet/desktop) */
    .findings-magazine-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    @media (min-width: 600px) {
      .findings-magazine-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    /* Contenedor fotográfico HD con fondo claro sin barras negras */
    .photo-box {
      position: relative;
      width: 100%;
      height: 230px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: var(--radius-md);
      overflow: hidden;
      margin-bottom: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .photo-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.2s ease;
    }

    .event-pills-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }

    .event-day-pill {
      font-size: 11px;
      font-weight: 700;
      color: #1e40af;
      background: #dbeafe;
      padding: 2px 8px;
      border-radius: 6px;
    }

    .event-obj-pill {
      font-size: 11px;
      font-weight: 700;
      color: #065f46;
      background: #d1fae5;
      padding: 2px 8px;
      border-radius: 6px;
    }

    .stage-tag {
      font-size: 12px;
      font-weight: 600;
      color: #047857;
      margin-top: 2px;
    }

    .event-ai-box {
      margin-top: 10px;
      padding: 10px 12px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 10px;
      font-size: 12px;
      color: #1e3a8a;
    }

    .event-ai-title {
      display: block;
      margin-bottom: 4px;
      color: #1d4ed8;
    }

    .event-ai-text {
      white-space: pre-line;
      line-height: 1.45;
      color: #334155;
    }

    .stoich-sub {
      font-size: 11px;
      color: #64748b;
      font-weight: normal;
      margin-top: 2px;
    }

    .s-extra {
      display: block;
      font-size: 9.5px;
      color: #64748b;
      margin-top: 2px;
    }
    .photo-box:hover img { transform: scale(1.02); }

    .photo-overlay {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      backdrop-filter: blur(4px);
    }

    .finding-location {
      font-size: 12.5px;
      color: #64748b;
      margin-bottom: 6px;
    }

    .finding-desc {
      font-size: 14px;
      line-height: 1.5;
      color: #1e293b;
      margin-bottom: 10px;
    }

    .spec-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      background: #f8fafc;
      padding: 8px 10px;
      border-radius: 8px;
      font-size: 12px;
      margin-bottom: 10px;
    }
    .spec-grid .lbl { color: #64748b; display: block; font-size: 10.5px; }

    .ai-advice {
      background: #f0fdf4;
      border-left: 3px solid var(--primary);
      padding: 10px 12px;
      border-radius: 0 8px 8px 0;
      font-size: 13px;
      line-height: 1.45;
    }

    .ai-advice-title {
      font-weight: 700;
      color: var(--primary-dark);
      margin-bottom: 3px;
      font-size: 12px;
    }

    /* Semanas y Eventos */
    .week-card {
      border-top: 4px solid var(--primary);
      padding: 16px;
      margin-bottom: 16px;
    }

    .week-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 8px;
    }

    .week-title {
      font-size: 17px;
      color: var(--primary);
      font-weight: 800;
    }

    .week-tag {
      font-family: 'Fira Code', monospace;
      font-size: 11px;
      font-weight: 700;
      background: var(--primary-light);
      color: var(--primary-dark);
      padding: 3px 8px;
      border-radius: 6px;
    }
    .fit-tag {
      background: #e0e7ff;
      color: #3730a3;
    }

    .event-block {
      background: #f8fafc;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 14px;
      margin-bottom: 12px;
    }

    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .event-name {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }

    .event-scope, .tank-size {
      font-family: 'Fira Code', monospace;
      font-size: 11px;
      background: white;
      border: 1px solid var(--border-subtle);
      padding: 2px 6px;
      border-radius: 6px;
      color: #475569;
    }

    .event-meta-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 12px;
      margin-bottom: 10px;
    }
    .event-meta-chips span {
      background: white;
      border: 1px solid #cbd5e1;
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 600;
      color: #334155;
    }

    /* Cuadro de Fertilización y Pesaje para el Productor */
    .cuadro-fert-wrapper {
      margin: 12px 0 16px 0;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      overflow: hidden;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .cuadro-fert-header {
      background: linear-gradient(135deg, #065f46 0%, #047857 100%);
      color: white;
      padding: 10px 14px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    .cuadro-fert-title {
      font-size: 13px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 6px;
      letter-spacing: 0.3px;
    }
    .cuadro-fert-volumen {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.4);
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }
    .table-responsive-container {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .cuadro-fert-tabla {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
    }
    .cuadro-fert-tabla th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 800;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 9px 12px;
      border-bottom: 2px solid #cbd5e1;
      text-align: left;
    }
    .cuadro-fert-tabla td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
      color: #1e293b;
    }
    .cuadro-fert-tabla tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    .cuadro-fert-tabla tbody tr:hover {
      background: #f0fdf4;
    }
    .fert-name-cell {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
    }
    .badge-suplemento {
      font-size: 10px;
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
      padding: 1px 7px;
      border-radius: 12px;
      font-weight: 700;
      white-space: nowrap;
    }
    .dose-number-cell {
      font-family: 'Fira Code', monospace;
      font-weight: 800;
      font-size: 14px;
      color: #065f46;
      background: #dcfce7;
      padding: 4px 10px;
      border-radius: 8px;
      display: inline-block;
      border: 1px solid #86efac;
      white-space: nowrap;
    }
    .blue-dose {
      color: #1e40af;
      background: #dbeafe;
      border-color: #93c5fd;
    }
    .amber-dose {
      color: #92400e;
      background: #fef3c7;
      border-color: #fcd34d;
    }
    .dose-conc-cell {
      font-family: 'Fira Code', monospace;
      font-size: 11.5px;
      color: #475569;
      font-weight: 600;
      white-space: nowrap;
    }
    .fert-role-cell {
      font-size: 11.5px;
      color: #475569;
      line-height: 1.35;
    }
    .cuadro-fert-total-row {
      background: #ecfdf5 !important;
      border-top: 2px solid #059669;
      font-weight: 800;
      color: #065f46;
    }
    .cuadro-fert-total-row td {
      padding: 11px 12px;
      font-size: 12.5px;
    }
    .total-grams-badge {
      font-size: 14.5px;
      color: #065f46;
      font-family: 'Fira Code', monospace;
      font-weight: 800;
    }
    .total-kg-sub {
      font-size: 11.5px;
      color: #047857;
      font-weight: 600;
    }
    .blue-total {
      background: #eff6ff !important;
      border-top: 2px solid #2563eb;
      color: #1e40af;
    }
    .amber-total {
      background: #fffbeb !important;
      border-top: 2px solid #d97706;
      color: #92400e;
    }
    .cuadro-observaciones {
      background: #f8fafc;
      border-top: 1px solid #cbd5e1;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .cuadro-obs-header {
      font-size: 12px;
      font-weight: 800;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 6px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .orden-mezcla-card {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-left: 4px solid #2563eb;
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 12px;
      color: #1e3a8a;
    }
    .orden-titulo {
      margin-bottom: 6px;
      font-size: 12px;
      color: #1e40af;
    }
    .orden-lista {
      margin: 0;
      padding-left: 18px;
      line-height: 1.5;
    }
    .orden-lista li {
      margin-bottom: 4px;
    }
    .instruccion-productor-card {
      background: #fefce8;
      border: 1px solid #fef08a;
      border-left: 4px solid #eab308;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 12px;
      color: #713f12;
      line-height: 1.4;
    }
    .dictamen-ia-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-left: 4px solid #16a34a;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 12px;
      color: #14532d;
      line-height: 1.4;
    }
    .grid-tanques-dual {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }
    @media (min-width: 768px) {
      .grid-tanques-dual {
        grid-template-columns: 1fr 1fr;
      }
    }
    .tank-a-header {
      background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%) !important;
    }
    .tank-b-header {
      background: linear-gradient(135deg, #b45309 0%, #d97706 100%) !important;
    }

    /* Balance Estequiométrico */
    .stoich-box {
      background: #faf5ff;
      border: 1px solid #e9d5ff;
      border-radius: var(--radius-md);
      padding: 12px;
      margin-top: 10px;
    }

    .stoich-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 12.5px;
      color: #6b21a8;
    }

    .kn-ratio {
      font-family: 'Fira Code', monospace;
      font-size: 11px;
      background: #ede9fe;
      color: #5b21b6;
      padding: 2px 7px;
      border-radius: 6px;
      font-weight: 700;
    }

    .stoich-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
    }

    .stoich-cell {
      background: white;
      border: 1px solid #f3e8ff;
      border-radius: 8px;
      padding: 6px;
      text-align: center;
    }

    .s-elem { font-size: 10px; color: #64748b; display: block; }
    .s-val { font-family: 'Fira Code', monospace; font-size: 13px; font-weight: 700; }
    .n-col { color: #00652c; }
    .p-col { color: #b45309; }
    .k-col { color: #6b21a8; }
    .ca-col { color: #1e40af; }
    .mg-col { color: #047857; }
    .s-col { color: #854d0e; }

    /* Fitosanitarios y Doble Dosis */
    .mix-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .mix-item {
      display: flex;
      gap: 10px;
      background: white;
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 12px;
    }

    .mix-step-badge {
      width: 26px;
      height: 26px;
      border-radius: 8px;
      background: #e2e8f0;
      color: #1e293b;
      font-family: 'Fira Code', monospace;
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .mix-content {
      flex: 1;
      min-width: 0;
    }

    .mix-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 6px;
      margin-bottom: 6px;
    }

    .product-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-main);
    }

    .frac-tag {
      font-family: 'Fira Code', monospace;
      font-size: 10.5px;
      font-weight: 700;
      background: #ede9fe;
      color: #6b21a8;
      padding: 2px 6px;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .dose-dual-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin: 8px 0;
    }

    .dose-chip {
      padding: 7px 9px;
      border-radius: 8px;
      font-size: 12px;
    }

    .litro-chip {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
    }

    .estanon-chip {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
    }

    .dose-chip-lbl {
      display: block;
      font-size: 10.5px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 2px;
    }

    .dose-chip-val {
      font-family: 'Fira Code', monospace;
      font-size: 13.5px;
      font-weight: 700;
      color: var(--text-main);
    }

    .mix-sub-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
    }

    /* Firma y Respaldo Oficial */
    .endorsement-card {
      text-align: center;
      border-top: 3px solid var(--primary);
      padding: 20px;
    }

    .endorsement-card .eng-name {
      font-size: 16px;
      font-weight: 800;
      color: var(--primary);
      margin-bottom: 2px;
    }

    .endorsement-card .eng-col {
      font-family: 'Fira Code', monospace;
      font-size: 12px;
      color: #334155;
      margin-bottom: 6px;
    }

    .endorsement-card .eng-inst {
      font-size: 11.5px;
      color: #64748b;
    }

    /* Modal de Fotografía Fullscreen */
    .photo-modal {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(10, 15, 29, 0.95);
      backdrop-filter: blur(8px);
      align-items: center;
      justify-content: center;
      padding: 16px;
      flex-direction: column;
    }

    .photo-modal.active {
      display: flex;
    }

    .modal-img-wrap {
      max-width: 96vw;
      max-height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-radius: 12px;
    }

    .modal-img-wrap img {
      max-width: 100%;
      max-height: 80vh;
      object-fit: contain;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    }

    .modal-caption {
      color: white;
      font-size: 15px;
      font-weight: 600;
      margin-top: 14px;
      text-align: center;
    }

    .modal-close-btn {
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(255,255,255,0.2);
      color: white;
      border: none;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      font-size: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      backdrop-filter: blur(4px);
    }

    /* Adaptación para impresión limpia sin cortes feos */
    @media print {
      .top-action-bar, .photo-overlay { display: none !important; }
      body { background: white !important; padding: 0 !important; }
      .app-container { max-width: 100% !important; padding: 0 !important; }
      .card { box-shadow: none !important; border: 1px solid #ccc !important; page-break-inside: avoid; }
      .photo-box { height: 180px !important; }
    }
  </style>
</head>
<body>

  <!-- BARRA DE ACCIÓN SUPERIOR MÓVIL -->
  <header class="top-action-bar">
    <div class="brand-logo-area">
      <div class="brand-seed">🌱</div>
      <div>
        <div class="brand-name">AgroAsesor Pro CR</div>
      </div>
    </div>

    <div class="action-btn-group">
      <button onclick="window.print()" class="btn-action btn-print" title="Imprimir o Guardar en PDF">
        <span>🖨️ PDF</span>
      </button>
      <a href="https://wa.me/50688945662?text=${encodeURIComponent('Hola Ing. Ricardo Barquero, le escribo sobre el informe agronómico de la finca ' + nombreFinca)}" target="_blank" class="btn-action btn-whatsapp" title="Consultar al Agrónomo">
        <span>💬 Contactar</span>
      </a>
    </div>
  </header>

  <main class="app-container">

    <!-- TARJETA OFICIAL DE IDENTIFICACIÓN Y ASESORÍA AGRONÓMICA -->
    <section class="card official-header-card">
      <div class="official-title-row">
        <div>
          <span class="colegiado-pill">Colegiado No. 5896 • CIAGRO CR</span>
        </div>
        <div class="folio-stamp">
          <span>Folio: <strong>${escapeHtml(folio)}</strong></span><br/>
          <span>Fecha: <strong>${escapeHtml(fechaVisita)}</strong></span>
        </div>
      </div>

      <h1 class="engineer-name">Ing. Agr. Ricardo M. Barquero Chacón</h1>
      <p class="engineer-sub">
        Asesoría Agronómica Profesional • Tel: ${escapeHtml(telefonoIngeniero)} • ${escapeHtml(emailIngeniero)} • ${escapeHtml(ubicacionIngeniero)}
      </p>

      <div class="dossier-grid">
        <div class="dossier-item">
          <span>Productor:</span>
          <strong>${escapeHtml(nombreProductor)}</strong>
        </div>
        <div class="dossier-item">
          <span>Finca:</span>
          <strong>${escapeHtml(nombreFinca)}</strong>
        </div>
        <div class="dossier-item">
          <span>Cultivo / Variedad:</span>
          <strong>${escapeHtml(cultivoNombre)} (${escapeHtml(variedad)})</strong>
        </div>
        <div class="dossier-item">
          <span>Alcance Reporte:</span>
          <strong>${escapeHtml(loteTexto)}</strong>
        </div>
      </div>
    </section>

    <!-- GUÍA DE TRABAJO PARA EL PRODUCTOR -->
    <div class="summary-box">
      <h3>📋 Guía de Trabajo para el Productor</h3>
      <p>
        Estimado(a) <strong>${escapeHtml(nombreProductor)}</strong>: Se presenta el reporte agronómico técnico correspondiente a la visita del <strong>${escapeHtml(fechaVisita)}</strong>. Contiene el diagnóstico de campo con evidencia fotográfica en HD, parámetros agroclimáticos satelitales, mediciones en rizosfera y los planes de fertilización y control fitosanitario con doble dosificación para aplicación inmediata.
      </p>
    </div>

    <!-- BANNER AGROIA VISION ACTIVO -->
    <div class="ai-banner">
      <div class="ai-avatar">🧠</div>
      <div>
        <div class="ai-badge-row">
          <span class="ai-badge">AgroIA Vision Diagnóstico Activo</span>
          <span class="pulse-dot"></span>
        </div>
        <p class="ai-text">
          ${escapeHtml(analisisClimaIa?.resumenEjecutivo || 'Monitoreo de parámetros climáticos y fitopatológicos continuo activo.')}
          ${analisisClimaIa?.impactoFisiologico ? ` ${escapeHtml(analisisClimaIa.impactoFisiologico)}` : ''}
        </p>
      </div>
    </div>

    <!-- AGROCLIMA Y TELEMETRÍA AMBIENTAL -->
    <section class="section-block">
      <div class="section-head">
        <h2 class="section-title">🌦️ Agroclima y Entorno Ambiental</h2>
        <span class="section-sub">Georreferenciación satelital y condiciones de finca</span>
      </div>

      <div class="telemetry-grid">
        <div class="telemetry-cell">
          <span class="telemetry-lbl">Altitud Finca</span>
          <span class="telemetry-val">${altitudFinca} msnm</span>
        </div>
        <div class="telemetry-cell">
          <span class="telemetry-lbl">Lluvia 7 Días</span>
          <span class="telemetry-val">${lluvia7d} mm</span>
        </div>
        <div class="telemetry-cell">
          <span class="telemetry-lbl">Temperatura</span>
          <span class="telemetry-val">${tempFinca} °C</span>
        </div>
        <div class="telemetry-cell">
          <span class="telemetry-lbl">Humedad Relativa</span>
          <span class="telemetry-val">${humedadFinca} %</span>
        </div>
      </div>

      ${estadisticasClima && estadisticasClima.totalVisitas > 1 ? `
        <div class="card" style="padding: 12px; margin-bottom: 12px; background: #f0fdf4; border-color: #bbf7d0;">
          <div style="font-size: 12px; font-weight: 700; color: #166534; margin-bottom: 4px;">
            📊 Clima Acumulado en Finca (${estadisticasClima.totalVisitas} visitas)
          </div>
          <div style="font-size: 13px; color: #14532d;">
            Lluvia total acumulada: <strong>${estadisticasClima.lluviaTotalAcumulada} mm</strong> • Temp. promedio: <strong>${estadisticasClima.promedioTemperatura || estadisticasClima.temperaturaPromedio || 19}°C</strong> • Humedad promedio: <strong>${estadisticasClima.promedioHumedadRelativa || estadisticasClima.humedadPromedio || 80}%</strong>
          </div>
        </div>
      ` : ''}

      ${analisisEpidemiologico && analisisEpidemiologico.elNinoImpacto ? `
        <div class="card" style="padding: 12px; margin-bottom: 12px; background: #fffbeb; border-color: #fde68a;">
          <div style="font-size: 12px; font-weight: 700; color: #92400e; margin-bottom: 4px;">
            🌦️ Epidemiología: Fenómeno El Niño
          </div>
          <p style="font-size: 12.5px; color: #78350f; margin-bottom: 4px;">
            <strong>Impacto:</strong> ${escapeHtml(analisisEpidemiologico.elNinoImpacto)}
          </p>
          ${analisisEpidemiologico.hongosFoliares ? `
            <p style="font-size: 12px; color: #78350f;">
              <strong>Prevención foliar:</strong> ${escapeHtml(analisisEpidemiologico.hongosFoliares)}
            </p>
          ` : ''}
        </div>
      ` : ''}
    </section>

    <!-- MEDICIONES DE SUELO -->
    ${renderSuelo()}

    <!-- HALLAZGOS Y EVIDENCIA FOTOGRÁFICA EN HD -->
    <section class="section-block">
      <div class="section-head">
        <h2 class="section-title">🔍 Hallazgos y Diagnóstico en Campo</h2>
        <span class="section-sub">${hallazgosFiltrados.length} especímenes documentados con soporte fotográfico</span>
      </div>

      ${renderHallazgos()}
    </section>

    <!-- PROGRAMA DE FERTIRRIEGO Y NUTRICIÓN -->
    ${renderFertirriego()}

    <!-- PROGRAMA FITOSANITARIO FOLIAR SEGREGADO -->
    ${renderPlaguicidas()}

    <!-- FIRMA PROFESIONAL Y RESPALDO LEGAL -->
    <section class="card endorsement-card">
      <p class="eng-name">Ing. Agr. Ricardo Manuel Barquero Chacón</p>
      <p class="eng-col">Colegiado No. 5896 • Ingeniero Agrónomo</p>
      <p class="eng-inst">Colegio de Ingenieros Agrónomos de Costa Rica (CIAGRO)</p>
      <p class="eng-inst" style="margin-top: 6px;">AgroAsesor Pro CR™ • Tel: ${escapeHtml(telefonoIngeniero)}</p>
    </section>

  </main>

  <!-- MODAL FULLSCREEN DE FOTOGRAFÍA HD -->
  <div id="photoModal" class="photo-modal" onclick="cerrarModalFoto()">
    <button class="modal-close-btn" onclick="cerrarModalFoto()">&times;</button>
    <div class="modal-img-wrap" onclick="event.stopPropagation()">
      <img id="modalImg" src="" alt="Foto HD Ampliada" />
    </div>
    <div id="modalCaption" class="modal-caption"></div>
  </div>

  <script>
    function abrirModalFoto(src, caption) {
      const modal = document.getElementById('photoModal');
      const img = document.getElementById('modalImg');
      const cap = document.getElementById('modalCaption');
      img.src = src;
      cap.textContent = caption || 'Evidencia fotográfica en HD';
      modal.classList.add('active');
    }

    function cerrarModalFoto() {
      const modal = document.getElementById('photoModal');
      modal.classList.remove('active');
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') cerrarModalFoto();
    });
  </script>
</body>
</html>
`;
}

/**
 * Genera un Blob y archivo File del reporte HTML listo para compartir o descargar
 */
export function generarReporteHtmlBlob(datos = {}) {
  const htmlContent = generarHtmlReporte(datos);
  const fincaNombre = (datos?.finca?.nombre || 'Finca').replace(/\s+/g, '_');
  const fecha = datos?.visita?.fecha || new Date().toISOString().slice(0, 10);
  const loteStr = (datos?.filtroLote === 'todos' ? 'Consolidado' : (datos?.filtroLote || 'Lote')).replace(/\s+/g, '_');
  const fileName = `Informe_Digital_${fincaNombre}_${loteStr}_${fecha}.html`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const file = new File([blob], fileName, { type: 'text/html;charset=utf-8' });

  return {
    blob,
    file,
    fileName,
    htmlContent
  };
}

/**
 * Descarga el archivo .html directamente en el navegador del usuario
 */
export function descargarReporteHtml(datos = {}) {
  const { blob, fileName } = generarReporteHtmlBlob(datos);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return fileName;
}

export const digitalReportService = {
  generarHtmlReporte,
  generarReporteHtmlBlob,
  descargarReporteHtml
};

export default digitalReportService;