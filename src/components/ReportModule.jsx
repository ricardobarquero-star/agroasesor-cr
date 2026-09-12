import React, { useRef, useState } from 'react';
import { 
  FileText, Download, Share2, Mail, CheckCircle2, 
  CloudRain, Sparkles, Printer, Filter, FolderOpen, 
  Activity, Paperclip, X, ZoomIn
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { crAgroDatabase } from '../data/crAgroDatabase';
import { storageService } from '../services/storageService';
import { calcularDosisDual } from '../utils/doseCalculator';
import { agroEpidemiologyService } from '../services/agroEpidemiologyService';

export default function ReportModule({ visita, onOpenAi: _onOpenAi, onNavegarTab }) {
  const reportRef = useRef(null);
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [mensajeEstado, setMensajeEstado] = useState('');
  const [guardadoEnExpediente, setGuardadoEnExpediente] = useState(false);
  const [modalDescargaInfo, setModalDescargaInfo] = useState({ abierto: false, archivo: '', destino: '' });
  const [modalFotoHd, setModalFotoHd] = useState(null);
  
  // Filtro de alcance para el reporte (Toda la Finca o Lote Específico)
  const [filtroLote, setFiltroLote] = useState('todos');
  const [vistaModo, setVistaModo] = useState('digital'); // 'digital' (Móvil/WhatsApp) o 'documento' (A4 Oficial)
  const perfilIngeniero = storageService.getPerfilIngeniero();

  const productor = visita?.productor || {};
  const finca = visita?.finca || {};
  const lote = visita?.lote || {};
  const clima = visita?.clima || {};

  // Obtener todos los lotes de la finca para el selector de filtro
  const clientes = storageService.getClientes();
  const clienteActual = clientes.find(c => c.id === visita?.clienteId);
  const fincaActual = clienteActual?.fincas?.find(f => f.id === finca.id);
  const lotesDeFinca = fincaActual?.lotes || [lote].filter(Boolean);

  // Estadísticas climáticas acumuladas de la finca
  const estadisticasClima = storageService.getEstadisticasClimaClienteFinca(visita?.clienteId, finca.id);

  // Variables climáticas normalizadas (garantiza valores numéricos sin omisiones)
  const altitudFinca = finca.gps?.altitud || clima.altitud || 1680;
  const tempFinca = (clima.temperaturaActual !== undefined && clima.temperaturaActual !== null) 
    ? clima.temperaturaActual 
    : (estadisticasClima?.temperaturaPromedio ?? estadisticasClima?.promedioTemperatura ?? 19);
  const humedadFinca = (clima.humedadActual !== undefined && clima.humedadActual !== null) 
    ? clima.humedadActual 
    : (estadisticasClima?.humedadPromedio ?? estadisticasClima?.promedioHumedadRelativa ?? 82);
  const lluvia7d = clima.lluviaAcumulada7Dias !== undefined ? clima.lluviaAcumulada7Dias : 0;
  const lluviaAcumuladaFinca = estadisticasClima?.lluviaTotalAcumulada ?? lluvia7d;

  // Análisis de I.A. sobre Factores Climáticos y Riesgos Fitosanitarios (enfermedades y plagas propensas)
  const analisisClimaIa = React.useMemo(() => {
    if (!visita || !visita?.id) {
      return {
        cultivo: 'Cultivo',
        variedad: 'Estándar',
        temperatura: 19,
        humedadRelativa: 80,
        lluviaSemanal: 0,
        altitud: 1680,
        pisoAltitudinal: 'Piso Medio',
        descAltitud: 'Condiciones templadas.',
        impactoFisiologico: 'Condiciones climáticas bajo monitoreo agronómico continuo.',
        enfermedadesPropensas: [],
        insectosAcarosPropensos: [],
        medidasPreventivas: 'Monitoreo preventivo semanal en campo.',
        resumenEjecutivo: 'Monitoreo de parámetros climáticos activo.',
        estadoAprobacion: 'aprobado'
      };
    }
    try {
      if (visita?.analisisEpidemiologico?.impactoFisiologico && visita?.analisisEpidemiologico?.enfermedadesPropensas?.length > 0) {
        return visita?.analisisEpidemiologico;
      }
      return agroEpidemiologyService.generarAnalisisClimaticoIa({
        cultivoNombre: lote?.cultivoNombre || 'Fresa',
        variedad: lote?.variedad || '',
        temp: tempFinca,
        humedad: humedadFinca,
        lluvia7d: lluvia7d,
        altitud: altitudFinca,
        loteNombre: filtroLote === 'todos' ? 'Toda la Finca' : filtroLote,
        hallazgos: (visita?.hallazgos || [])
      });
    } catch (err) {
      console.error('Error generando análisis agroclimático:', err);
      return {
        cultivo: lote?.cultivoNombre || 'Cultivo',
        variedad: lote?.variedad || 'Estándar',
        temperatura: tempFinca,
        humedadRelativa: humedadFinca,
        lluviaSemanal: lluvia7d,
        altitud: altitudFinca,
        pisoAltitudinal: 'Piso Medio',
        descAltitud: 'Condiciones templadas.',
        impactoFisiologico: 'Condiciones climáticas bajo monitoreo agronómico continuo.',
        enfermedadesPropensas: [],
        insectosAcarosPropensos: [],
        medidasPreventivas: 'Monitoreo preventivo semanal en campo.',
        resumenEjecutivo: 'Monitoreo de parámetros climáticos activo.',
        estadoAprobacion: 'aprobado'
      };
    }
  }, [visita, lote?.cultivoNombre, lote?.variedad, tempFinca, humedadFinca, lluvia7d, altitudFinca, filtroLote]);

  // Guard de visita seleccionada (después de todos los React Hooks)
  if (!visita || !visita?.id) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto text-3xl border border-emerald-200">
          📋
        </div>
        <h3 className="text-xl font-extrabold text-slate-800">
          No hay una visita activa seleccionada
        </h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Para visualizar y generar el informe agronómico oficial, seleccione una visita existente o cree una nueva en el módulo de Visitas.
        </p>
        {onNavegarTab && (
          <button
            type="button"
            onClick={() => onNavegarTab('visitas')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl shadow-md active:scale-95 transition text-sm"
          >
            Ir al Módulo de Visitas
          </button>
        )}
      </div>
    );
  }

    // Mediciones de suelo en campo
  const medicionesSuelo = (visita?.medicionesSuelo || []).filter(m => m.estadoAprobacion !== 'eliminado');
  const cultivoDef = crAgroDatabase.cultivos.find(c => c.id === lote.cultivoId || c.nombre.toLowerCase() === (lote.cultivoNombre || '').toLowerCase()) || crAgroDatabase.cultivos[0];

  // Análisis epidemiológico
  const analisisEpidemiologico = visita?.analisisEpidemiologico || {};

  // Filtrado de hallazgos
  const todosHallazgos = visita?.hallazgos || [];
  const hallazgosFiltrados = filtroLote === 'todos'
    ? todosHallazgos
    : todosHallazgos.filter(h => !h.loteId || h.loteId === filtroLote || h.loteNombre === filtroLote);

  // Filtrado de recomendaciones de fertirriego
  const todasRecFertirriego = visita?.recomendacionesFertirriego || [];
  const recFertirriegoFiltradas = todasRecFertirriego.map(semana => {
    if (filtroLote === 'todos') return semana;
    const eventosFiltrados = (semana.eventos || []).filter(ev => 
      !ev.alcance || ev.alcance === 'Toda la Finca' || ev.alcance.includes(filtroLote)
    );
    return { ...semana, eventos: eventosFiltrados };
  }).filter(semana => semana.eventos && semana.eventos.length > 0);

  // Filtrado de recomendaciones de plaguicidas
  const todasRecPlaguicidas = visita?.recomendacionesPlaguicidas || [];
  const recPlaguicidasFiltradas = todasRecPlaguicidas.map(semana => {
    if (filtroLote === 'todos') return semana;
    const appsFiltradas = (semana.aplicaciones || []).filter(app => 
      !app.alcance || app.alcance === 'Toda la Finca' || app.alcance.includes(filtroLote)
    );
    return { ...semana, aplicaciones: appsFiltradas };
  }).filter(semana => semana.sinAplicacion || (semana.aplicaciones && semana.aplicaciones.length > 0));

  // Agrupación y paginación inteligente de recomendaciones (Estrictamente 1 página por semana)
  const semanasFert = recFertirriegoFiltradas.map(s => s.semana || 1);
  const semanasPlag = recPlaguicidasFiltradas.map(s => s.semana || 1);
  const todasSemanas = Array.from(new Set([...semanasFert, ...semanasPlag])).sort((a, b) => a - b);
  const semanasParaReporte = todasSemanas.length > 0 ? todasSemanas : [1];

  // Paginación inteligente de hallazgos para formato Revista Científica (proporción HD nativa sin recortes)
  const chunkHallazgos = (items) => {
    if (items.length <= 4) {
      return [items];
    }
    return [items.slice(0, 2), items.slice(2, 6)];
  };
  const paginasHallazgos = chunkHallazgos(hallazgosFiltrados);

  // Conteo total de páginas del informe oficial
  const totalPaginas = 1 + paginasHallazgos.length + semanasParaReporte.length;

  // Generar Blob y File del PDF asegurando captura página-por-página en 300 DPI (CERO CORTES)
  const generarPdfBlobYArchivo = async () => {
    if (!reportRef.current) return null;
    const container = reportRef.current;

    const estabaOculto = container.classList.contains('hidden');
    if (estabaOculto) {
      container.classList.remove('hidden');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '816px';
      container.style.display = 'block';
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      const pdf = new jsPDF('p', 'mm', 'letter');
      const pageWidth = pdf.internal.pageSize.getWidth();   // ~215.9 mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // ~279.4 mm

      // Seleccionar todas las páginas editoriales maquetadas individualmente
      const pageElements = Array.from(container.querySelectorAll('.report-editorial-page'));

      if (pageElements.length === 0) {
        const canvas = await html2canvas(container, {
          scale: 2.8,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
      } else {
        for (let i = 0; i < pageElements.length; i++) {
          if (i > 0) {
            pdf.addPage('letter', 'p');
          }
          const pageEl = pageElements[i];
          const canvas = await html2canvas(pageEl, {
            scale: 2.8, // 300 DPI de definición vectorial para textos e imágenes nítidas
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.98);
          // Cada página editorial entra 1-a-1 sin división de cuadros, tablas ni títulos
          pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
        }
      }

      const nombreLoteStr = filtroLote === 'todos' ? 'Consolidado' : filtroLote.replace(/\s+/g, '_');
      const fincaLimpia = (finca.nombre || 'Finca').replace(/\s+/g, '_');
      const fileName = `Informe_${fincaLimpia}_${nombreLoteStr}_${visita?.fecha || '2026'}.pdf`;

      const pdfBlob = pdf.output('blob');
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      return { pdf, pdfBlob, pdfFile, fileName };
    } finally {
      if (estabaOculto) {
        container.classList.add('hidden');
        container.style.position = '';
        container.style.left = '';
        container.style.top = '';
        container.style.width = '';
        container.style.display = '';
      }
    }
  };

  // Guardar reporte en el expediente del cliente
  const handleGuardarEnExpediente = () => {
    const nuevoReporte = {
      id: 'rep-' + Date.now(),
      visitaId: visita?.id,
      clienteId: visita?.clienteId,
      fincaId: finca.id,
      fincaNombre: finca.nombre || 'Finca Principal',
      productorNombre: productor.nombre || 'Cliente',
      fecha: visita?.fecha || new Date().toISOString().split('T')[0],
      cultivoNombre: lote.cultivoNombre || 'Cultivo',
      alcance: filtroLote === 'todos' ? 'Toda la Finca' : `Lote: ${filtroLote}`,
      hallazgosCount: hallazgosFiltrados.length,
      fertirriegoCount: recFertirriegoFiltradas.length,
      plaguicidasCount: recPlaguicidasFiltradas.length,
      medicionesSueloCount: medicionesSuelo.length,
      resumenWhatsApp: generarTextoCompletoWhatsApp()
    };
    storageService.guardarReporteEnExpediente(visita?.clienteId, nuevoReporte);
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
      if (res) {
        const { pdf, pdfFile, fileName } = res;
        if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
          await navigator.share({
            files: [pdfFile],
            title: `Informe Agronómico - ${finca.nombre || 'Finca'}`,
            text: `Estimado(a) ${productor.nombre || 'Productor'}: Adjunto informe técnico oficial de la visita del ${visita?.fecha || ''}.`
          });
          return;
        } else {
          pdf.save(fileName);
          setModalDescargaInfo({
            abierto: true,
            archivo: fileName,
            destino: 'general'
          });
          return;
        }
      }
      window.print();
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error compartiendo PDF nativo:', err);
        window.print();
      }
    } finally {
      setGenerandoPdf(false);
      setMensajeEstado('');
    }
  };

  // WHATSAPP CON PDF: Comparte el archivo PDF directamente por WhatsApp o abre chat oficial
  const handleCompartirWhatsAppConPDF = async () => {
    setGenerandoPdf(true);
    setMensajeEstado('Preparando informe para WhatsApp...');
    let res = null;
    try {
      res = await generarPdfBlobYArchivo();
    } catch (pdfErr) {
      console.warn('Aviso generando PDF para WhatsApp, continuando con mensaje oficial:', pdfErr);
    }

    try {
      const telefonoLimpio = (productor.telefono || '').replace(/[^0-9]/g, '');
      const textoMensaje = generarTextoCompletoWhatsApp();

      // En móviles que soportan compartir archivos nativamente (iOS / Android)
      if (res?.pdfFile && navigator.canShare && navigator.canShare({ files: [res.pdfFile] })) {
        await navigator.share({
          files: [res.pdfFile],
          title: `Informe Agronómico - ${finca.nombre || 'Finca'}`,
          text: `🌱 *AGROASESOR PRO CR - INFORME OFICIAL*\nProductor: ${productor.nombre || 'Cliente'}\nFinca: ${finca.nombre || 'Finca'} (${visita?.fecha || ''})\n\nAdjunto informe técnico oficial en formato PDF.`
        });
      } else {
        // En PC o navegador web: descargar el PDF si existe y abrir WhatsApp
        const fileName = res?.fileName || `Informe_${(finca.nombre || 'Finca').replace(/\s+/g, '_')}_${visita?.fecha || '2026'}.pdf`;
        if (res?.pdf) {
          res.pdf.save(fileName);
        }
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
        const textoMensaje = generarTextoCompletoWhatsApp();
        const telefonoLimpio = (productor.telefono || '').replace(/[^0-9]/g, '');
        const url = telefonoLimpio 
          ? `https://api.whatsapp.com/send?phone=${telefonoLimpio}&text=${encodeURIComponent(textoMensaje)}`
          : `https://api.whatsapp.com/send?text=${encodeURIComponent(textoMensaje)}`;
        window.open(url, '_blank');
      }
    } finally {
      setGenerandoPdf(false);
      setMensajeEstado('');
    }
  };

  // CORREO CON PDF: Comparte el archivo PDF directamente por Correo o abre cliente oficial
  const handleEnviarCorreoConPDF = async () => {
    setGenerandoPdf(true);
    setMensajeEstado('Preparando informe para Correo...');
    let res = null;
    try {
      res = await generarPdfBlobYArchivo();
    } catch (pdfErr) {
      console.warn('Aviso generando PDF para Correo:', pdfErr);
    }

    try {
      const destinatario = productor.email || 'h7coordinador@gmail.com';
      const cc = 'h7coordinador@gmail.com';
      const asunto = `Informe Agronómico Oficial - ${finca.nombre || 'Finca'} - Ing. Ricardo Barquero`;
      const cuerpo = `Estimado(a) ${productor.nombre || 'Productor'}:\n\n` +
        `Adjunto el informe de asesoría agronómica correspondiente a la visita del ${visita?.fecha || ''} en la finca ${finca.nombre || ''}.\n\n` +
        `Atentamente,\n` +
        `Ing. Agr. Ricardo Manuel Barquero Chacón\n` +
        `Colegiado No. 5896 • Ingeniero Agrónomo\n` +
        `Tel: +506 8894-5662 | Coronado, San José, Costa Rica`;

      // En móviles con soporte de archivos nativos
      if (res?.pdfFile && navigator.canShare && navigator.canShare({ files: [res.pdfFile] })) {
        await navigator.share({
          files: [res.pdfFile],
          title: asunto,
          text: cuerpo
        });
      } else {
        // En PC: descargar archivo PDF si existe y abrir cliente de correo
        const fileName = res?.fileName || `Informe_${(finca.nombre || 'Finca').replace(/\s+/g, '_')}_${visita?.fecha || '2026'}.pdf`;
        if (res?.pdf) {
          res.pdf.save(fileName);
        }
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
    msg += `📅 *Fecha:* ${visita?.fecha || 'Hoy'} • ${visita?.hora || ''}\n`;
    msg += `🌱 *Cultivo:* ${lote.cultivoNombre || 'Cultivo'} (Var: ${lote.variedad || 'Estándar'})
`;
    msg += `🏔️ *Altitud Finca:* ${altitudFinca} msnm • 🌧️ *Lluvia 7 días:* ${lluvia7d} mm
`;
    msg += `🌡️ *Temp Finca:* ${tempFinca}°C • *Humedad HR:* ${humedadFinca}%
`;
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

    // Observaciones de la I.A. sobre Factores Climáticos y Riesgos Fitosanitarios
    if (analisisClimaIa) {
      msg += `🤖 *OBSERVACIONES I.A. CLIMA & RIESGOS FITOSANITARIOS:*
`;
      msg += `• *Diagnóstico Climático (${tempFinca}°C / ${humedadFinca}% HR):* ${analisisClimaIa.resumenEjecutivo || 'Monitoreo preventivo'}
`;
      if (analisisClimaIa.enfermedadesPropensas?.length > 0) {
        msg += `• 🍄 *Enfermedades Propensas:* ` + analisisClimaIa.enfermedadesPropensas.slice(0, 3).map(e => `${e.patogeno} [${e.riesgo}]`).join(', ') + `
`;
      }
      if (analisisClimaIa.insectosAcarosPropensos?.length > 0) {
        msg += `• 🐛 *Insectos/Ácaros Propensos:* ` + analisisClimaIa.insectosAcarosPropensos.slice(0, 2).map(p => `${p.plaga} [${p.riesgo}]`).join(', ') + `
`;
      }
      msg += `
`;
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
              const dual = calcularDosisDual(l.dosis || '');
              const dL = l.dosisLitro || dual.dosisLitro;
              const dE = l.dosisEstanon || dual.dosisEstanon;
              msg += `  ${l.orden}. ${l.producto} - *${dL}* [Estañón: *${dE}*] (${l.fracIrac || l.tipo})\n`;
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
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
            title="Imprimir o Guardar como PDF de forma nativa sin cortes de página"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VISTA 1: DIGITAL MÓVIL PARA TELÉFONO Y WHATSAPP */}
      {/* ========================================================= */}
      {vistaModo === 'digital' && (
        <div className="space-y-4 max-w-2xl mx-auto mobile-view-container no-print">
          {/* Tarjeta Resumen Productor Editorial */}
          <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-5 rounded-3xl shadow-xl space-y-3 border border-emerald-700/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/15 px-3 py-1 rounded-full border border-white/20">
                🌱 Dossier Agronómico Oficial
              </span>
              <span className="text-xs font-bold text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {visita?.fecha}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest block mb-0.5">
                Productor / Finca Evaluada
              </span>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight">{productor.nombre || 'Productor'}</h3>
              <p className="text-xs text-emerald-100/90 mt-1 font-medium">
                🏡 Finca: <strong>{finca.nombre || 'Finca'}</strong> • Cultivo: <strong>{lote.cultivoNombre || 'Cultivo'}</strong> (Var: {lote.variedad || 'Estándar'})
              </p>
            </div>
            <div className="pt-2.5 border-t border-white/15 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white/10 rounded-xl p-1.5 backdrop-blur-xs">
                <span className="text-[10px] text-emerald-200 block">🏔️ Altitud</span>
                <strong className="text-xs">{altitudFinca} msnm</strong>
              </div>
              <div className="bg-white/10 rounded-xl p-1.5 backdrop-blur-xs">
                <span className="text-[10px] text-emerald-200 block">🌧️ Lluvia 7d</span>
                <strong className="text-xs">{lluvia7d} mm</strong>
              </div>
              <div className="bg-white/10 rounded-xl p-1.5 backdrop-blur-xs">
                <span className="text-[10px] text-emerald-200 block">👨‍🌾 Asesor</span>
                <strong className="text-xs">Col. 5896</strong>
              </div>
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

          {/* Tarjeta de Parámetros Automáticos y Condiciones Agroclimáticas */}
          <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-blue-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-blue-700" />
                <span>Parámetros Automáticos y Geoclima de la Finca</span>
              </span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                ⚡ Automático
              </span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-amber-50/80 p-2 rounded-xl border border-amber-200">
                <span className="text-[10px] text-amber-800 block font-semibold">🏔️ Altitud Finca</span>
                <strong className="text-amber-950 font-black text-sm">{altitudFinca} msnm</strong>
              </div>
              <div className="bg-blue-50 p-2 rounded-xl">
                <span className="text-[10px] text-blue-700 block font-semibold">🌧️ Lluvia Semanal</span>
                <strong className="text-blue-950 font-black text-sm">{lluvia7d} mm</strong>
              </div>
              <div className="bg-blue-50 p-2 rounded-xl">
                <span className="text-[10px] text-blue-700 block font-semibold">💧 Humedad HR</span>
                <strong className="text-blue-950 font-black text-sm">{humedadFinca}%</strong>
              </div>
              <div className="bg-blue-50 p-2 rounded-xl">
                <span className="text-[10px] text-blue-700 block font-semibold">🌡️ Temp Finca</span>
                <strong className="text-blue-950 font-black text-sm">{tempFinca}°C</strong>
              </div>
            </div>

            {/* Observaciones de la I.A. Agroclimática en Vista Móvil */}
            <div className="bg-gradient-to-br from-indigo-50/90 via-blue-50/60 to-emerald-50/50 p-3 rounded-xl border border-indigo-200/80 text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-indigo-200/60 pb-1">
                <span className="font-bold text-indigo-950 flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Observaciones I.A.: Factores Climáticos y Riesgos
                </span>
                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Validado por Agrónomo
                </span>
              </div>
              <p className="text-slate-700 text-[11px] leading-relaxed">
                {analisisClimaIa.impactoFisiologico}
              </p>

              {/* Enfermedades Propensas Móvil */}
              {analisisClimaIa.enfermedadesPropensas?.length > 0 && (
                <div className="space-y-1 pt-1 border-t border-indigo-100">
                  <span className="text-[10px] font-extrabold uppercase text-amber-900 block">
                    🍄 Enfermedades Propensas a Activarse:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {analisisClimaIa.enfermedadesPropensas.map((enf, eIdx) => (
                      <span key={eIdx} className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-amber-200 text-amber-950 font-medium">
                        <strong>{enf.patogeno}</strong> <span className="text-[9px] font-bold text-red-600">({enf.riesgo})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Plagas Propensas Móvil */}
              {analisisClimaIa.insectosAcarosPropensos?.length > 0 && (
                <div className="space-y-1 pt-1 border-t border-indigo-100">
                  <span className="text-[10px] font-extrabold uppercase text-purple-900 block">
                    🐛 Insectos y Ácaros con Riesgo Poblacional:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {analisisClimaIa.insectosAcarosPropensos.map((plaga, pIdx) => (
                      <span key={pIdx} className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-purple-200 text-purple-950 font-medium">
                        <strong>{plaga.plaga}</strong> <span className="text-[9px] font-bold text-purple-700">({plaga.riesgo})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            </div>

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
                          {(app.ordenMezcla || []).map((l, li) => {
                            const dual = calcularDosisDual(l.dosis || '');
                            const dL = l.dosisLitro || dual.dosisLitro;
                            const dE = l.dosisEstanon || dual.dosisEstanon;
                            return (
                              <li key={li} className="py-0.5">
                                <div className="flex flex-wrap items-center justify-between gap-1">
                                  <div>
                                    <strong className="text-slate-900">{l.producto}</strong>
                                    <span className="text-[10px] text-slate-500 ml-1">({l.fracIrac || l.tipo})</span>
                                    {l.registroSfe && (
                                      <span className="text-[9px] text-emerald-800 font-bold ml-1 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                                        🏛️ {l.registroSfe}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] font-bold flex items-center gap-1">
                                    <span className="text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200" title="Dosis por litro">
                                      💧 {dL}
                                    </span>
                                    <span className="text-purple-950 bg-purple-100/80 px-1.5 py-0.5 rounded border border-purple-200 font-black" title="Dosis total en estañón de 200 L">
                                      🛢️ {dE}
                                    </span>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
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
      {/* VISTA 2: DOSSIER EDITORIAL DE REVISTA CIENTÍFICA (PANTALLA Y PDF) */}
      {/* ========================================================= */}
      <div 
        ref={reportRef} 
        className={`report-sheet max-w-4xl mx-auto text-slate-900 font-sans ${vistaModo === 'documento' ? 'block' : 'hidden print:block'}`}
      >
        
        {/* ========================================================= */}
        {/* PÁGINA 1: PORTADA EJECUTIVA, AGROCLIMA Y DIAGNÓSTICO I.A. */}
        {/* ========================================================= */}
        <div className="report-editorial-page page-1">
          <div className="space-y-2.5">
            {/* ENCABEZADO OFICIAL DE ALTA GAMA DEL PROFESIONAL */}
            <div className="border-b-2 border-emerald-800 pb-3">
              <div className="flex flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                    🌱
                  </div>
                  <div>
                    <span className="text-[9.5px] font-black uppercase tracking-widest text-emerald-800 block">
                      ASESORÍA TÉCNICA AGRONÓMICA PROFESIONAL
                    </span>
                    <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                      Ing. Agr. Ricardo M. Barquero Chacón
                    </h1>
                    <p className="text-[11px] font-bold text-slate-700">
                      Ingeniero Agrónomo • Colegiado No. 5896
                    </p>
                    <p className="text-[9.5px] text-slate-500">
                      Tel: {perfilIngeniero.telefono || '+506 8894-5662'} • {perfilIngeniero.ubicacion || 'Coronado, San José, Costa Rica'} • {perfilIngeniero.email || 'h7coordinador@gmail.com'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    INFORME TÉCNICO OFICIAL
                  </span>
                  <div className="mt-0.5 text-[11px] font-bold text-slate-700">
                    <span>Fecha: </span>
                    <span className="text-slate-900">{visita?.fecha || '2026-03-10'}</span>
                  </div>
                  <div className="text-[9.5px] text-slate-500 font-mono">
                    Folio: AGRO-CR-{visita?.id?.slice(-5) || '001'}
                  </div>
                </div>
              </div>
            </div>

            {/* RESUMEN EJECUTIVO PARA EL PRODUCTOR */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5">
              <h3 className="font-extrabold text-[10.5px] uppercase tracking-wider text-emerald-900 mb-0.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Guía de Trabajo para el Productor:</span>
              </h3>
              <p className="text-[10.5px] text-emerald-950 leading-snug">
                Estimado(a) <strong>{productor.nombre || 'Productor'}</strong>: Presento el informe agronómico correspondiente a la visita en la finca <strong>{finca.nombre || 'la finca'}</strong>. 
                {filtroLote !== 'todos' ? ` Evaluación consolidada para el lote ${filtroLote}.` : ' Valoración técnica integral de la finca y sus unidades productivas.'} 
                Se documentaron <strong>{hallazgosFiltrados.length} hallazgos</strong> en campo, parámetros automáticos y geoclima satelital, análisis de suelo y las prescripciones semanales correspondientes.
              </p>
            </div>

            {/* 1. DATOS GENERALES DE LA ASESORÍA */}
            <div>
              <h3 className="font-bold text-[10.5px] uppercase tracking-wider text-slate-800 mb-1 pb-0.5 border-b border-slate-200 flex items-center gap-1">
                <span className="w-4 h-4 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">1</span>
                Datos Generales de la Asesoría
              </h3>
              <div className="grid grid-cols-4 print:grid-cols-4 print-grid-4 gap-1.5 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[9.5px]">Productor / Cliente:</span>
                  <strong className="text-slate-900 font-bold text-[11px] truncate block">{productor.nombre || 'N/A'}</strong>
                  <span className="text-slate-500 block text-[9.5px]">{productor.telefono || ''}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[9.5px]">Finca Evaluada:</span>
                  <strong className="text-slate-900 font-bold text-[11px] truncate block">{finca.nombre || 'N/A'}</strong>
                  <span className="text-slate-500 block text-[9.5px] truncate">{finca.ubicacion || 'Costa Rica'}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[9.5px]">Alcance del Reporte:</span>
                  <strong className="text-slate-900 font-bold text-[11px] truncate block">
                    {filtroLote === 'todos' ? 'Toda la Finca' : filtroLote}
                  </strong>
                  <span className="text-slate-500 block text-[9.5px]">{lote.area || 'N/A'}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[9.5px]">Cultivo y Variedad:</span>
                  <strong className="text-emerald-900 font-bold text-[11px] truncate block">{lote.cultivoNombre || 'N/A'}</strong>
                  <span className="text-emerald-700 block text-[9.5px] font-semibold truncate">Var: {lote.variedad || 'Estándar'}</span>
                </div>
              </div>
            </div>

            {/* 2. TABLA DE PARÁMETROS AUTOMÁTICOS Y CONDICIONES AGROCLIMÁTICAS */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 mb-1 pb-0.5">
                <h3 className="font-bold text-[10.5px] uppercase tracking-wider text-slate-800 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-md bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold">2</span>
                  Tabla de Parámetros Automáticos y Condiciones Agroclimáticas de la Finca
                </h3>
                <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                  ⚡ Satélite DEM & Estación Virtual
                </span>
              </div>

              <div className="overflow-hidden border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[10px]">
                    <tr>
                      <th className="p-1.5">Parámetro Automático</th>
                      <th className="p-1.5">Valor Registrado</th>
                      <th className="p-1.5">Origen / Sistema</th>
                      <th className="p-1.5">Interpretación Técnica / Piso Agronómico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-[10px]">
                    <tr>
                      <td className="p-1.5 font-bold text-slate-800 flex items-center gap-1">
                        <span>🏔️</span> Altitud de la Finca
                      </td>
                      <td className="p-1.5">
                        <strong className="text-blue-900 font-black bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          {altitudFinca} m s.n.m.
                        </strong>
                      </td>
                      <td className="p-1.5 text-slate-500">Satélite DEM / Open-Meteo</td>
                      <td className="p-1.5 text-slate-700">{analisisClimaIa.pisoAltitudinal}: {analisisClimaIa.descAltitud}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 font-bold text-slate-800 flex items-center gap-1">
                        <span>📍</span> Geolocalización GPS
                      </td>
                      <td className="p-1.5 font-mono text-slate-900 font-bold">
                        {finca.gps?.lat ? `${finca.gps.lat}, ${finca.gps.lon}` : '10.0215, -83.9482'}
                      </td>
                      <td className="p-1.5 text-slate-500">WGS84 GPS Móvil</td>
                      <td className="p-1.5 text-slate-700">{finca.ubicacion || 'Ubicación georreferenciada'}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 font-bold text-slate-800 flex items-center gap-1">
                        <span>🌡️</span> Temperatura en Visita
                      </td>
                      <td className="p-1.5">
                        <strong className="text-slate-900 font-bold bg-orange-50 px-1.5 py-0.2 rounded border border-orange-200">
                          {tempFinca} °C
                        </strong>
                      </td>
                      <td className="p-1.5 text-slate-500">Estación Meteorológica Virtual</td>
                      <td className="p-1.5 text-slate-700">Condición térmica en campo al momento del recorrido</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 font-bold text-slate-800 flex items-center gap-1">
                        <span>💧</span> Humedad Relativa & Rocío
                      </td>
                      <td className="p-1.5">
                        <strong className="text-cyan-950 font-bold bg-cyan-50 px-1.5 py-0.2 rounded border border-cyan-200">
                          {humedadFinca} %
                        </strong>
                      </td>
                      <td className="p-1.5 text-slate-500">Sensor Atmosférico Satelital</td>
                      <td className="p-1.5 text-slate-700">
                        {humedadFinca >= 75 ? '⚠️ Alta humedad: Conducente a libre de agua y germinación fúngica' : 'Humedad en rango moderado'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-1.5 font-bold text-slate-800 flex items-center gap-1">
                        <span>🌧️</span> Lluvia Acumulada (7 Días)
                      </td>
                      <td className="p-1.5">
                        <strong className="text-blue-900 font-black bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          {lluvia7d} mm
                        </strong>
                      </td>
                      <td className="p-1.5 text-slate-500">Pluviometría Semanal</td>
                      <td className="p-1.5 text-slate-700">
                        {lluvia7d > 35 ? '⚠️ Lluvias intensas: Monitorear asfixia radicular, Phytophthora y lavado' : 'Régimen pluviométrico semanal moderado'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-1.5 font-bold text-slate-800 flex items-center gap-1">
                        <span>📊</span> Lluvia Histórica Expediente
                      </td>
                      <td className="p-1.5">
                        <strong className="text-indigo-950 font-black bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                          {lluviaAcumuladaFinca} mm
                        </strong>
                      </td>
                      <td className="p-1.5 text-slate-500">Historial Finca ({estadisticasClima?.totalVisitas || 1} visitas)</td>
                      <td className="p-1.5 text-slate-700">Acumulado continuo registrado en el expediente del cliente</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. OBSERVACIONES Y VALORACIÓN I.A. SOBRE FACTORES AGROCLIMÁTICOS Y RIESGOS */}
            <div className="bg-gradient-to-br from-indigo-50/70 via-blue-50/50 to-emerald-50/40 border border-indigo-200 rounded-xl p-2.5 text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-indigo-200 pb-1">
                <span className="font-extrabold text-indigo-950 flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  3. Observaciones y Valoración I.A.: Factores Climáticos y Riesgos Fitosanitarios
                </span>
                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-1.5 py-0.2 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  Validado por el Agrónomo
                </span>
              </div>

              {/* Impacto Fisiológico */}
              <div className="bg-white/90 p-2 rounded-lg border border-indigo-100 text-[10px] leading-relaxed text-slate-800 space-y-0.5">
                <strong className="text-indigo-950 block font-bold text-[10.5px]">
                  🌡️ Impacto Fisiológico de Temperatura ({tempFinca}°C) y Humedad ({humedadFinca}%) en {lote.cultivoNombre || 'el cultivo'}:
                </strong>
                <p>{analisisClimaIa.impactoFisiologico}</p>
              </div>

              {/* Grid 2 Columnas de Riesgos */}
              <div className="grid grid-cols-2 print:grid-cols-2 print-grid-2 gap-1.5 text-[10px]">
                {/* Enfermedades Propensas */}
                <div className="bg-white p-2 rounded-lg border border-amber-200 space-y-1">
                  <span className="font-extrabold text-amber-950 flex items-center justify-between border-b border-amber-100 pb-0.5 text-[10.5px]">
                    <span>🍄 Enfermedades Propensas:</span>
                    <span className="text-[8.5px] font-bold px-1 py-0.2 bg-amber-100 text-amber-900 rounded">Alerta Fúngica</span>
                  </span>
                  <div className="space-y-1">
                    {(analisisClimaIa.enfermedadesPropensas || []).slice(0, 2).map((enf, eIdx) => (
                      <div key={eIdx} className="bg-amber-50/60 p-1 rounded border border-amber-100 space-y-0.5">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-amber-950">{enf.patogeno}</span>
                          <span className={`text-[8.5px] font-black px-1 rounded ${
                            enf.riesgo.includes('Crítico') ? 'bg-red-600 text-white' : (enf.riesgo.includes('Alto') ? 'bg-orange-500 text-white' : 'bg-amber-200 text-amber-950')
                          }`}>
                            {enf.riesgo}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[9.5px] leading-tight">
                          <strong>Condición:</strong> {enf.condicionPredisponente}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Insectos y Ácaros */}
                <div className="bg-white p-2 rounded-lg border border-purple-200 space-y-1">
                  <span className="font-extrabold text-purple-950 flex items-center justify-between border-b border-purple-100 pb-0.5 text-[10.5px]">
                    <span>🐛 Insectos / Ácaros Propensos:</span>
                    <span className="text-[8.5px] font-bold px-1 py-0.2 bg-purple-100 text-purple-900 rounded">Dinámica Térmica</span>
                  </span>
                  <div className="space-y-1">
                    {(analisisClimaIa.insectosAcarosPropensos || []).slice(0, 2).map((plaga, pIdx) => (
                      <div key={pIdx} className="bg-purple-50/60 p-1 rounded border border-purple-100 space-y-0.5">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-purple-950">{plaga.plaga}</span>
                          <span className={`text-[8.5px] font-black px-1 rounded ${
                            plaga.riesgo.includes('Crítico') ? 'bg-red-600 text-white' : (plaga.riesgo.includes('Alto') ? 'bg-purple-600 text-white' : 'bg-purple-200 text-purple-950')
                          }`}>
                            {plaga.riesgo}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[9.5px] leading-tight">
                          <strong>Dinámica a {tempFinca}°C:</strong> {plaga.dinamicaPoblacional}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Medidas Preventivas */}
              <div className="bg-emerald-50/90 p-2 rounded-lg border border-emerald-200 text-[10px] text-emerald-950 space-y-0.5">
                <strong className="block font-bold text-[10.5px] text-emerald-950">
                  🛡️ Estrategia y Medidas Preventivas Inmediatas Recomendadas por la I.A.:
                </strong>
                <p className="leading-tight text-slate-800">
                  {analisisClimaIa.medidasPreventivas}
                </p>
              </div>
            </div>
          </div>

          {/* PIE DE PÁGINA 1 EDITORIAL */}
          <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[9px] text-slate-400">
            <span>AgroAsesor Pro CR™ • Ing. Agr. Ricardo M. Barquero Chacón (Col. 5896)</span>
            <span>Dossier Agronómico Oficial • Costa Rica</span>
            <span className="font-bold text-slate-700">Página 1 de {totalPaginas}</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PÁGINA(S) 2: DOSSIER CIENTÍFICO DE HALLAZGOS Y SUELO     */}
        {/* ========================================================= */}
        {paginasHallazgos.map((grupoHallazgos, pIdx) => {
          const numPaginaActual = 2 + pIdx;
          return (
            <div key={`hallazgos-page-${pIdx}`} className={`report-editorial-page page-${numPaginaActual}`}>
              <div className="space-y-3">
                {/* Header Mini de Revista Científica */}
                <div className="border-b-2 border-emerald-800/80 pb-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-800 font-black text-sm">🌱 AgroAsesor Pro CR</span>
                    <span className="text-slate-300">|</span>
                    <span className="font-extrabold text-slate-800 uppercase tracking-wide text-[11px]">
                      Dossier Científico de Hallazgos en Campo y Análisis Edáfico {pIdx > 0 ? `(Parte ${pIdx + 1})` : ''}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-600 font-semibold">
                    <span>{finca.nombre || 'Finca'}</span> • <span>{visita?.fecha}</span>
                  </div>
                </div>

                {/* Mediciones de Suelo y Sustrato en Campo (Solo en la primera página de hallazgos) */}
                {pIdx === 0 && medicionesSuelo.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-[10.5px] uppercase tracking-wider text-slate-800 pb-0.5 border-b border-slate-200 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">3</span>
                      Mediciones de Suelo y Sustrato en Campo
                    </h3>

                    {medicionesSuelo.map((m, mIdx) => (
                      <div key={m.id || mIdx} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                          <span className="font-extrabold text-slate-900 text-[11px]">
                            📍 {m.loteNombre || 'Lote Evaluado'} — {m.metodo || 'Sonda directa en campo'}
                          </span>
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded">
                            Validado por Ing. Ricardo Barquero (Col. 5896)
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700 text-[10px]">
                                <th className="py-1 px-2 font-bold">Parámetro</th>
                                <th className="py-1 px-2 font-bold text-center">Valor Medido</th>
                                <th className="py-1 px-2 font-bold text-center">Rango Óptimo ({cultivoDef.nombre})</th>
                                <th className="py-1 px-2 font-bold">Evaluación Agronómica</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[10px]">
                              <tr>
                                <td className="py-1 px-2 font-medium text-slate-800">pH del Suelo / Sustrato</td>
                                <td className="py-1 px-2 text-center font-black text-slate-900">{m.phSuelo}</td>
                                <td className="py-1 px-2 text-center text-slate-600">{cultivoDef.rangoPh || '5.5 - 6.5'}</td>
                                <td className="py-1 px-2 font-semibold text-emerald-700">
                                  {parseFloat(m.phSuelo) >= 5.5 && parseFloat(m.phSuelo) <= 6.5 ? 'Dentro de rango óptimo' : 'Requiere ajuste en solución'}
                                </td>
                              </tr>
                              <tr>
                                <td className="py-1 px-2 font-medium text-slate-800">Conductividad Eléctrica (CE)</td>
                                <td className="py-1 px-2 text-center font-black text-slate-900">{m.ceSuelo} mS/cm</td>
                                <td className="py-1 px-2 text-center text-slate-600">{cultivoDef.rangoCe || '1.2 - 1.8 mS/cm'}</td>
                                <td className="py-1 px-2 font-semibold text-emerald-700">
                                  {parseFloat(m.ceSuelo) >= 1.0 && parseFloat(m.ceSuelo) <= 2.0 ? 'Salinidad controlada' : 'Ajustar conductividad'}
                                </td>
                              </tr>
                              <tr>
                                <td className="py-1 px-2 font-medium text-slate-800">Temperatura del Suelo</td>
                                <td className="py-1 px-2 text-center font-black text-slate-900">{m.tempSuelo}°C</td>
                                <td className="py-1 px-2 text-center text-slate-600">{cultivoDef.rangoTempSuelo || '16 - 22 °C'}</td>
                                <td className="py-1 px-2 font-semibold text-emerald-700">Actividad radicular favorable</td>
                              </tr>
                              <tr>
                                <td className="py-1 px-2 font-medium text-slate-800">Humedad en Rizósfera</td>
                                <td className="py-1 px-2 text-center font-black text-slate-900">{m.humedadSuelo}</td>
                                <td className="py-1 px-2 text-center text-slate-600">{cultivoDef.rangoHumedadSuelo || '60 - 80%'}</td>
                                <td className="py-1 px-2 font-semibold text-emerald-700">Adecuada capacidad de campo</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {m.ajusteRecomendado && (
                          <div className="bg-emerald-50/80 p-2 rounded-lg border border-emerald-200 text-slate-800 text-[10px]">
                            <strong className="text-emerald-950 font-bold block mb-0.5">Ajuste y Recomendación Agronómica:</strong>
                            <span>{m.ajusteRecomendado}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Diagnóstico Visual de Hallazgos en Formato Revista Científica */}
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200 mb-2 pb-1">
                    <h3 className="font-bold text-[10.5px] uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-bold">
                        {pIdx === 0 ? '4' : '4b'}
                      </span>
                      Diagnóstico Visual de Hallazgos Fitosanitarios en Campo
                    </h3>
                    <span className="text-[9px] font-bold text-slate-500">
                      Formato Revista Científica • Proporción HD Real
                    </span>
                  </div>

                  {grupoHallazgos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 print-grid-2 gap-3">
                      {grupoHallazgos.map((h, hIdx) => {
                        const figureIndex = (pIdx === 0 ? 0 : 2) + hIdx + 1;
                        return (
                          <div key={h.id || hIdx} className="finding-card border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs flex flex-col justify-between">
                            {h.fotoAnotada ? (
                              <div 
                                onClick={() => setModalFotoHd({
                                  url: h.fotoAnotada,
                                  figura: `Figura ${figureIndex}`,
                                  titulo: h.titulo,
                                  categoria: h.categoria,
                                  severidad: h.severidad,
                                  lote: h.loteNombre || lote.nombre,
                                  fecha: h.fecha || visita?.fecha,
                                  descripcion: h.descripcion
                                })}
                                className="scientific-photo-container"
                                title="Click para ampliar imagen en Alta Definición HD"
                              >
                                <img 
                                  src={h.fotoAnotada} 
                                  alt={h.titulo} 
                                  className="scientific-photo"
                                />
                                <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-xs text-white px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider border border-white/20">
                                  FIG. {figureIndex}
                                </div>
                                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white/90 px-1.5 py-0.5 rounded text-[9px] flex items-center gap-1 no-print">
                                  <ZoomIn className="w-3 h-3" />
                                  <span>HD</span>
                                </div>
                              </div>
                            ) : (
                              <div className="h-28 bg-slate-100 flex items-center justify-center text-xs text-slate-400 italic">
                                Sin fotografía adjunta
                              </div>
                            )}

                            {/* Pie de Figura Científica */}
                            <div className="scientific-caption flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="font-extrabold text-[9.5px] text-emerald-900 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded">
                                    {h.categoria || 'Hallazgo Fitosanitario'}
                                  </span>
                                  <span className={`font-black text-[9px] px-2 py-0.2 rounded border ${
                                    h.severidad?.toLowerCase().includes('alta') || h.severidad?.toLowerCase().includes('crítica')
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}>
                                    Severidad: {h.severidad || 'Media'}
                                  </span>
                                </div>
                                <p className="text-slate-900 font-bold text-xs leading-snug">
                                  <strong className="text-emerald-800 font-black">Figura {figureIndex}: </strong>
                                  {h.titulo}
                                </p>
                                <p className="text-slate-600 text-[10.5px] mt-1 leading-tight">
                                  {h.descripcion}
                                </p>
                              </div>
                              <div className="flex items-center justify-between text-[9px] text-slate-400 mt-2 pt-1 border-t border-slate-100">
                                <span className="font-semibold text-slate-500">📍 Lote: {h.loteNombre || lote.nombre || 'Lote 1'}</span>
                                <span>📅 {h.fecha || visita?.fecha}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border">
                      No se registraron hallazgos fitosanitarios para el alcance seleccionado.
                    </p>
                  )}
                </div>
              </div>

              {/* Footer Página Hallazgos */}
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[9px] text-slate-400">
                <span>AgroAsesor Pro CR™ • Ing. Agr. Ricardo M. Barquero Chacón (Col. 5896)</span>
                <span>Dossier Agronómico Oficial • Costa Rica</span>
                <span className="font-bold text-slate-700">Página {numPaginaActual} de {totalPaginas}</span>
              </div>
            </div>
          );
        })}

        {/* ========================================================= */}
        {/* PÁGINAS SEMANALES DEDICADAS DE RECOMENDACIONES (1 POR SEMANA) */}
        {/* ========================================================= */}
        {semanasParaReporte.map((semNum, sIdx) => {
          const numPaginaActual = 1 + paginasHallazgos.length + sIdx + 1;
          const fertSemana = recFertirriegoFiltradas.find(s => s.semana === semNum);
          const plagSemana = recPlaguicidasFiltradas.find(s => s.semana === semNum);
          const esUltimaSemana = sIdx === semanasParaReporte.length - 1;

          return (
            <div key={`semana-page-${semNum}`} className={`report-editorial-page page-${numPaginaActual}`}>
              <div className="space-y-3">
                {/* Header Semanal de Alta Gama */}
                <div className="border-b-2 border-slate-800 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-xs">
                      S{semNum}
                    </span>
                    <div>
                      <h3 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wide">
                        Prescripción Técnica Integral • Semana {semNum}
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-800 block">
                        Nutrición, Fertirriego y Manejo Fitosanitario Segregado con Doble Dosis (Litro / 200 L)
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-[10.5px]">
                    <span className="font-bold text-slate-900 block">{finca.nombre || 'Finca'}</span>
                    <span className="text-slate-500 text-[10px]">Validez: 7 días de prescripción</span>
                  </div>
                </div>

                {/* SECCIÓN A: NUTRICIÓN Y FERTIRRIEGO DE LA SEMANA */}
                <div className="bg-slate-50/70 border border-blue-200 rounded-xl p-2.5 space-y-2">
                  <div className="flex items-center justify-between border-b border-blue-200 pb-1">
                    <span className="font-extrabold text-blue-950 text-xs flex items-center gap-1.5">
                      <span className="text-blue-700">💧</span>
                      A. Programa Nutricional y Fertirriego — Semana {semNum}
                    </span>
                    <span className="text-[9.5px] font-bold text-blue-800 bg-blue-100 px-2 py-0.2 rounded">
                      Sales Solubles y Enmiendas
                    </span>
                  </div>

                  {fertSemana && fertSemana.eventos && fertSemana.eventos.length > 0 ? (
                    <div className="space-y-2">
                      {fertSemana.eventos.map((ev, eIdx) => (
                        <div key={eIdx} className="bg-white rounded-lg border border-slate-200 p-2 text-xs space-y-1.5">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-0.5">
                            <div className="flex items-center gap-1 font-bold text-slate-800">
                              <span>{ev.modalidadIcono || '💧'}</span>
                              <span>{ev.nombreEvento || ev.modalidadNombre || 'Fertirriego'}</span>
                              <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {ev.alcance || 'Toda la Finca'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px]">
                              {ev.conductividadObjetivo && (
                                <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  CE: {ev.conductividadObjetivo}
                                </span>
                              )}
                              {ev.phObjetivo && (
                                <span className="font-bold text-blue-800 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                  pH: {ev.phObjetivo}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Tanque A y Tanque B */}
                          {ev.lineasTanqueA && ev.lineasTanqueB ? (
                            <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                              <div className="bg-blue-50/40 p-1.5 rounded border border-blue-100 space-y-0.5">
                                <strong className="text-blue-900 block text-[10px] font-bold border-b border-blue-100 pb-0.5">
                                  🔵 TANQUE A (Calcio y Nitratos):
                                </strong>
                                {ev.lineasTanqueA.map((l, lIdx) => (
                                  <div key={lIdx} className="flex justify-between text-slate-800 py-0.2">
                                    <span>{l.producto}</span>
                                    <strong className="text-blue-950 ml-1">{l.dosis} {l.unidad}</strong>
                                  </div>
                                ))}
                              </div>
                              <div className="bg-amber-50/40 p-1.5 rounded border border-amber-100 space-y-0.5">
                                <strong className="text-amber-900 block text-[10px] font-bold border-b border-amber-100 pb-0.5">
                                  🟡 TANQUE B (Fósforo, Sulfatos y Micros):
                                </strong>
                                {ev.lineasTanqueB.map((l, lIdx) => (
                                  <div key={lIdx} className="flex justify-between text-slate-800 py-0.2">
                                    <span>{l.producto}</span>
                                    <strong className="text-amber-950 ml-1">{l.dosis} {l.unidad}</strong>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-200 space-y-0.5 text-[10.5px]">
                              {(ev.productos || []).map((l, lIdx) => (
                                <div key={lIdx} className="flex justify-between py-0.5 border-b border-slate-100 last:border-0">
                                  <span className="font-semibold text-slate-800">{l.producto}</span>
                                  <strong className="text-emerald-900 ml-1">{l.dosis} {l.unidad}</strong>
                                </div>
                              ))}
                            </div>
                          )}

                          {ev.observacionesPie && (
                            <p className="text-[10px] text-slate-600 italic pt-0.5">
                              Instrucción: {ev.observacionesPie}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded-lg border border-slate-200">
                      Nutrición edáfica continua. No se programan cambios en la solución madre esta semana.
                    </p>
                  )}
                </div>

                {/* SECCIÓN B: MANEJO FITOSANITARIO FOLIAR SEGREGADO */}
                <div className="bg-slate-50/70 border border-purple-200 rounded-xl p-2.5 space-y-2">
                  <div className="flex items-center justify-between border-b border-purple-200 pb-1">
                    <span className="font-extrabold text-purple-950 text-xs flex items-center gap-1.5">
                      <span className="text-purple-700">🛡️</span>
                      B. Programa Fitosanitario Foliar Segregado — Semana {semNum}
                    </span>
                    <span className="text-[9.5px] font-bold text-purple-800 bg-purple-100 px-2 py-0.2 rounded">
                      Rotación FRAC / IRAC & Dosis Doble (L / 200L)
                    </span>
                  </div>

                  {plagSemana && plagSemana.sinAplicacion ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-start gap-2 text-xs text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold text-emerald-950">Sin Aplicación Fitosanitaria Requerida:</strong>
                        <span className="text-[11px]">
                          {plagSemana.motivoSinAplicacion || 'Poblaciones fitófagas y fúngicas por debajo del umbral económico. Mantener monitoreo semanal sin intervención química.'}
                        </span>
                      </div>
                    </div>
                  ) : plagSemana && plagSemana.aplicaciones && plagSemana.aplicaciones.length > 0 ? (
                    <div className="space-y-2">
                      {plagSemana.aplicaciones.map((app, aIdx) => (
                        <div key={aIdx} className="bg-white rounded-lg border border-slate-200 p-2 text-xs space-y-1.5">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.2 rounded text-[9px] font-black text-white ${
                                app.tipoMezcla === 'fungicida_foliar' ? 'bg-emerald-700' : 'bg-purple-800'
                              }`}>
                                {app.tipoMezcla === 'fungicida_foliar' ? 'MEZCLA 1 (Fungicida + Foliar)' : 'MEZCLA 2 (Insecticida + Acaricida)'}
                              </span>
                              <strong className="text-slate-900 text-[11px]">{app.nombre}</strong>
                            </div>
                            <span className="text-slate-500 font-semibold text-[10px]">Tanque: {app.volumenTanque}</span>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                              <thead>
                                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[10px]">
                                  <th className="py-1 px-1.5 font-bold w-7 text-center">Paso</th>
                                  <th className="py-1 px-1.5 font-bold">Insumo Comercial</th>
                                  <th className="py-1 px-1.5 font-bold">FRAC / IRAC</th>
                                  <th className="py-1 px-1.5 font-bold text-center text-blue-900 bg-blue-50/70 border-x border-blue-100">Dosis / Litro</th>
                                  <th className="py-1 px-1.5 font-bold text-center text-purple-950 bg-purple-50/70 border-r border-purple-100">Dosis / Estañón 200 L</th>
                                  <th className="py-1 px-1.5 font-bold">Función / Blanco</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {(app.ordenMezcla || []).map((l, lIdx) => {
                                  const dual = calcularDosisDual(l.dosis || '');
                                  const dLitro = l.dosisLitro || dual.dosisLitro;
                                  const dEstanon = l.dosisEstanon || dual.dosisEstanon;
                                  return (
                                    <tr key={lIdx} className="hover:bg-slate-50/50">
                                      <td className="py-1 px-1.5 text-center font-bold text-[9.5px] text-slate-500">
                                        {lIdx + 1}
                                      </td>
                                      <td className="py-1 px-1.5 font-bold text-slate-900">
                                        <span>{l.producto}</span>
                                        {l.registroSfe && (
                                          <span className="block text-[8.5px] font-bold text-emerald-800">
                                            🏛️ {l.registroSfe}
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-1 px-1.5 font-bold text-indigo-700 text-[10px]">
                                        {l.fracIrac || 'N/A'}
                                      </td>
                                      <td className="py-1 px-1.5 font-bold text-blue-900 text-center bg-blue-50/20 border-x border-blue-100 whitespace-nowrap">
                                        {dLitro}
                                      </td>
                                      <td className="py-1 px-1.5 font-black text-purple-950 text-center bg-purple-50/30 border-r border-purple-100 whitespace-nowrap">
                                        {dEstanon}
                                      </td>
                                      <td className="py-1 px-1.5 text-slate-600 text-[10px]">
                                        {l.funcion || ''}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {app.observacionesPie && (
                            <p className="text-[10px] text-slate-600 italic pt-0.5 border-t border-slate-100">
                              Instrucción: {app.observacionesPie}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded-lg border border-slate-200">
                      No se han programado aplicaciones fitosanitarias químicas para esta semana.
                    </p>
                  )}
                </div>

                {/* MARCO LEGAL Y FIRMA DEL INGENIERO (EN LA ÚLTIMA PÁGINA) */}
                {esUltimaSemana && (
                  <div className="border-t-2 border-slate-300 pt-3 mt-3">
                    <div className="flex flex-row items-center justify-between gap-4">
                      <div className="space-y-0.5 text-left">
                        <div className="text-base text-emerald-900 font-bold italic tracking-wide">
                          Ricardo M. Barquero Chacón
                        </div>
                        <div className="w-48 h-0.5 bg-slate-400"></div>
                        <p className="text-xs font-bold text-slate-900">
                          Ing. Agr. Ricardo Manuel Barquero Chacón
                        </p>
                        <p className="text-[10.5px] text-slate-600 font-medium">
                          Ingeniero Agrónomo • Colegiado No. 5896
                        </p>
                        <p className="text-[9px] text-slate-500">
                          Colegio de Ingenieros Agrónomos de Costa Rica • Tel: +506 8894-5662
                        </p>
                      </div>

                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-0.5 max-w-xs">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                          VALIDACIÓN OFICIAL BPA COSTA RICA
                        </span>
                        <p className="text-[9.5px] text-slate-600 leading-tight">
                          Prescripción conforme al marco fitosanitario nacional (SFE / MAG) y registro oficial.
                        </p>
                        <div className="pt-0.5 text-[9px] text-slate-400 font-mono">
                          REG-CR: 5896 • {visita?.fecha || '2026-03-10'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 pt-1 border-t border-slate-200 text-center text-[8.5px] text-slate-400">
                      © 2026 <strong>Ricardo Manuel Barquero Chacón</strong>. Todos los derechos reservados • AgroAsesor Pro CR™.
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Página Semanal */}
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[9px] text-slate-400">
                <span>AgroAsesor Pro CR™ • Ing. Agr. Ricardo M. Barquero Chacón (Col. 5896)</span>
                <span>Prescripción Técnica Oficial • Semana {semNum}</span>
                <span className="font-bold text-slate-700">Página {numPaginaActual} de {totalPaginas}</span>
              </div>
            </div>
          );
        })}
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
                    Se abrió la conversación de WhatsApp con el resumen de la visita?. Para que el cliente reciba el informe oficial completo, presione el icono de <strong>clip (📎) ➔ Documento</strong> y seleccione el archivo PDF descargado.
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
      {/* ========================================================= */}
      {/* MODAL HD VISOR FOTOGRÁFICO CIENTÍFICO (REVISTA) */}
      {/* ========================================================= */}
      {modalFotoHd && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn no-print">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-mono font-bold">
                  {modalFotoHd.figura}
                </span>
                <h4 className="font-bold text-sm text-white">{modalFotoHd.titulo}</h4>
              </div>
              <button 
                onClick={() => setModalFotoHd(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-black flex items-center justify-center p-2 overflow-auto min-h-[300px]">
              <img 
                src={modalFotoHd.url} 
                alt={modalFotoHd.titulo} 
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  {modalFotoHd.categoria}
                </span>
                <span className="font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800">
                  Severidad: {modalFotoHd.severidad}
                </span>
              </div>
              <p className="text-slate-200 leading-relaxed text-[11.5px]">
                {modalFotoHd.descripcion}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                <span>📍 Lote: {modalFotoHd.lote}</span>
                <span>📅 Fecha: {modalFotoHd.fecha}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
