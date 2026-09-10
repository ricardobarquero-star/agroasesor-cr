import React, { useRef, useState } from 'react';
import { 
  FileText, Download, Share2, Mail, CheckCircle2, Phone, 
  MapPin, Calendar, CloudRain, Droplet, ShieldAlert, Sparkles, 
  Printer, ArrowRight, UserCheck, AlertTriangle, Check
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { crAgroDatabase } from '../data/crAgroDatabase';

export default function ReportModule({ visita, onOpenAi }) {
  const reportRef = useRef(null);
  const [generandoPdf, setGenerandoPdf] = useState(false);

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
        scale: 2, // 2x DPI editorial
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

      // Páginas adicionales
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `Informe_Agronomico_${finca.nombre || 'Finca'}_${lote.nombre || 'Lote'}_${visita.fecha || '2026'}.pdf`
        .replace(/\s+/g, '_');
      pdf.save(fileName);
    } catch (e) {
      console.error('Error generando PDF con html2canvas:', e);
      // Fallback a impresión nativa del sistema
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
      `📋 ASESOR: Ing. Agr. Ricardo Barquero Chacón (Colegiado Ord. 5896)\n` +
      `🌧️ Clima acumulado 7 días: ${clima.lluviaAcumulada7Dias || 0} mm de lluvia.\n` +
      `🔍 Hallazgos documentados: ${hallazgos.length} puntos evaluados en campo.\n` +
      `💧 Programa de Fertirriego: ${recFertirriego.length} semana(s) estructuradas.\n` +
      `🛡️ Aplicaciones Fitosanitarias: ${recPlaguicidas.length} semana(s) planificadas.\n\n` +
      `Por favor revise el plan detallado para coordinar las labores con los encargados.`
    );
    const url = telefonoLimpio 
      ? `https://api.whatsapp.com/send?phone=${telefonoLimpio}&text=${texto}`
      : `https://api.whatsapp.com/send?text=${texto}`;
    window.open(url, '_blank');
  };

  // Enlace de Correo Oficial con copia a h7coordinador@gmail.com
  const handleEnviarCorreo = () => {
    const destinatario = productor.email || 'h7coordinador@gmail.com';
    const cc = 'h7coordinador@gmail.com';
    const asunto = encodeURIComponent(`Informe Técnico Agronómico - ${finca.nombre || 'Finca'} - Ing. Ricardo Barquero`);
    const cuerpo = encodeURIComponent(
      `Estimado(a) ${productor.nombre || 'Productor'}:\n\n` +
      `Adjunto encontrará el informe de asesoría agronómica correspondiente a la visita del ${visita.fecha} en ${finca.nombre || 'la finca'} (${lote.nombre || 'Lote evaluado'}).\n\n` +
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
            className="px-3 py-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold hover:bg-purple-100 transition flex items-center gap-1.5"
            title="Auditoría integral del informe"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Auditar con IA</span>
          </button>

          <button
            onClick={handleCompartirWhatsApp}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Enviar resumen por WhatsApp"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleEnviarCorreo}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
            title="Enviar por correo electrónico"
          >
            <Mail className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Correo</span>
          </button>

          <button
            onClick={handleDescargarPDF}
            disabled={generandoPdf}
            className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-extrabold transition flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{generandoPdf ? 'Generando...' : 'Descargar PDF'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CUERPO DEL INFORME TÉCNICO EDITORIAL (A4 PRINTABLE) */}
      {/* ========================================================= */}
      <div 
        ref={reportRef} 
        className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-300 shadow-xl max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 text-slate-900 font-sans"
      >
        {/* ENCABEZADO INSTITUCIONAL OFICIAL */}
        <div className="border-b-2 border-emerald-800 pb-5 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
                🌱
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 block">
                  COLEGIO DE INGENIEROS AGRÓNOMOS DE COSTA RICA
                </span>
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Ing. Agr. Ricardo Barquero Chacón
                </h1>
                <p className="text-xs font-semibold text-slate-600">
                  Colegiado Ordinario No. 5896 • Asesoría y Consultoría Agrícola
                </p>
                <p className="text-[11px] text-slate-500">
                  Tel: +506 8894-5662 • Coronado, San José, Costa Rica • h7coordinador@gmail.com
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                INFORME TÉCNICO DE VISITA
              </span>
              <div className="mt-1 text-xs font-bold text-slate-700">
                <span>Fecha: </span>
                <span className="text-slate-900">{visita.fecha || '2026-03-10'}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Folio: AGRO-CR-{visita.id?.slice(-5) || '001'}
              </div>
            </div>
          </div>
        </div>

        {/* RESUMEN EJECUTIVO DIRECTO PARA EL PRODUCTOR */}
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 mb-6">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-emerald-900 mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Guía Rápida para el Productor:</span>
          </h3>
          <p className="text-xs text-emerald-950 leading-relaxed">
            Estimado(a) <strong>{productor.nombre || 'Productor'}</strong>: En esta visita en <strong>{finca.nombre || 'la finca'}</strong> se evaluaron las condiciones agronómicas del lote <strong>{lote.nombre || 'Lote 1'}</strong> ({lote.cultivoNombre} - Variedad <em>{lote.variedad || 'Estándar'}</em>). Se registraron <strong>{hallazgos.length} hallazgos</strong> en campo. Siga minuciosamente las siguientes instrucciones de fertirriego y protección fitosanitaria para asegurar el rendimiento y sanidad del cultivo.
          </p>
        </div>

        {/* TABLA DE IDENTIFICACIÓN GENERAL */}
        <div className="mb-6">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2 pb-1 border-b border-slate-200 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">1</span>
            Datos Generales de la Asesoría y del Lote
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Productor / Cliente:</span>
              <strong className="text-slate-900 font-bold">{productor.nombre || 'N/A'}</strong>
              <span className="text-slate-500 block text-[10px] mt-0.5">{productor.telefono || ''}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Finca y Ubicación:</span>
              <strong className="text-slate-900 font-bold">{finca.nombre || 'N/A'}</strong>
              <span className="text-slate-500 block text-[10px] mt-0.5 truncate">{finca.ubicacion || 'Costa Rica'}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Lote y Área:</span>
              <strong className="text-slate-900 font-bold">{lote.nombre || 'Lote'}</strong>
              <span className="text-slate-500 block text-[10px] mt-0.5">{lote.area || 'N/A'}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Cultivo y Variedad:</span>
              <strong className="text-emerald-900 font-bold">{lote.cultivoNombre || 'N/A'}</strong>
              <span className="text-emerald-700 block text-[10px] mt-0.5 font-semibold">Var: {lote.variedad || 'Estándar'}</span>
            </div>
          </div>
        </div>

        {/* MONITOREO AGROCLIMÁTICO */}
        <div className="mb-6">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2 pb-1 border-b border-slate-200 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">2</span>
            Condiciones Agroclimáticas Registradas
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
              <span className="text-slate-500 block text-[10px]">Lluvia Acumulada 7 Días:</span>
              <strong className="text-blue-900 font-extrabold text-sm">{clima.lluviaAcumulada7Dias || 0} mm</strong>
              <span className="text-[10px] text-blue-700 block mt-0.5">
                {clima.lluviaAcumulada7Dias > 40 ? '⚠️ Alerta por humedad alta' : 'Nivel hídrico moderado'}
              </span>
            </div>
            <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
              <span className="text-slate-500 block text-[10px]">Temperatura en Visita:</span>
              <strong className="text-slate-900 font-bold">{clima.temperaturaActual || 18}°C</strong>
              <span className="text-[10px] text-slate-500 block mt-0.5">HR: {clima.humedadActual || 85}%</span>
            </div>
            <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
              <span className="text-slate-500 block text-[10px]">Presión de Enfermedades:</span>
              <strong className="text-amber-800 font-bold">
                {clima.lluviaAcumulada7Dias > 35 ? 'Alta (Botrytis / Oídio)' : 'Moderada'}
              </strong>
            </div>
            <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
              <span className="text-slate-500 block text-[10px]">Coordenadas GPS:</span>
              <strong className="text-slate-800 font-bold text-[11px] block truncate">
                {finca.gps?.lat ? `${finca.gps.lat}, ${finca.gps.lon}` : 'Coronado, San José'}
              </strong>
              <span className="text-[10px] text-slate-500">Alt: {finca.gps?.altitud || 1680} msnm</span>
            </div>
          </div>
        </div>

        {/* DIAGNÓSTICO FOTOGRÁFICO DE HALLAZGOS CON EDICIÓN PROFESIONAL */}
        <div className="mb-6">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-3 pb-1 border-b border-slate-200 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">3</span>
            Diagnóstico Visual de Hallazgos y Síntomas en Campo
          </h3>

          {hallazgos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hallazgos.map((h, idx) => (
                <div key={h.id || idx} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 flex flex-col shadow-xs">
                  {h.fotoAnotada ? (
                    <div className="h-48 sm:h-56 bg-slate-900 w-full overflow-hidden">
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
                        <span className="font-bold text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          {h.categoria}
                        </span>
                        <span className="font-bold text-[10px] text-red-700 bg-red-100 px-2 py-0.5 rounded">
                          Severidad: {h.severidad}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{h.titulo}</h4>
                      <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">{h.descripcion}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 block">Fecha de evaluación: {h.fecha}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border">
              No se adjuntaron hallazgos fotográficos en esta visita técnica.
            </p>
          )}
        </div>

        {/* PROGRAMA NUTRICIONAL Y FERTIRRIEGO (MULTIMODAL) */}
        <div className="mb-6">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-3 pb-1 border-b border-slate-200 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">4</span>
            Programa Nutricional: Fertirriego y Enmiendas por Semanas
          </h3>

          {recFertirriego.length > 0 ? (
            recFertirriego.map((semana, sIdx) => (
              <div key={sIdx} className="mb-4 bg-slate-50 rounded-2xl border border-slate-200 p-3.5 sm:p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <h4 className="font-extrabold text-xs sm:text-sm text-blue-950">
                    {semana.titulo || `Semana ${semana.semana}`}
                  </h4>
                  <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Alcance: {semana.alcance || 'Toda la Finca'}
                  </span>
                </div>

                {(semana.eventos || []).map((ev, eIdx) => (
                  <div key={eIdx} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2 text-xs shadow-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900 border-b pb-1">
                      <span className="flex items-center gap-1.5">
                        <span>{ev.modalidadIcono || '💧'}</span>
                        <span>{ev.nombreEvento || ev.modalidadNombre || ev.tipo}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        {ev.conductividadObjetivo && (
                          <span className="text-emerald-800 font-bold text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded">
                            CE: {ev.conductividadObjetivo}
                          </span>
                        )}
                        {ev.phObjetivo && (
                          <span className="text-blue-800 font-bold text-[11px] bg-blue-50 px-1.5 py-0.5 rounded">
                            pH: {ev.phObjetivo}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Si es Dosatron (Tanque A y B) */}
                    {ev.lineasTanqueA && ev.lineasTanqueB ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="border border-blue-200 rounded-lg p-2.5 bg-blue-50/30">
                          <span className="font-bold text-blue-900 block text-[11px] mb-1.5 border-b border-blue-100 pb-0.5">
                            🔵 TANQUE A (Calcio y Nitratos):
                          </span>
                          <div className="space-y-1">
                            {ev.lineasTanqueA.map((l, idx) => (
                              <div key={idx} className="flex justify-between border-b border-slate-100 py-0.5 text-xs">
                                <span className="text-slate-800 font-medium">{l.producto}</span>
                                <strong className="text-blue-900 shrink-0 ml-1">{l.dosis} {l.unidad}</strong>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="border border-amber-200 rounded-lg p-2.5 bg-amber-50/30">
                          <span className="font-bold text-amber-900 block text-[11px] mb-1.5 border-b border-amber-100 pb-0.5">
                            🟡 TANQUE B (Fósforo, Sulfatos y Micro):
                          </span>
                          <div className="space-y-1">
                            {ev.lineasTanqueB.map((l, idx) => (
                              <div key={idx} className="flex justify-between border-b border-slate-100 py-0.5 text-xs">
                                <span className="text-slate-800 font-medium">{l.producto}</span>
                                <strong className="text-amber-900 shrink-0 ml-1">{l.dosis} {l.unidad}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Modalidad de lista única (Tanque directo, Venturi, Inyección, Drench o Granular) */
                      <div className="pt-1">
                        <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          {(ev.productos || []).map((l, idx) => (
                            <div key={idx} className="flex justify-between border-b border-slate-200/60 py-1 text-xs last:border-b-0">
                              <div>
                                <span className="text-slate-900 font-bold">{l.producto}</span>
                                {l.aporte && <span className="text-slate-500 text-[10px] block">{l.aporte}</span>}
                              </div>
                              <strong className="text-emerald-900 font-black text-sm shrink-0 ml-2">
                                {l.dosis} {l.unidad}
                              </strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {ev.observacionesPie && (
                      <p className="text-[11px] text-slate-600 italic pt-1 border-t border-slate-100">
                        Nota de aplicación: {ev.observacionesPie}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border">
              No se han programado cuadros de fertirriego para esta visita.
            </p>
          )}
        </div>

        {/* PROGRAMA FITOSANITARIO FOLIAR Y ROTACIÓN FRAC / IRAC */}
        <div className="mb-6">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-3 pb-1 border-b border-slate-200 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center text-xs font-bold">5</span>
            Programa Fitosanitario Foliar y Estrategia FRAC / IRAC
          </h3>

          {recPlaguicidas.length > 0 ? (
            recPlaguicidas.map((semana, sIdx) => (
              <div key={sIdx} className="mb-4 bg-slate-50 rounded-2xl border border-slate-200 p-3.5 sm:p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <h4 className="font-extrabold text-xs sm:text-sm text-purple-950">
                    {semana.titulo || `Semana ${semana.semana}`}
                  </h4>
                  <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Alcance: {semana.alcance || 'Toda la Finca'}
                  </span>
                </div>

                {/* Si la semana no requiere aplicación */}
                {semana.sinAplicacion ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Sin Aplicación Fitosanitaria Requerida:</strong>
                      <span>
                        {semana.motivoSinAplicacion || 'Poblaciones por debajo del umbral de daño. Se mantiene monitoreo preventivo sin intervención química.'}
                      </span>
                    </div>
                  </div>
                ) : (
                  (semana.aplicaciones || []).map((app, aIdx) => (
                    <div key={aIdx} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2 text-xs shadow-xs">
                      <div className="flex items-center justify-between font-bold text-slate-900 border-b pb-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black text-white ${
                            app.tipoMezcla === 'fungicida_foliar' ? 'bg-emerald-700' : 'bg-purple-800'
                          }`}>
                            {app.tipoMezcla === 'fungicida_foliar' ? 'MEZCLA 1 (Fungicida + Foliar)' : 'MEZCLA 2 (Insecticida + Acaricida)'}
                          </span>
                          <span>{app.nombre}</span>
                        </div>
                        <span className="text-slate-600 font-semibold text-[11px]">Vol: {app.volumenTanque}</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[11px]">
                              <th className="py-1.5 px-2 font-bold w-12 text-center">Paso</th>
                              <th className="py-1.5 px-2 font-bold">Insumo Comercial</th>
                              <th className="py-1.5 px-2 font-bold">FRAC / IRAC</th>
                              <th className="py-1.5 px-2 font-bold text-right">Dosis</th>
                              <th className="py-1.5 px-2 font-bold">Objetivo / Blanco</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(app.ordenMezcla || []).map((l, idx) => (
                              <tr key={idx}>
                                <td className="py-1 px-2 text-center font-bold text-[10px] text-slate-500">
                                  {idx + 1}
                                </td>
                                <td className="py-1 px-2 font-bold text-slate-900">
                                  {l.producto}
                                </td>
                                <td className="py-1 px-2 font-bold text-indigo-700 text-[11px]">
                                  {l.fracIrac || 'N/A'}
                                </td>
                                <td className="py-1 px-2 font-black text-slate-900 text-right">
                                  {l.dosis}
                                </td>
                                <td className="py-1 px-2 text-slate-600 text-[11px]">
                                  {l.funcion || ''}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {app.observacionesPie && (
                        <p className="text-[11px] text-slate-600 italic pt-1 border-t border-slate-100">
                          Instrucción de aplicación: {app.observacionesPie}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border">
              No se han estructurado aplicaciones fitosanitarias en esta visita.
            </p>
          )}
        </div>

        {/* PIE DE FIRMA OFICIAL DEL INGENIERO AGRÓNOMO */}
        <div className="border-t-2 border-slate-300 pt-6 mt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left space-y-1">
              <div className="font-signature text-xl text-emerald-900 font-bold italic tracking-wide">
                Ricardo Barquero Chacón
              </div>
              <div className="w-48 h-0.5 bg-slate-400 mx-auto sm:mx-0"></div>
              <p className="text-xs font-bold text-slate-900">
                Ing. Agr. Ricardo Barquero Chacón
              </p>
              <p className="text-[11px] text-slate-600">
                Colegiado No. 5896 • Colegio de Ingenieros Agrónomos de CR
              </p>
              <p className="text-[10px] text-slate-500">
                Firma Técnica y Validación Profesional de Asesoría en Campo
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1 max-w-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                VALIDACIÓN OFICIAL
              </span>
              <p className="text-[11px] text-slate-600 leading-tight">
                Informe emitido conforme a las Buenas Prácticas Agrícolas (BPA) y legislación fitosanitaria de Costa Rica.
              </p>
              <div className="pt-1 text-[10px] text-slate-400 font-mono">
                REG-CR: 5896 • {visita.fecha || '2026-03-10'}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
