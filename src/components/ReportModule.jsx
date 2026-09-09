import React, { useRef, useState } from 'react';
import { 
  FileText, Download, Share2, Mail, CheckCircle2, Phone, 
  MapPin, Calendar, CloudRain, Droplet, ShieldAlert, Sparkles, 
  Printer, ArrowRight, UserCheck, AlertTriangle
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { crAgroDatabase } from '../data/crAgroDatabase';

export default function ReportModule({ visita, onOpenAi }) {
  const reportRef = useRef(null);
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [mensajeCompartir, setMensajeCompartir] = useState('');

  const productor = visita.productor || {};
  const finca = visita.finca || {};
  const lote = visita.lote || {};
  const clima = visita.clima || {};
  const hallazgos = visita.hallazgos || [];
  const recFertirriego = visita.recomendacionesFertirriego || [];
  const recPlaguicidas = visita.recomendacionesPlaguicidas || [];

  // Descargar PDF con calidad editorial
  const handleDescargarPDF = async () => {
    if (!reportRef.current) return;
    setGenerandoPdf(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // 2x retina DPI para nitidez editorial
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Primera página
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      // Páginas adicionales si el reporte es extenso
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `Informe_Agronomico_${finca.nombre || 'Finca'}_${lote.nombre || 'Lote'}_${visita.fecha}.pdf`
        .replace(/\s+/g, '_');
      pdf.save(fileName);
    } catch (e) {
      console.error('Error generando PDF:', e);
      // Fallback a impresión nativa del navegador / Safari
      window.print();
    } finally {
      setGenerandoPdf(false);
    }
  };

  // Enlace directo a WhatsApp del productor
  const handleCompartirWhatsApp = () => {
    const telefonoLimpio = (productor.telefono || '').replace(/[^0-9]/g, '');
    const texto = encodeURIComponent(
      `Estimado(a) ${productor.nombre || 'Productor'}:\n\n` +
      `Le adjunto el resumen de la VISITA TÉCNICA AGRONÓMICA realizada en ${finca.nombre || 'su finca'} (${lote.cultivoNombre || 'Cultivo'}).\n\n` +
      `📋 ASESOR: Ing. Agr. Ricardo Barquero Chacón (Ord. 5896)\n` +
      `🌧️ Clima acumulado 7 días: ${clima.lluviaAcumulada7Dias || 0} mm de lluvia.\n` +
      `🔍 Hallazgos clave: ${hallazgos.length} problemas evaluados en campo.\n` +
      `💧 Programa de Fertirriego: ${recFertirriego.length} semana(s) programadas.\n` +
      `🛡️ Aplicaciones Foliares: ${recPlaguicidas.length} semana(s) estructuradas.\n\n` +
      `Por favor revise el plan detallado adjunto para iniciar labores mañana a primera hora.`
    );
    const url = telefonoLimpio 
      ? `https://api.whatsapp.com/send?phone=${telefonoLimpio}&text=${texto}`
      : `https://api.whatsapp.com/send?text=${texto}`;
    window.open(url, '_blank');
  };

  // Enlace de Correo para el productor con copia a h7coordinador@gmail.com
  const handleEnviarCorreo = () => {
    const destinatario = productor.email || 'h7coordinador@gmail.com';
    const cc = 'h7coordinador@gmail.com';
    const asunto = encodeURIComponent(`Informe Técnico Agronómico - ${finca.nombre || 'Finca'} - Ing. Ricardo Barquero`);
    const cuerpo = encodeURIComponent(
      `Estimado(a) ${productor.nombre || 'Productor'}:\n\n` +
      `Adjunto encontrará el informe de asesoría agronómica correspondiente a la visita del ${visita.fecha} en el ${lote.nombre || 'Lote evaluado'}.\n\n` +
      `Atentamente,\n` +
      `Ing. Agr. Ricardo Barquero Chacón\n` +
      `Colegiado No. 5896 - Colegio de Ingenieros Agrónomos de Costa Rica\n` +
      `Tel: +506 8894-5662 | Vázquez de Coronado, Costa Rica`
    );
    window.location.href = `mailto:${destinatario}?cc=${cc}&subject=${asunto}&body=${cuerpo}`;
  };

  return (
    <div className="space-y-4">
      {/* Barra de Acciones Superiores */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" />
            <span>Informe Técnico Oficial de la Visita</span>
          </h2>
          <p className="text-xs text-slate-500">
            Documento de calidad editorial listo para el productor, WhatsApp y exportación a PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenAi('reporte')}
            className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 font-semibold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Auditoría IA</span>
          </button>
          <button
            onClick={handleCompartirWhatsApp}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
          <button
            onClick={handleEnviarCorreo}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 shadow"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Correo</span>
          </button>
          <button
            onClick={handleDescargarPDF}
            disabled={generandoPdf}
            className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{generandoPdf ? 'Generando PDF...' : 'Descargar PDF'}</span>
          </button>
        </div>
      </div>

      {/* DOCUMENTO DEL INFORME CON CALIDAD EDITORIAL (Contenedor imprimible) */}
      <div 
        ref={reportRef}
        className="bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden p-4 sm:p-8 text-slate-900 max-w-4xl mx-auto print:border-none print:shadow-none print:p-2"
      >
        {/* ENCABEZADO OFICIAL DEL ASESOR */}
        <div className="border-b-2 border-emerald-700 pb-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              INFORME DE ASESORÍA AGRONÓMICA PROFESIONAL
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 leading-tight">
              Ing. Agr. Ricardo Barquero Chacón
            </h1>
            <p className="text-xs font-bold text-emerald-800">
              Colegio de Ingenieros Agrónomos de Costa Rica — Colegiado Ord. 5896
            </p>
          </div>
          <div className="text-left sm:text-right text-xs text-slate-600 space-y-0.5">
            <p className="flex sm:justify-end items-center gap-1.5 font-medium">
              <Phone className="w-3.5 h-3.5 text-emerald-700" /> +506 8894-5662
            </p>
            <p className="flex sm:justify-end items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" /> Vázquez de Coronado, San José, Costa Rica
            </p>
            <p className="text-[11px] text-slate-500">
              Especialista en Fresa, Flores de Corte y Hortalizas
            </p>
          </div>
        </div>

        {/* FICHA TÉCNICA DE LA VISITA Y GEOLOCALIZACIÓN */}
        <div className="bg-slate-50 rounded-xl p-3.5 sm:p-4 border border-slate-200 mb-5 text-xs">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" /> 1. Ficha Técnica de la Visita y Georreferenciación
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-500 block">Productor / Cliente:</span>
              <strong className="text-slate-900 font-bold">{productor.nombre || 'No especificado'}</strong>
              <span className="text-slate-500 block text-[11px]">{productor.telefono}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Finca y Ubicación:</span>
              <strong className="text-slate-900 font-bold">{finca.nombre || 'Finca Principal'}</strong>
              <span className="text-slate-500 block text-[11px]">{finca.ubicacion || 'Costa Rica'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Lote y Cultivo:</span>
              <strong className="text-slate-900 font-bold">{lote.nombre || 'Lote Evaluado'}</strong>
              <span className="text-emerald-800 font-bold block text-[11px]">{lote.cultivoNombre} ({lote.variedad || 'Variedad estándar'})</span>
            </div>
            <div>
              <span className="text-slate-500 block">Fecha y GPS:</span>
              <strong className="text-slate-900 font-bold">{visita.fecha} {visita.hora || ''}</strong>
              <span className="text-slate-600 block text-[11px] font-mono">
                GPS: {finca.gps ? `${finca.gps.lat}, ${finca.gps.lon} (${finca.gps.altitud} msnm)` : '9.976, -83.992 (1414 msnm)'}
              </span>
            </div>
          </div>
        </div>

        {/* RESUMEN AGROCLIMÁTICO (LLUVIA ACUMULADA 7 DÍAS) */}
        <div className="bg-blue-50/70 rounded-xl p-3.5 sm:p-4 border border-blue-200 mb-5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-blue-700" /> 2. Condiciones Agroclimáticas Registradas (Open-Meteo)
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-200 text-blue-900">
              Riesgo Sanitario: {clima.riesgoEnfermedades || 'Moderado'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
            <div>
              <span className="text-slate-500 block">Lluvia Acumulada (7 días):</span>
              <strong className="text-blue-900 text-sm font-black">{clima.lluviaAcumulada7Dias || 0} mm</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Horas con HR &gt; 85%:</span>
              <strong className="text-blue-900 text-sm font-black">{clima.horasAltaHumedad || 0} horas</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Temperatura del Día:</span>
              <strong className="text-slate-900 text-sm font-bold">{clima.temperaturaActual || 18}°C (Humedad: {clima.humedadActual || 85}%)</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Rango Térmico Semanal:</span>
              <strong className="text-slate-900 text-sm font-bold">{clima.tempMin7Dias || 12}°C - {clima.tempMax7Dias || 22}°C</strong>
            </div>
          </div>
          <p className="text-[11px] text-blue-950 font-medium bg-blue-100/60 p-2 rounded-lg">
            <strong>Criterio Agronómico:</strong> {clima.razonRiesgo || 'Humedad relativa propicia para esporulación fúngica. Requiere manejo de ventilación y cobertura preventiva.'}
          </p>
        </div>

        {/* GUÍA PRÁCTICA PARA EL PRODUCTOR (INFOGRAFÍA SENCILLA) */}
        <div className="bg-amber-50 rounded-xl p-3.5 sm:p-4 border-2 border-amber-300 mb-5 print-break-inside-avoid">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
              ★
            </span>
            <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-amber-950">
              3. Guía Práctica para el Productor (Resumen de Tareas Inmediatas)
            </h3>
          </div>
          <p className="text-xs text-amber-900 font-medium mb-3">
            Instrucciones en lenguaje claro y directo para el encargado y los trabajadores de finca:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-sm">
              <span className="font-extrabold text-amber-800 block mb-1">1. ORDEN DE MEZCLA</span>
              <p className="text-slate-700 leading-snug">
                En el estañón de 200 L: Primero <strong>Carrier</strong> para acondicionar el agua, luego polvos, luego líquidos y de último el <strong>Break-Thru</strong>.
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-sm">
              <span className="font-extrabold text-amber-800 block mb-1">2. HORARIOS DE RIEGO</span>
              <p className="text-slate-700 leading-snug">
                Aplicar fertirriego temprano. Mantener pulsos cortos de 4 minutos para no saturar raíces y evitar pudrición con la alta humedad.
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-sm">
              <span className="font-extrabold text-amber-800 block mb-1">3. MANEJO DEL CULTIVO</span>
              <p className="text-slate-700 leading-snug">
                Eliminar frutos y flores con moho gris en bolsa plástica cerrada antes de aplicar. No botar fruta dañada en los pasillos.
              </p>
            </div>
          </div>
        </div>

        {/* DIAGNÓSTICO FOTOGRÁFICO DE CAMPO CON FOTOS ANOTADAS */}
        <div className="mb-6 print-break-inside-avoid">
          <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5 pb-1 border-b border-slate-200">
            <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">4</span>
            Diagnóstico Visual de Hallazgos y Síntomas en Campo
          </h3>

          {hallazgos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hallazgos.map((h, idx) => (
                <div key={h.id || idx} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col">
                  {h.fotoAnotada ? (
                    <div className="h-44 sm:h-52 bg-slate-900 w-full overflow-hidden">
                      <img 
                        src={h.fotoAnotada} 
                        alt={h.titulo} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  ) : (
                    <div className="h-24 bg-slate-200 flex items-center justify-center text-xs text-slate-500 italic">
                      Sin fotografía registrada
                    </div>
                  )}
                  <div className="p-3 text-xs flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                          {h.categoria}
                        </span>
                        <span className="font-bold text-[10px] text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                          Severidad: {h.severidad}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{h.titulo}</h4>
                      <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">{h.descripcion}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 block">Foto y registro: {h.fecha}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No se adjuntaron hallazgos fotográficos en esta visita.</p>
          )}
        </div>

        {/* PLAN DE FERTIRRIEGO Y DRENCH */}
        <div className="mb-6 print-break-inside-avoid">
          <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5 pb-1 border-b border-slate-200">
            <span className="w-5 h-5 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center text-xs">5</span>
            Programa Nutricional: Fertirriego y Drench por Semanas
          </h3>

          {recFertirriego.map((semana, sIdx) => (
            <div key={sIdx} className="mb-4 bg-slate-50 rounded-xl border border-slate-200 p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs sm:text-sm text-blue-950">
                  {semana.titulo || `Semana ${semana.semana}`}
                </h4>
                <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Alcance: {semana.alcance || 'Toda la Finca'}
                </span>
              </div>

              {(semana.eventos || []).map((ev, eIdx) => (
                <div key={eIdx} className="bg-white rounded-lg border border-slate-200 p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-800 border-b pb-1">
                    <span>{ev.nombreEvento || ev.tipo}</span>
                    <span className="text-blue-700 font-semibold">{ev.sistema}</span>
                  </div>

                  {ev.lineasTanqueA && (
                    <div className="space-y-1">
                      <span className="font-bold text-blue-900 block text-[11px]">TANQUE A (Calcio y Nitratos):</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pl-2">
                        {ev.lineasTanqueA.map((l, idx) => (
                          <div key={idx} className="flex justify-between border-b border-slate-100 py-0.5">
                            <span className="text-slate-700">{l.producto}</span>
                            <strong className="text-blue-900">{l.dosis}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {ev.lineasTanqueB && (
                    <div className="space-y-1">
                      <span className="font-bold text-amber-900 block text-[11px]">TANQUE B (Fósforo, Sulfatos y Ácido):</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pl-2">
                        {ev.lineasTanqueB.map((l, idx) => (
                          <div key={idx} className="flex justify-between border-b border-slate-100 py-0.5">
                            <span className="text-slate-700">{l.producto}</span>
                            <strong className="text-amber-900">{l.dosis}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {ev.productos && (
                    <div className="space-y-1">
                      <span className="font-bold text-emerald-900 block text-[11px]">MEZCLA DRENCH (Por Estañón 200 L):</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pl-2">
                        {ev.productos.map((l, idx) => (
                          <div key={idx} className="flex justify-between border-b border-slate-100 py-0.5">
                            <span className="text-slate-700">{l.producto}</span>
                            <strong className="text-emerald-900">{l.dosis}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {ev.observacionesPie && (
                    <p className="text-[11px] text-slate-500 italic pt-1">
                      Nota: {ev.observacionesPie}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* PROGRAMA FITOSANITARIO Y ROTACIÓN FRAC/IRAC */}
        <div className="mb-6 print-break-inside-avoid">
          <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5 pb-1 border-b border-slate-200">
            <span className="w-5 h-5 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center text-xs">6</span>
            Programa Fitosanitario Foliar y Estrategia Antirresistencia FRAC / IRAC
          </h3>

          {recPlaguicidas.map((semana, sIdx) => (
            <div key={sIdx} className="mb-4 bg-slate-50 rounded-xl border border-slate-200 p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs sm:text-sm text-purple-950">
                  {semana.titulo || `Semana ${semana.semana}`}
                </h4>
                <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Alcance: {semana.alcance || 'Toda la Finca'}
                </span>
              </div>

              {(semana.aplicaciones || []).map((app, aIdx) => (
                <div key={aIdx} className="bg-white rounded-lg border border-slate-200 p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-purple-900 border-b pb-1">
                    <span>{app.nombre}</span>
                    <span className="text-slate-600 font-semibold">{app.volumenTanque}</span>
                  </div>

                  <table className="w-full text-left text-[11px]">
                    <thead className="text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-1">Orden</th>
                        <th className="py-1">Insumo</th>
                        <th className="py-1">Grupo FRAC/IRAC</th>
                        <th className="py-1 text-right">Dosis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(app.ordenMezcla || []).map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-1 text-purple-700 font-bold">#{item.orden || idx + 1}</td>
                          <td className="py-1 font-semibold text-slate-900">{item.producto}</td>
                          <td className="py-1">
                            <span className="bg-slate-100 text-slate-700 font-mono text-[10px] px-1.5 py-0.5 rounded">
                              {item.fracIrac || item.tipo}
                            </span>
                          </td>
                          <td className="py-1 text-right font-bold text-slate-900">{item.dosis}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {app.observacionesPie && (
                    <p className="text-[11px] text-slate-500 italic pt-1">
                      Calibración y Notas: {app.observacionesPie}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* FIRMAS OFICIALES DE CONFORMIDAD */}
        <div className="pt-6 border-t-2 border-slate-300 mt-6 print-break-inside-avoid">
          <div className="grid grid-cols-2 gap-8 text-center text-xs">
            <div className="space-y-1">
              <div className="border-b border-slate-400 w-44 sm:w-56 mx-auto h-12 flex items-end justify-center pb-1">
                <span className="font-serif italic text-sm text-emerald-900 font-bold">Ing. Ricardo Barquero Ch.</span>
              </div>
              <p className="font-bold text-slate-900">Ing. Agr. Ricardo Barquero Chacón</p>
              <p className="text-slate-500 text-[11px]">Colegiado Ord. 5896 • Asesor Técnico</p>
            </div>
            <div className="space-y-1">
              <div className="border-b border-slate-400 w-44 sm:w-56 mx-auto h-12"></div>
              <p className="font-bold text-slate-900">{productor.nombre || 'Firma del Productor'}</p>
              <p className="text-slate-500 text-[11px]">Recibido Conforme • Encargado de Finca</p>
            </div>
          </div>

          <p className="text-center text-[10px] text-slate-400 mt-6">
            Documento técnico generado con AgroAsesor Pro CR • Vázquez de Coronado, Costa Rica
          </p>
        </div>

      </div>
    </div>
  );
}
