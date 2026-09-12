import React, { useRef, useState } from 'react';
import { 
  FileText, Download, Share2, Mail, CheckCircle2, Phone, 
  MapPin, Calendar, CloudRain, Droplet, ShieldAlert, Sparkles, 
  Printer, ArrowRight, UserCheck, AlertTriangle, Check, Filter,
  Building2, Layers, FolderOpen, Thermometer, Activity, Compass,
  Sliders, ShieldCheck, Sun, Info, Paperclip, X
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { crAgroDatabase } from '../data/crAgroDatabase';
import { storageService } from '../services/storageService';

export default function ReportModule({ visita, onOpenAi }) {
  const reportRef = useRef(null);
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [mensajeEstado, setMensajeEstado] = useState('');
  const [guardadoEnExpediente, setGuardadoEnExpediente] = useState(false);
  const [modalDescargaInfo, setModalDescargaInfo] = useState({ abierto: false, archivo: '', destino: '' });
  
  // Filtro de alcance para el reporte (Toda la Finca o Lote Específico)
  const [filtroLote, setFiltroLote] = useState('todos');
  const [vistaModo, setVistaModo] = useState('digital'); // 'digital' (Móvil/WhatsApp) o 'documento' (A4 Oficial)
  const [copiadoWhatsapp, setCopiadoWhatsapp] = useState(false);
  const perfilIngeniero = storageService.getPerfilIngeniero();

  const productor = visita.productor || {};
  const finca = visita.finca || {};
  const lote = visita.lote || {};
  const clima = visita.clima || {};
  
  // Obtener todos los lotes de la finca para el selector de filtro
  const clientes = storageService.getClientes();
  const clienteActual = clientes.find(c => c.id === visita.clienteId);
  const fincaActual = clienteActual?.fincas?.find(f => f.id === finca.id);
  const lotesDeFinca = fincaActual?.lotes || [lote].filter(Boolean);

  // Estadísticas climáticas acumuladas de la finca
  const estadisticasClima = storageService.getEstadisticasClimaClienteFinca(visita.clienteId, finca.id);

  // Mediciones de suelo en campo
  const medicionesSuelo = (visita.medicionesSuelo || []).filter(m => m.estadoAprobacion !== 'eliminado');
  const cultivoDef = crAgroDatabase.cultivos.find(c => c.id === lote.cultivoId || c.nombre.toLowerCase() === (lote.cultivoNombre || '').toLowerCase()) || crAgroDatabase.cultivos[0];

  // Análisis epidemiológico
  const analisisEpidemiologico = visita.analisisEpidemiologico || {};

  // Filtrado de hallazgos
  const todosHallazgos = visita.hallazgos || [];
  const hallazgosFiltrados = filtroLote === 'todos'
    ? todosHallazgos
    : todosHallazgos.filter(h => !h.loteId || h.loteId === filtroLote || h.loteNombre === filtroLote);

  // Filtrado de recomendaciones de fertirriego
  const todasRecFertirriego = visita.recomendacionesFertirriego || [];
  const recFertirriegoFiltradas = todasRecFertirriego.map(semana => {
    if (filtroLote === 'todos') return semana;
    const eventosFiltrados = (semana.eventos || []).filter(ev => 
      !ev.alcance || ev.alcance === 'Toda la Finca' || ev.alcance.includes(filtroLote)
    );
    return { ...semana, eventos: eventosFiltrados };
  }).filter(semana => semana.eventos && semana.eventos.length > 0);

  // Filtrado de recomendaciones de plaguicidas
  const todasRecPlaguicidas = visita.recomendacionesPlaguicidas || [];
  const recPlaguicidasFiltradas = todasRecPlaguicidas.map(semana => {
    if (filtroLote === 'todos') return semana;
    const appsFiltradas = (semana.aplicaciones || []).filter(app => 
      !app.alcance || app.alcance === 'Toda la Finca' || app.alcance.includes(filtroLote)
    );
    return { ...semana, aplicaciones: appsFiltradas };
  }).filter(semana => semana.sinAplicacion || (semana.aplicaciones && semana.aplicaciones.length > 0));

  // Generar Blob y File del PDF asegurando captura completa aún si está en vista digital
  const generarPdfBlobYArchivo = async () => {
    if (!reportRef.current) return null;
    const element = reportRef.current;

    const estabaOculto = element.classList.contains('hidden');
    if (estabaOculto) {
      element.classList.remove('hidden');
      element.style.position = 'fixed';
      element.style.left = '-9999px';
      element.style.top = '0';
      element.style.width = '1024px';
      element.style.display = 'block';
    }

    try {
      // Esperar brevemente para layout y render de fuentes/imágenes
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 2, // 2x DPI para nitidez editorial y legibilidad de tablas
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1024
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Página 1
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      // Páginas adicionales si el informe es extenso
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      const nombreLoteStr = filtroLote === 'todos' ? 'Consolidado' : filtroLote.replace(/\s+/g, '_');
      const fincaLimpia = (finca.nombre || 'Finca').replace(/\s+/g, '_');
      const fileName = `Informe_${fincaLimpia}_${nombreLoteStr}_${visita.fecha || '2026'}.pdf`;

      const pdfBlob = pdf.output('blob');
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      return { pdf, pdfBlob, pdfFile, fileName };
    } finally {
      if (estabaOculto) {
        element.classList.add('hidden');
        element.style.position = '';
        element.style.left = '';
        element.style.top = '';
        element.style.width = '';
        element.style.display = '';
      }
    }
  };

  // Guardar reporte en el expediente del cliente
  const handleGuardarEnExpediente = () => {
    const nuevoReporte = {
      id: 'rep-' + Date.now(),
      visitaId: visita.id,
      clienteId: visita.clienteId,
      fincaId: finca.id,
      fincaNombre: finca.nombre || 'Finca Principal',
      productorNombre: productor.nombre || 'Cliente',
      fecha: visita.fecha || new Date().toISOString().split('T')[0],
      cultivoNombre: lote.cultivoNombre || 'Cultivo',
      alcance: filtroLote === 'todos' ? 'Toda la Finca' : `Lote: ${filtroLote}`,
      hallazgosCount: hallazgosFiltrados.length,
      fertirriegoCount: recFertirriegoFiltradas.length,
      plaguicidasCount: recPlaguicidasFiltradas.length,
      medicionesSueloCount: medicionesSuelo.length,
      resumenWhatsApp: generarTextoCompletoWhatsApp()
    };
    storageService.guardarReporteEnExpediente(visita.clienteId, nuevoReporte);
    setGuardadoEnExpediente(true);
    setTimeout(() => setGuardadoEnExpediente(false), 3500);
  };

  // Imprimir nativo con alta calidad (Vectorial y sin cortes)
  const handleImprimirNativo = () => {
    window.print();
  };

  // Descargar PDF al dispositivo
  const handleDescargarPDF = async () => {
    setGenerandoPdf(true);
    setMensajeEstado('Generando y descargando archivo PDF...');
    try {
      const res = await generarPdfBlobYArchivo();
      if (res) {
        res.pdf.save(res.fileName);
      }
    } catch (e) {
      console.error('Error generando PDF:', e);
      window.print();
    } finally {
      setGenerandoPdf(false);
      setMensajeEstado('');
    }
  };

  // COMPARTIR NATIVO: Abre el selector del sistema (iOS / Android) con el PDF ADJUNTO
  const handleCompartirPDFNativo = async () => {
    setGenerandoPdf(true);
    setMensajeEstado('Preparando archivo PDF para adjuntar...');
    try {
      const res = await generarPdfBlobYArchivo();
      if (!res) return;
      const { pdf, pdfFile, fileName } = res;

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `Informe Agronómico - ${finca.nombre || 'Finca'}`,
          text: `Estimado(a) ${productor.nombre || 'Productor'}: Adjunto informe técnico oficial de la visita del ${visita.fecha}.`
        });
      } else {
        // Fallback para computadoras u otros navegadores
        pdf.save(fileName);
        setModalDescargaInfo({
          abierto: true,
          archivo: fileName,
          destino: 'general'
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error compartiendo PDF:', err);
        alert('No se pudo abrir el selector para compartir: ' + err.message);
      }
    } finally {
      setGenerandoPdf(false);
      setMensajeEstado('');
    }
  };

  // WHATSAPP CON PDF: Comparte el archivo PDF directamente por WhatsApp
  const handleCompartirWhatsAppConPDF = async () => {
    setGenerandoPdf(true);
    setMensajeEstado('Preparando informe PDF para WhatsApp...');
    try {
      const res = await generarPdfBlobYArchivo();
      if (!res) return;
      const { pdf, pdfFile, fileName } = res;

      const telefonoLimpio = (productor.telefono || '').replace(/[^0-9]/g, '');
      const textoMensaje = generarTextoCompletoWhatsApp();

      // En móviles que soportan compartir archivos nativamente (iOS / Android)
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `Informe Agronómico - ${finca.nombre || 'Finca'}`,
          text: `🌱 *AGROASESOR PRO CR - INFORME OFICIAL*\nProductor: ${productor.nombre}\nFinca: ${finca.nombre} (${visita.fecha})\n\nAdjunto el informe técnico completo en documento PDF.`
        });
      } else {
        // En PC o navegador web: descargar el PDF y abrir la conversación de WhatsApp
        pdf.save(fileName);
        await navigator.clipboard.writeText(textoMensaje).catch(() => {});

        const url = telefonoLimpio 
          ? `https://api.whatsapp.com/send?phone=${telefonoLimpio}&text=${encodeURIComponent(textoMensaje)}`
          : `https://api.whatsapp.com/send?text=${encodeURIComponent(textoMensaje)}`;
        window.open(url, '_blank');

        setModalDescargaInfo({
          abierto: true,
          archivo: fileName,
          destino: 'whatsapp'
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error enviando por WhatsApp:', err);
      }
    } finally {
      setGenerandoPdf(false);
      setMensajeEstado('');
    }
  };

  // CORREO CON PDF: Comparte el archivo PDF directamente por Correo
  const handleEnviarCorreoConPDF = async () => {
    setGenerandoPdf(true);
    setMensajeEstado('Preparando informe PDF para Correo...');
    try {
      const res = await generarPdfBlobYArchivo();
      if (!res) return;
      const { pdf, pdfFile, fileName } = res;

      const destinatario = productor.email || 'h7coordinador@gmail.com';
      const cc = 'h7coordinador@gmail.com';
      const asunto = `Informe Agronómico Oficial - ${finca.nombre || 'Finca'} - Ing. Ricardo Barquero`;
      const cuerpo = `Estimado(a) ${productor.nombre || 'Productor'}:\n\n` +
        `Adjunto el informe de asesoría agronómica correspondiente a la visita del ${visita.fecha} en la finca ${finca.nombre || ''}.\n\n` +
        `Atentamente,\n` +
        `Ing. Agr. Ricardo Manuel Barquero Chacón\n` +
        `Colegiado No. 5896 • Ingeniero Agrónomo\n` +
        `Tel: +506 8894-5662 | Coronado, San José, Costa Rica`;

      // En móviles con soporte de archivos nativos
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: asunto,
          text: cuerpo
        });
      } else {
        // En PC: descargar el archivo PDF y abrir el correo
        pdf.save(fileName);
        window.location.href = `mailto:${destinatario}?cc=${cc}&subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;

        setModalDescargaInfo({
          abierto: true,
          archivo: fileName,
          destino: 'correo'
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error enviando por correo:', err);
      }
    } finally {
      setGenerandoPdf(false);
      setMensajeEstado('');
    }
  };

  // Generar texto completo y estructurado para WhatsApp
  const generarTextoCompletoWhatsApp = () => {
    const loteTexto = filtroLote === 'todos' ? 'Toda la Finca' : `Lote: ${filtroLote}`;
    let msg = `🌱 *AGROASESOR PRO CR - INFORME TÉCNICO OFICIAL*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👨‍🌾 *Productor:* ${productor.nombre || 'Cliente'}\n`;
    msg += `🏡 *Finca:* ${finca.nombre || 'Finca'} (${loteTexto})\n`;
    msg += `📅 *Fecha:* ${visita.fecha || 'Hoy'} • ${visita.hora || ''}\n`;
    msg += `🌱 *Cultivo:* ${lote.cultivoNombre || 'Cultivo'} (Var: ${lote.variedad || 'Estándar'})\n`;
    msg += `🌧️ *Lluvia 7 días:* ${clima.lluviaAcumulada7Dias || 0} mm • *HR:* ${clima.humedadActual || 85}% • *Temp:* ${clima.temperaturaActual || 18}°C\n`;
    msg += `👨‍💼 *Asesor:* Ing. Agr. Ricardo M. Barquero Chacón (Col. 5896)\n\n`;

    // Clima acumulado
    if (estadisticasClima && estadisticasClima.totalVisitas > 1) {
      msg += `📊 *CLIMA ACUMULADO FINCA (${estadisticasClima.totalVisitas} visitas):*\n`;
      msg += `• Lluvia acumulada: *${estadisticasClima.lluviaTotalAcumulada} mm*\n`;
      msg += `• Promedio HR: *${estadisticasClima.promedioHumedadRelativa}%* • Temp Prom: *${estadisticasClima.promedioTemperatura}°C*\n\n`;
    }

    // Mediciones de Suelo
    if (medicionesSuelo.length > 0) {
      msg += `🧪 *MEDICIONES DE SUELO EN CAMPO:*
`;
      medicionesSuelo.forEach(m => {
        msg += `• [${m.loteNombre || 'Lote'}] pH: *${m.phSuelo}* | CE: *${m.ceSuelo} mS/cm* | Temp: *${m.tempSuelo}°C* | Hum: *${m.humedadSuelo}*\n`;
        if (m.ajusteRecomendado) {
          msg += `  ↳ _Ajuste:_ ${m.ajusteRecomendado}\n`;
        }
      });
      msg += `
`;
    }

    // Análisis Epidemiológico El Niño
    if (analisisEpidemiologico.elNinoImpacto) {
      msg += `🌦️ *EPIDEMIOLOGÍA (FENÓMENO EL NIÑO):*\n`;
      msg += `• Impacto: ${analisisEpidemiologico.elNinoImpacto}\n`;
      msg += `• Prevención suelo: ${analisisEpidemiologico.hongosSuelo || 'Monitoreo Phytophthora/Pythium'}\n`;
      msg += `• Prevención foliar: ${analisisEpidemiologico.hongosFoliares || 'Control preventivo Botrytis/Oídio'}\n\n`;
    }

    // Hallazgos
    if (hallazgosFiltrados.length > 0) {
      msg += `🔍 *DIAGNÓSTICO Y HALLAZGOS (${hallazgosFiltrados.length}):*\n`;
      hallazgosFiltrados.forEach((h) => {
        msg += `• [${h.severidad}] *${h.titulo}* (${h.categoria})\n  _${h.descripcion || 'Sin observaciones adicionales'}_\n`;
      });
      msg += `\n`;
    }

    // Fertirriego / Nutrición
    if (recFertirriegoFiltradas.length > 0) {
      msg += `💧 *NUTRICIÓN Y FERTIRRIEGO:*\n`;
      recFertirriegoFiltradas.forEach(s => {
        msg += `*Semana ${s.semana}:*\n`;
        (s.eventos || []).forEach(ev => {
          msg += `▸ _${ev.nombreEvento || ev.nombre || 'Fertirriego'}_ (${ev.alcance || 'Finca'})\n`;
          if (ev.lineasTanqueA?.length > 0) {
            msg += `  🔵 *Tanque A:* ` + ev.lineasTanqueA.map(l => `${l.producto} (${l.dosis} ${l.unidad})`).join(', ') + `\n`;
          }
          if (ev.lineasTanqueB?.length > 0) {
            msg += `  🟡 *Tanque B:* ` + ev.lineasTanqueB.map(l => `${l.producto} (${l.dosis} ${l.unidad})`).join(', ') + `\n`;
          }
          if (ev.productos?.length > 0) {
            msg += `  • *Insumos:* ` + ev.productos.map(l => `${l.producto} (${l.dosis} ${l.unidad})`).join(', ') + `\n`;
          }
        });
      });
      msg += `\n`;
    }

    // Fitosanitarios
    if (recPlaguicidasFiltradas.length > 0) {
      msg += `🛡️ *MANEJO FITOSANITARIO SEGREGADO:*\n`;
      recPlaguicidasFiltradas.forEach(s => {
        msg += `*Semana ${s.semana}:*\n`;
        if (s.sinAplicacion) {
          msg += `  ✅ *Semana sin aplicación fitosanitaria:* Monitoreo preventivo.\n`;
        } else {
          (s.aplicaciones || []).forEach(app => {
            msg += `▸ *${app.nombre}* [${app.volumenTanque}]:\n`;
            (app.ordenMezcla || []).forEach(l => {
              msg += `  ${l.orden}. ${l.producto} - *${l.dosis}* (${l.fracIrac || l.tipo})\n`;
            });
          });
        }
      });
      msg += `\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `_Emitido bajo criterio agronómico profesional del Ing. Ricardo Manuel Barquero Chacón._`;
    return msg;
  };

  // Copiar formato completo para WhatsApp
  const handleCopiarTextoWhatsApp = async () => {
    const texto = generarTextoCompletoWhatsApp();
    try {
      await navigator.clipboard.writeText(texto);
      setCopiadoWhatsapp(true);
      setTimeout(() => setCopiadoWhatsapp(false), 3000);
    } catch (e) {
      alert('Texto generado para WhatsApp:\n\n' + texto);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* SELECTOR DE FORMATO DE VISTA (MÓVIL DIGITAL VS DOCUMENTO A4) */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1 no-print">
        <button
          onClick={() => setVistaModo('digital')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            vistaModo === 'digital'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>📱 Vista Digital para Teléfono (WhatsApp)</span>
        </button>
        <button
          onClick={() => setVistaModo('documento')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            vistaModo === 'documento'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>📄 Vista Documento Oficial (A4 / PDF)</span>
        </button>
      </div>

      {/* BARRA DE ACCIONES Y FILTRO SUPERIOR */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" />
            <span>{vistaModo === 'digital' ? 'Informe Digital para el Productor' : 'Informe Oficial de Finca (A4)'}</span>
          </h2>
          <p className="text-xs text-slate-500">
            {vistaModo === 'digital' ? 'Diseñado para lectura ágil en teléfono celular y envío directo con PDF adjunto.' : 'Formato de página completa homologado para exportar a PDF e imprimir.'}
          </p>
        </div>

        {/* Selector de Alcance del Reporte y Botones de Acción */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-bold text-slate-700">Ver reporte de:</span>
            <select
              value={filtroLote}
              onChange={(e) => setFiltroLote(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2 py-0.5 font-bold text-emerald-800 outline-none"
            >
              <option value="todos">Toda la Finca ({finca.nombre || 'Finca'})</option>
              {lotesDeFinca.map(l => (
                <option key={l.id} value={l.nombre}>
                  Lote: {l.nombre} ({l.cultivoNombre || ''})
                </option>
              ))}
            </select>
          </div>

          {/* Botón Principal: Compartir PDF Nativo Adjunto */}
          <button
            onClick={handleCompartirPDFNativo}
            disabled={generandoPdf}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
            title="Compartir el informe en PDF como archivo adjunto por WhatsApp, Correo o Guardar en Archivos"
          >
            <Paperclip className="w-4 h-4" />
            <span>📲 Compartir PDF</span>
          </button>

          {/* Botón WhatsApp con PDF */}
          <button
            onClick={handleCompartirWhatsAppConPDF}
            disabled={generandoPdf}
            className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95 disabled:opacity-50"
            title="Enviar informe PDF adjunto por WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>WhatsApp + PDF</span>
          </button>

          {/* Botón Correo con PDF */}
          <button
            onClick={handleEnviarCorreoConPDF}
            disabled={generandoPdf}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95 disabled:opacity-50"
            title="Enviar informe por Correo con PDF adjunto"
          >
            <Mail className="w-3.5 h-3.5 text-slate-700" />
            <span>Correo + PDF</span>
          </button>

          {/* Botón Guardar en Expediente */}
          <button
            onClick={handleGuardarEnExpediente}
            className="px-3 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
            title="Guardar este informe en el expediente permanente del productor"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>{guardadoEnExpediente ? '✅ Guardado' : '💾 Expediente'}</span>
          </button>

          {/* Botón Descargar PDF */}
          <button
            onClick={handleDescargarPDF}
            disabled={generandoPdf}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1 shadow-xs active:scale-95"
            title="Descargar archivo PDF al dispositivo"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Botón Imprimir */}
          <button
            onClick={handleImprimirNativo}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs active:scale-95"
            title="Imprimir o Guardar en PDF de forma nativa"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VISTA 1: DIGITAL MÓVIL PARA TELÉFONO Y WHATSAPP */}
      {/* ========================================================= */}
      {vistaModo === 'digital' && (
        <div className="space-y-4 max-w-2xl mx-auto">
          {/* Tarjeta Resumen Productor */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-4 sm:p-5 rounded-3xl shadow-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                Informe Digital para Móvil
              </span>
              <span className="text-xs font-bold text-emerald-200">{visita.fecha}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black">{productor.nombre || 'Productor'}</h3>
            <p className="text-xs text-emerald-100">
              Finca: <strong>{finca.nombre}</strong> • {lote.cultivoNombre} ({lote.variedad || 'Estándar'})
            </p>
            <div className="pt-2 border-t border-white/20 flex items-center justify-between text-xs">
              <span>🌧️ Lluvia 7d: <strong>{clima.lluviaAcumulada7Dias || 0} mm</strong></span>
              <span>Asesor: <strong>Ing. Ricardo Barquero (Col. 5896)</strong></span>
            </div>
          </div>

          {/* Botones Principales de Envío y Guardado */}
          <div className="space-y-2">
            {/* Botón Destacado: Compartir con PDF Adjunto (Abre WhatsApp/Mail nativo con el archivo adjunto) */}
            <button
              onClick={handleCompartirPDFNativo}
              disabled={generandoPdf}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-98 disabled:opacity-50"
            >
              <Paperclip className="w-4 h-4" />
              <span>📲 Compartir Reporte con PDF Adjunto (WhatsApp / Correo)</span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={handleCompartirWhatsAppConPDF}
                disabled={generandoPdf}
                className="py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs disabled:opacity-50"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>WhatsApp + PDF</span>
              </button>
              
              <button
                onClick={handleEnviarCorreoConPDF}
                disabled={generandoPdf}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs disabled:opacity-50"
              >
                <Mail className="w-3.5 h-3.5 text-slate-700" />
                <span>Correo + PDF</span>
              </button>

              <button
                onClick={handleGuardarEnExpediente}
                className="py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <FolderOpen className="w-3.5 h-3.5 text-purple-700" />
                <span>{guardadoEnExpediente ? '✅ Guardado' : '💾 Guardar Expediente'}</span>
              </button>
            </div>
          </div>

          {/* Tarjeta de Clima Acumulado y Análisis Epidemiológico */}
          {estadisticasClima && (
            <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs space-y-3">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-blue-700" />
                <span>Condiciones Climáticas y Epidemiología de la Finca</span>
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-blue-50 p-2 rounded-xl">
                  <span className="text-[10px] text-blue-700 block font-semibold">Lluvia Total</span>
                  <strong className="text-blue-950 font-black text-sm">{estadisticasClima.lluviaTotalAcumulada} mm</strong>
                </div>
                <div className="bg-blue-50 p-2 rounded-xl">
                  <span className="text-[10px] text-blue-700 block font-semibold">Humedad Prom.</span>
                  <strong className="text-blue-950 font-black text-sm">{estadisticasClima.promedioHumedadRelativa}%</strong>
                </div>
                <div className="bg-blue-50 p-2 rounded-xl">
                  <span className="text-[10px] text-blue-700 block font-semibold">Temp Prom.</span>
                  <strong className="text-blue-950 font-black text-sm">{estadisticasClima.promedioTemperatura}°C</strong>
                </div>
              </div>
              {analisisEpidemiologico.elNinoImpacto && (
                <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
                  <span className="font-bold block text-[11px]">🌦️ Impacto Fenómeno de El Niño:</span>
                  <p className="text-[11px] leading-relaxed">{analisisEpidemiologico.elNinoImpacto}</p>
                </div>
              )}
            </div>
          )}

          {/* Tarjeta de Mediciones de Suelo en Campo */}
          {medicionesSuelo.length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs space-y-3">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-700" />
                <span>Mediciones de Suelo en Campo ({medicionesSuelo.length})</span>
              </h4>
              <div className="space-y-2">
                {medicionesSuelo.map(m => (
                  <div key={m.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-emerald-900">{m.loteNombre || 'Lote Evaluado'}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Aprobado por Ing. Barquero
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-center py-1 bg-white rounded-lg border border-slate-100">
                      <div><span className="text-[10px] text-slate-500 block">pH:</span><strong>{m.phSuelo}</strong></div>
                      <div><span className="text-[10px] text-slate-500 block">CE:</span><strong>{m.ceSuelo}</strong></div>
                      <div><span className="text-[10px] text-slate-500 block">Temp:</span><strong>{m.tempSuelo}°C</strong></div>
                      <div><span className="text-[10px] text-slate-500 block">Humedad:</span><strong>{m.humedadSuelo}</strong></div>
                    </div>
                    {m.ajusteRecomendado && (
                      <p className="text-[11px] text-slate-700 leading-tight pt-1">
                        <strong className="text-slate-900">Ajuste:</strong> {m.ajusteRecomendado}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hallazgos Fotográficos en Tarjetas Verticales */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">
              Hallazgos de Campo con Fotos Anotadas ({hallazgosFiltrados.length})
            </h4>
            {hallazgosFiltrados.map((h, idx) => (
              <div key={h.id || idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                {h.fotoAnotada ? (
                  <div className="w-full bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-200">
                    <img src={h.fotoAnotada} alt={h.titulo} className="w-full h-56 object-cover" />
                  </div>
                ) : null}
                <div className="p-3.5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      {h.categoria}
                    </span>
                    <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                      Severidad: {h.severidad}
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm">{h.titulo}</h5>
                  <p className="text-slate-600 leading-relaxed">{h.descripcion}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Cuadros de Fertirriego en Tarjetas */}
          {recFertirriegoFiltradas.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">
                Nutrición y Fertirriego Prescrito
              </h4>
              {recFertirriegoFiltradas.map(s => (
                <div key={s.semana} className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs space-y-2 text-xs">
                  <span className="font-extrabold text-blue-900 block">Semana {s.semana}</span>
                  {(s.eventos || []).map((ev, i) => (
                    <div key={i} className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 space-y-1.5">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>{ev.nombreEvento || ev.nombre || 'Fertirriego'}</span>
                        <span className="text-blue-700 font-semibold">{ev.alcance || 'Finca'}</span>
                      </div>
                      {ev.lineasTanqueA?.length > 0 && (
                        <div>
                          <strong className="text-blue-900 block text-[11px]">🔵 Tanque A:</strong>
                          <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                            {ev.lineasTanqueA.map((l, li) => (
                              <li key={li}>{l.producto}: <strong>{l.dosis} {l.unidad}</strong></li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {ev.lineasTanqueB?.length > 0 && (
                        <div>
                          <strong className="text-amber-900 block text-[11px]">🟡 Tanque B:</strong>
                          <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                            {ev.lineasTanqueB.map((l, li) => (
                              <li key={li}>{l.producto}: <strong>{l.dosis} {l.unidad}</strong></li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {ev.productos?.length > 0 && (
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                          {ev.productos.map((l, li) => (
                            <li key={li}>{l.producto}: <strong>{l.dosis} {l.unidad}</strong></li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Aplicaciones Fitosanitarias en Tarjetas */}
          {recPlaguicidasFiltradas.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">
                Manejo Fitosanitario Segregado
              </h4>
              {recPlaguicidasFiltradas.map(s => (
                <div key={s.semana} className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs space-y-2 text-xs">
                  <span className="font-extrabold text-purple-900 block">Semana {s.semana}</span>
                  {s.sinAplicacion ? (
                    <p className="text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 font-semibold">
                      ✅ No requiere aplicaciones químicas esta semana. Mantener monitoreo preventivo.
                    </p>
                  ) : (
                    (s.aplicaciones || []).map((app, i) => (
                      <div key={i} className="bg-purple-50/50 p-2.5 rounded-xl border border-purple-100 space-y-1.5">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>{app.nombre}</span>
                          <span className="text-purple-700 font-semibold">{app.volumenTanque}</span>
                        </div>
                        <ol className="list-decimal pl-4 space-y-0.5 text-slate-700">
                          {(app.ordenMezcla || []).map((l, li) => (
                            <li key={li}>
                              <strong>{l.producto}</strong> — {l.dosis} ({l.fracIrac || l.tipo})
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA 2: HOJA DE REPORTE EDITORIAL (HOMOLOGADA PANTALLA Y PDF) */}
      {/* ========================================================= */}
      <div 
        ref={reportRef} 
        className={`report-sheet bg-white p-5 sm:p-8 rounded-3xl border border-slate-300 shadow-xl max-w-4xl mx-auto text-slate-900 font-sans ${vistaModo === 'documento' ? 'block' : 'hidden print:block'}`}
      >
        {/* ENCABEZADO OFICIAL CON NOMBRE DEL PROFESIONAL (SIN ENCABEZADOS DEL COLEGIO) */}
        <div className="border-b-2 border-emerald-800 pb-5 mb-6 print-avoid-break">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
                🌱
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 block">
                  ASESORÍA TÉCNICA AGRONÓMICA PROFESIONAL
                </span>
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Ing. Agr. Ricardo M. Barquero Chacón
                </h1>
                <p className="text-xs font-semibold text-slate-700">
                  Ingeniero Agrónomo • Colegiado No. 5896
                </p>
                <p className="text-[11px] text-slate-500">
                  Tel: {perfilIngeniero.telefono || '+506 8894-5662'} • {perfilIngeniero.ubicacion || 'Coronado, San José, Costa Rica'} • {perfilIngeniero.email || 'h7coordinador@gmail.com'}
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

        {/* RESUMEN PARA EL PRODUCTOR */}
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 mb-6 print-avoid-break">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-emerald-900 mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Guía de Trabajo para el Productor:</span>
          </h3>
          <p className="text-xs text-emerald-950 leading-relaxed">
            Estimado(a) <strong>{productor.nombre || 'Productor'}</strong>: Presento el informe agronómico correspondiente a la visita técnica en la finca <strong>{finca.nombre || 'la finca'}</strong>. 
            {filtroLote !== 'todos' ? ` Este informe consolida la evaluación del lote ${filtroLote}.` : ' Este reporte consolida la valoración integral de la finca y sus lotes.'} 
            Se documentaron <strong>{hallazgosFiltrados.length} hallazgos</strong> en campo y se detallan las mediciones analíticas de suelo, manejo hídrico y las prescripciones nutricionales y fitosanitarias requeridas.
          </p>
        </div>

        {/* 1. DATOS GENERALES DE LA ASESORÍA */}
        <div className="mb-6 print-avoid-break">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2 pb-1 border-b border-slate-200 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">1</span>
            Datos Generales de la Asesoría
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Productor / Cliente:</span>
              <strong className="text-slate-900 font-bold">{productor.nombre || 'N/A'}</strong>
              <span className="text-slate-500 block text-[10px] mt-0.5">{productor.telefono || ''}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Finca Evaluada:</span>
              <strong className="text-slate-900 font-bold">{finca.nombre || 'N/A'}</strong>
              <span className="text-slate-500 block text-[10px] mt-0.5 truncate">{finca.ubicacion || 'Costa Rica'}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Alcance del Reporte:</span>
              <strong className="text-slate-900 font-bold">
                {filtroLote === 'todos' ? 'Toda la Finca' : filtroLote}
              </strong>
              <span className="text-slate-500 block text-[10px] mt-0.5">{lote.area || 'N/A'}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Cultivo y Variedad:</span>
              <strong className="text-emerald-900 font-bold">{lote.cultivoNombre || 'N/A'}</strong>
              <span className="text-emerald-700 block text-[10px] mt-0.5 font-semibold">Var: {lote.variedad || 'Estándar'}</span>
            </div>
          </div>
        </div>

        {/* 2. CONDICIONES AGROCLIMÁTICAS Y ESTADÍSTICA ACUMULADA DE LA FINCA */}
        <div className="mb-6 print-avoid-break">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2 pb-1 border-b border-slate-200 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">2</span>
            Condiciones Agroclimáticas Registradas y Acumuladas
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
            <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
              <span className="text-slate-500 block text-[10px]">Lluvia Visita (7 Días):</span>
              <strong className="text-blue-900 font-extrabold text-sm">{clima.lluviaAcumulada7Dias || 0} mm</strong>
              <span className="text-[10px] text-blue-700 block mt-0.5">
                {clima.lluviaAcumulada7Dias > 40 ? '⚠️ Humedad alta' : 'Régimen normal'}
              </span>
            </div>
            <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
              <span className="text-slate-500 block text-[10px]">Temperatura en Visita:</span>
              <strong className="text-slate-900 font-bold">{clima.temperaturaActual || 18}°C</strong>
              <span className="text-[10px] text-slate-500 block mt-0.5">HR: {clima.humedadActual || 85}%</span>
            </div>
            <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
              <span className="text-slate-500 block text-[10px]">Lluvia Acumulada Histórica:</span>
              <strong className="text-blue-950 font-bold text-sm">
                {estadisticasClima ? `${estadisticasClima.lluviaTotalAcumulada} mm` : `${clima.lluviaAcumulada7Dias || 0} mm`}
              </strong>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {estadisticasClima ? `${estadisticasClima.totalVisitas} visitas registradas` : '1 visita'}
              </span>
            </div>
            <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
              <span className="text-slate-500 block text-[10px]">Coordenadas GPS / Altitud:</span>
              <strong className="text-slate-800 font-bold text-[11px] block truncate">
                {finca.gps?.lat ? `${finca.gps.lat}, ${finca.gps.lon}` : 'Coronado, San José'}
              </strong>
              <span className="text-[10px] text-slate-500">Altitud: {finca.gps?.altitud || 1680} msnm</span>
            </div>
          </div>

          {/* Panel de Análisis Epidemiológico (Fenómeno de El Niño) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1">
              <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                Análisis Epidemiológico Clima + Plagas/Hongos (Fenómeno de El Niño)
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                Validado por el Agrónomo
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="bg-white p-2 rounded-xl border border-slate-100 space-y-0.5">
                <strong className="text-amber-900 block text-[10px] uppercase font-black">Hongos de Suelo</strong>
                <p className="text-slate-700">{analisisEpidemiologico.hongosSuelo || 'Monitoreo de Phytophthora, Pythium y Rhizoctonia con aireación del suelo y enraizadores.'}</p>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-100 space-y-0.5">
                <strong className="text-amber-900 block text-[10px] uppercase font-black">Hongos Foliares</strong>
                <p className="text-slate-700">{analisisEpidemiologico.hongosFoliares || 'Control preventivo de Botrytis cinerea y Oídio ante alta humedad relativa o condensación.'}</p>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-100 space-y-0.5">
                <strong className="text-amber-900 block text-[10px] uppercase font-black">Insectos y Ácaros</strong>
                <p className="text-slate-700">{analisisEpidemiologico.plagasInsectosAcaros || 'Monitoreo estricto de ácaros (Tetranychus) y trips favorecidos por microclima templado.'}</p>
              </div>
            </div>
            <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-200 text-[11px] text-emerald-950">
              <strong>Estrategia de Control Preventivo: </strong> 
              {analisisEpidemiologico.controlesNutricionales || 'Aplicación de Silicio y Fosfitos de Potasio para fortalecer la pared celular, balance de Calcio y Boro y deshoje sanitario.'}
            </div>
          </div>
        </div>

        {/* 3. MEDICIONES DE CAMPO DE SUELO Y SUSTRATO */}
        {medicionesSuelo.length > 0 && (
          <div className="mb-6 print-avoid-break">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2 pb-1 border-b border-slate-200 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">3</span>
              Mediciones de Suelo y Sustrato en Campo
            </h3>

            <div className="space-y-3">
              {medicionesSuelo.map((m, idx) => (
                <div key={m.id || idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span className="font-extrabold text-slate-900">
                      📍 {m.loteNombre || 'Lote Evaluado'} — {m.metodo || 'Sonda directa'}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Aprobado por el Ing. Agr. Ricardo Barquero
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 text-[11px]">
                          <th className="py-1.5 px-3 font-bold">Parámetro</th>
                          <th className="py-1.5 px-3 font-bold text-center">Valor Medido en Campo</th>
                          <th className="py-1.5 px-3 font-bold text-center">Rango Óptimo ({cultivoDef.nombre})</th>
                          <th className="py-1.5 px-3 font-bold">Evaluación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="py-1.5 px-3 font-medium text-slate-800">pH del Suelo / Sustrato</td>
                          <td className="py-1.5 px-3 text-center font-black text-slate-900">{m.phSuelo}</td>
                          <td className="py-1.5 px-3 text-center text-slate-600">{cultivoDef.rangoPh || '5.5 - 6.5'}</td>
                          <td className="py-1.5 px-3 font-semibold text-emerald-700">
                            {parseFloat(m.phSuelo) >= 5.5 && parseFloat(m.phSuelo) <= 6.5 ? 'Dentro de rango' : 'Requiere calibración'}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 font-medium text-slate-800">Conductividad Eléctrica (CE)</td>
                          <td className="py-1.5 px-3 text-center font-black text-slate-900">{m.ceSuelo} mS/cm</td>
                          <td className="py-1.5 px-3 text-center text-slate-600">{cultivoDef.rangoCe || '1.2 - 1.8 mS/cm'}</td>
                          <td className="py-1.5 px-3 font-semibold text-emerald-700">
                            {parseFloat(m.ceSuelo) >= 1.0 && parseFloat(m.ceSuelo) <= 2.0 ? 'Salinidad adecuada' : 'Ajustar conductividad'}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 font-medium text-slate-800">Temperatura del Suelo</td>
                          <td className="py-1.5 px-3 text-center font-black text-slate-900">{m.tempSuelo}°C</td>
                          <td className="py-1.5 px-3 text-center text-slate-600">{cultivoDef.rangoTempSuelo || '16 - 22 °C'}</td>
                          <td className="py-1.5 px-3 font-semibold text-emerald-700">Actividad radicular favorable</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 font-medium text-slate-800">Humedad en Rizósfera</td>
                          <td className="py-1.5 px-3 text-center font-black text-slate-900">{m.humedadSuelo}</td>
                          <td className="py-1.5 px-3 text-center text-slate-600">{cultivoDef.rangoHumedadSuelo || '60 - 80%'}</td>
                          <td className="py-1.5 px-3 font-semibold text-emerald-700">Adecuada capacidad de campo</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {m.ajusteRecomendado && (
                    <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 text-slate-800 text-[11px]">
                      <strong className="text-emerald-950 font-bold block mb-0.5">Ajuste y Recomendación Agronómica Aprobada:</strong>
                      <span>{m.ajusteRecomendado}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. DIAGNÓSTICO VISUAL DE HALLAZGOS (FOTOS CON PROPORCIÓN NATURAL) */}
        <div className="mb-6">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-3 pb-1 border-b border-slate-200 flex items-center gap-1.5 print-avoid-break">
            <span className="w-5 h-5 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">4</span>
            Diagnóstico Visual de Hallazgos y Síntomas en Campo ({hallazgosFiltrados.length})
          </h3>

          {hallazgosFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hallazgosFiltrados.map((h, idx) => (
                <div key={h.id || idx} className="finding-card print-avoid-break border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 flex flex-col shadow-xs">
                  {h.fotoAnotada ? (
                    <div 
                      className="w-full bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-200" 
                      style={{ minHeight: '190px', maxHeight: '240px' }}
                    >
                      <img 
                        src={h.fotoAnotada} 
                        alt={h.titulo} 
                        className="w-full h-56 object-cover block"
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
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1 border-t border-slate-200/60">
                      <span>Lote: {h.loteNombre || lote.nombre || 'Lote 1'}</span>
                      <span>{h.fecha}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border print-avoid-break">
              No se registraron hallazgos fitosanitarios para el alcance seleccionado.
            </p>
          )}
        </div>

        {/* 5. PROGRAMA NUTRICIONAL Y FERTIRRIEGO */}
        <div className="mb-6">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-3 pb-1 border-b border-slate-200 flex items-center gap-1.5 print-avoid-break">
            <span className="w-5 h-5 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">5</span>
            Programa Nutricional: Fertirriego y Enmiendas por Semanas
          </h3>

          {recFertirriegoFiltradas.length > 0 ? (
            recFertirriegoFiltradas.map((semana, sIdx) => (
              <div key={sIdx} className="event-card print-avoid-break mb-4 bg-slate-50 rounded-2xl border border-slate-200 p-3.5 sm:p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <h4 className="font-extrabold text-xs sm:text-sm text-blue-950">
                    {semana.titulo || `Semana ${semana.semana}`}
                  </h4>
                  <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Semana {semana.semana}
                  </span>
                </div>

                {(semana.eventos || []).map((ev, eIdx) => (
                  <div key={eIdx} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2 text-xs shadow-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900 border-b pb-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span>{ev.modalidadIcono || '💧'}</span>
                        <span>{ev.nombreEvento || ev.modalidadNombre || ev.tipo}</span>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {ev.alcance || 'Toda la Finca'}
                        </span>
                      </div>
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

                    {/* Dosatron (Tanque A y B) */}
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
                      /* Modalidad de lista única */
                      <div className="pt-1">
                        <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          {(ev.productos || []).map((l, idx) => (
                            <div key={idx} className="flex justify-between border-b border-slate-200/60 py-1 text-xs last:border-b-0">
                              <span className="text-slate-900 font-bold">{l.producto}</span>
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
                        Instrucción: {ev.observacionesPie}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border print-avoid-break">
              No se han programado cuadros de fertirriego para el alcance seleccionado.
            </p>
          )}
        </div>

        {/* 6. PROGRAMA FITOSANITARIO FOLIAR */}
        <div className="mb-6">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-3 pb-1 border-b border-slate-200 flex items-center gap-1.5 print-avoid-break">
            <span className="w-5 h-5 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center text-xs font-bold">6</span>
            Programa Fitosanitario Foliar y Estrategia FRAC / IRAC
          </h3>

          {recPlaguicidasFiltradas.length > 0 ? (
            recPlaguicidasFiltradas.map((semana, sIdx) => (
              <div key={sIdx} className="app-card print-avoid-break mb-4 bg-slate-50 rounded-2xl border border-slate-200 p-3.5 sm:p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <h4 className="font-extrabold text-xs sm:text-sm text-purple-950">
                    {semana.titulo || `Semana ${semana.semana}`}
                  </h4>
                  <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Semana {semana.semana}
                  </span>
                </div>

                {semana.sinAplicacion ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Sin Aplicación Fitosanitaria Requerida:</strong>
                      <span>
                        {semana.motivoSinAplicacion || 'Poblaciones por debajo del umbral de daño económico. Se mantiene monitoreo preventivo sin intervención química.'}
                      </span>
                    </div>
                  </div>
                ) : (
                  (semana.aplicaciones || []).map((app, aIdx) => (
                    <div key={aIdx} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2 text-xs shadow-xs">
                      <div className="flex items-center justify-between font-bold text-slate-900 border-b pb-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black text-white ${
                            app.tipoMezcla === 'fungicida_foliar' ? 'bg-emerald-700' : 'bg-purple-800'
                          }`}>
                            {app.tipoMezcla === 'fungicida_foliar' ? 'MEZCLA 1 (Fungicida + Foliar)' : 'MEZCLA 2 (Insecticida + Acaricida)'}
                          </span>
                          <span>{app.nombre}</span>
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                            {app.alcance || 'Toda la Finca'}
                          </span>
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
                          Instrucción: {app.observacionesPie}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border print-avoid-break">
              No se han estructurado aplicaciones fitosanitarias para el alcance seleccionado.
            </p>
          )}
        </div>

        {/* 7. FIRMA OFICIAL DEL INGENIERO AGRÓNOMO */}
        <div className="signature-block print-avoid-break border-t-2 border-slate-300 pt-6 mt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left space-y-1">
              <div className="text-xl text-emerald-900 font-bold italic tracking-wide">
                Ricardo M. Barquero Chacón
              </div>
              <div className="w-56 h-0.5 bg-slate-400 mx-auto sm:mx-0"></div>
              <p className="text-xs font-bold text-slate-900">
                Ing. Agr. Ricardo Manuel Barquero Chacón
              </p>
              <p className="text-[11px] text-slate-600">
                Ingeniero Agrónomo • Colegiado No. 5896
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

        {/* PIE LEGAL Y DERECHOS DE AUTOR */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 space-y-0.5 print-avoid-break">
          <p className="font-semibold text-slate-500">
            © 2026 <strong>Ricardo Manuel Barquero Chacón</strong>. Todos los derechos reservados.
          </p>
          <p>
            AgroAsesor Pro CR™ • Software agronómico bajo propiedad intelectual de Ricardo Manuel Barquero Chacón. Documento oficial de prescripción fitosanitaria y nutricional.
          </p>
        </div>

      </div>

      {/* ========================================================= */}
      {/* MODAL SPINNER DE GENERACIÓN DE PDF */}
      {/* ========================================================= */}
      {generandoPdf && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl flex items-center gap-4 border border-slate-200 max-w-sm w-full animate-slideUp">
            <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin shrink-0"></div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">{mensajeEstado || 'Generando informe PDF...'}</h4>
              <p className="text-xs text-slate-500 mt-0.5">Adjuntando fotos y cuadros técnicos en alta resolución.</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL INFORMATIVO PARA DESCARGA DE PDF EN PC / WEB */}
      {/* ========================================================= */}
      {modalDescargaInfo.abierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-slideUp">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📎</span>
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                  Informe PDF Listo para Adjuntar
                </h4>
              </div>
              <button 
                onClick={() => setModalDescargaInfo({ abierto: false, archivo: '', destino: '' })}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-950 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Archivo PDF generado y guardado en su equipo:</span>
              </div>
              <p className="font-mono bg-white px-2 py-1 rounded border border-emerald-300 text-[11px] truncate">
                {modalDescargaInfo.archivo}
              </p>
            </div>

            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                {modalDescargaInfo.destino === 'whatsapp' ? (
                  <>
                    Se abrió la conversación de WhatsApp con el resumen de la visita. Para que el cliente reciba el informe oficial completo, presione el icono de <strong>clip (📎) ➔ Documento</strong> y seleccione el archivo PDF descargado.
                  </>
                ) : (
                  <>
                    Se abrió su cliente de correo con el texto del reporte. Para que el cliente reciba el informe oficial, presione el icono de <strong>clip (📎 Adjuntar archivo)</strong> y elija el archivo descargado.
                  </>
                )}
              </p>
            </div>

            <button
              onClick={() => setModalDescargaInfo({ abierto: false, archivo: '', destino: '' })}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs transition active:scale-98"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
