import React, { useRef, useState } from 'react';
import { 
  FileText, Download, Share2, Mail, CheckCircle2, 
  Printer, Filter, FolderOpen, Paperclip, X
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { crAgroDatabase } from '../data/crAgroDatabase';
import { storageService } from '../services/storageService';
import { calcularDosisDual } from '../utils/doseCalculator';
import { agroEpidemiologyService } from '../services/agroEpidemiologyService';
import { calcularNutrientesTotales } from '../services/nutritionCalculatorService';

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

  // Agrupación de semanas con prescripción técnica
  const semanasFert = recFertirriegoFiltradas.map(s => s.semana || 1);
  const semanasPlag = recPlaguicidasFiltradas.map(s => s.semana || 1);
  const todasSemanas = Array.from(new Set([...semanasFert, ...semanasPlag])).sort((a, b) => a - b);
  const semanasParaReporte = todasSemanas.length > 0 ? todasSemanas : [1];

  // Paginación inteligente de hallazgos para formato Revista Científica (CERO CORTES Y HD NATIVO)
  const paginasHallazgos = (() => {
    const items = hallazgosFiltrados;
    const tieneSuelo = medicionesSuelo.length > 0;
    
    // Si hay mediciones de suelo, la primera página solo tiene espacio para 2 hallazgos cómodos
    if (tieneSuelo) {
      if (items.length <= 2) {
        return [items];
      }
      const paginas = [items.slice(0, 2)];
      let restante = items.slice(2);
      while (restante.length > 0) {
        paginas.push(restante.slice(0, 4));
        restante = restante.slice(4);
      }
      return paginas;
    } else {
      // Sin suelo: cuadrícula 2x2 de hasta 4 especímenes por página
      if (items.length <= 4) {
        return [items];
      }
      const paginas = [];
      let restante = [...items];
      while (restante.length > 0) {
        paginas.push(restante.slice(0, 4));
        restante = restante.slice(4);
      }
      return paginas;
    }
  })();

  // Paginación inteligente de prescripciones semanales para garantizar CERO CORTES de tablas o textos
  const paginasSemanales = (() => {
    const paginas = [];
    
    semanasParaReporte.forEach((semNum) => {
      const fertSemana = recFertirriegoFiltradas.find(s => s.semana === semNum);
      const plagSemana = recPlaguicidasFiltradas.find(s => s.semana === semNum);

      const numEventosFert = fertSemana?.eventos?.length || 0;
      const totalLineasFert = (fertSemana?.eventos || []).reduce((acc, ev) => 
        acc + (ev.lineasTanqueA?.length || 0) + (ev.lineasTanqueB?.length || 0) + (ev.productos?.length || 0), 0);
      
      const numAppsPlag = plagSemana?.aplicaciones?.length || 0;
      const totalLineasPlag = (plagSemana?.aplicaciones || []).reduce((acc, app) => 
        acc + (app.ordenMezcla?.length || 0), 0);

      // Si una semana tiene tanto fertirriego denso como múltiples aplicaciones con muchas líneas,
      // se divide en 2 sub-páginas semanales dedicadas con encabezado completo repetido para evitar cualquier corte.
      const esMuyExtensa = (totalLineasFert > 4 && totalLineasPlag > 2) || (numEventosFert >= 2 && numAppsPlag >= 2) || (totalLineasPlag >= 6);

      if (esMuyExtensa) {
        // Sub-página 1: Fertirriego y Nutrición
        paginas.push({
          semana: semNum,
          subTipo: 'fertirriego',
          tituloSubSeccion: 'A. Programa Nutricional y Fertirriego',
          fertSemana,
          plagSemana: null,
          esParteDeDivision: true,
          parteNum: 1,
          totalPartes: 2
        });
        // Sub-página 2: Fitosanitarios
        paginas.push({
          semana: semNum,
          subTipo: 'fitosanitarios',
          tituloSubSeccion: 'B. Programa Fitosanitario Foliar Segregado',
          fertSemana: null,
          plagSemana,
          esParteDeDivision: true,
          parteNum: 2,
          totalPartes: 2
        });
      } else {
        // Página combinada estándar (la gran mayoría de las semanas)
        paginas.push({
          semana: semNum,
          subTipo: 'mixto',
          tituloSubSeccion: null,
          fertSemana,
          plagSemana,
          esParteDeDivision: false,
          parteNum: 1,
          totalPartes: 1
        });
      }
    });

    return paginas.length > 0 ? paginas : [{
      semana: 1,
      subTipo: 'mixto',
      tituloSubSeccion: null,
      fertSemana: null,
      plagSemana: null,
      esParteDeDivision: false,
      parteNum: 1,
      totalPartes: 1
    }];
  })();

  // Conteo total de páginas del informe oficial
  const totalPaginas = 1 + paginasHallazgos.length + paginasSemanales.length;

  // Generar Blob y File del PDF asegurando captura página-por-página en 300 DPI (CERO CORTES)
  const generarPdfBlobYArchivo = async () => {
    if (!reportRef.current) return null;
    const container = reportRef.current;

    const estabaOculto = container.classList.contains('hidden');
    const originalStyles = {
      position: container.style.position,
      left: container.style.left,
      top: container.style.top,
      width: container.style.width,
      maxWidth: container.style.maxWidth,
      minWidth: container.style.minWidth,
      display: container.style.display,
      zIndex: container.style.zIndex
    };

    // Activar contenedor a ancho estandarizado de 816px (8.5 pulgadas a 96 DPI)
    container.classList.remove('hidden');
    container.classList.add('pdf-capture-active');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '816px';
    container.style.maxWidth = '816px';
    container.style.minWidth = '816px';
    container.style.display = 'block';
    container.style.zIndex = '-9999';

    try {
      await new Promise(resolve => setTimeout(resolve, 250));

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
        const renderH = (canvas.height * pageWidth) / canvas.width;
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, Math.min(renderH, pageHeight), undefined, 'FAST');
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
          const canvasW = canvas.width;
          const canvasH = canvas.height;

          // Cálculo proporcional para evitar cualquier distorsión o aplastamiento
          let renderW = pageWidth;
          let renderH = (canvasH * pageWidth) / canvasW;
          let posX = 0;
          let posY = 0;

          if (renderH > pageHeight) {
            renderH = pageHeight;
            renderW = (canvasW * pageHeight) / canvasH;
            posX = (pageWidth - renderW) / 2;
          }

          pdf.addImage(imgData, 'JPEG', posX, posY, renderW, renderH, undefined, 'FAST');
        }
      }

      const nombreLoteStr = filtroLote === 'todos' ? 'Consolidado' : filtroLote.replace(/\s+/g, '_');
      const fincaLimpia = (finca.nombre || 'Finca').replace(/\s+/g, '_');
      const fileName = `Informe_${fincaLimpia}_${nombreLoteStr}_${visita?.fecha || '2026'}.pdf`;

      const pdfBlob = pdf.output('blob');
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      return { pdf, pdfBlob, pdfFile, fileName };
    } finally {
      container.classList.remove('pdf-capture-active');
      if (estabaOculto) {
        container.classList.add('hidden');
      }
      container.style.position = originalStyles.position;
      container.style.left = originalStyles.left;
      container.style.top = originalStyles.top;
      container.style.width = originalStyles.width;
      container.style.maxWidth = originalStyles.maxWidth;
      container.style.minWidth = originalStyles.minWidth;
      container.style.display = originalStyles.display;
      container.style.zIndex = originalStyles.zIndex;
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
      {/* VISTA 1: VERSIÓN DIGITAL MÓVIL OPTIMIZADA PARA TELÉFONO DE PRODUCTORES */}
      {/* Tipografía ergonómica de 14px a 16px para lectura en campo sin zoom */}
      {/* ========================================================= */}
      {vistaModo === 'digital' && (
        <div className="space-y-4 max-w-xl mx-auto px-3 sm:px-4 py-1 mobile-view-container no-print font-body">
          
          {/* TARJETA DE IDENTIFICACIÓN PARA EL PRODUCTOR */}
          <div className="bg-white rounded-2xl p-4 border border-[#dae2fd] shadow-sm space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#00652c] flex items-center gap-1">
                🌱 AgroAsesor Pro CR • Informe Técnico
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                {visita?.fecha || '2026-03-10'}
              </span>
            </div>
            <div>
              <h2 className="font-headline font-bold text-lg sm:text-xl text-[#131b2e] leading-snug">
                {productor.nombre || 'Productor'}
              </h2>
              <p className="text-sm font-semibold text-[#00652c]">
                Finca: {finca.nombre || 'Finca Principal'} • {filtroLote === 'todos' ? 'Consolidado Finca' : `Lote ${filtroLote}`}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Cultivo: <strong>{lote.cultivoNombre || 'Cultivo'}</strong> ({lote.variedad || 'Estándar'}) • Asesor: Ing. Agr. Ricardo M. Barquero Chacón (Col. 5896)
              </p>
            </div>
          </div>

          {/* BANNER OFICIAL AGROIA VISION ACTIVO (LETRA LEGIBLE 14px-16px) */}
          <div className="bg-[#e2e7ff] rounded-2xl p-4 shadow-sm flex items-start gap-3 relative overflow-hidden border border-[#dae2fd]">
            <div className="w-11 h-11 rounded-2xl bg-[#00652c] text-white flex items-center justify-center font-bold text-2xl shadow-sm shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[26px]">psychology</span>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#00652c] uppercase font-bold tracking-wider">
                  AgroIA Vision Activo
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#acf847] animate-pulse"></span>
              </div>
              <p className="font-headline font-bold text-base text-[#131b2e] leading-tight mt-0.5">
                {hallazgosFiltrados.length} hallazgos analizados en campo
              </p>
              <p className="font-body text-sm text-[#283044] mt-1 leading-normal">
                Diagnóstico fitosanitario y fenológico con 96% de precisión promedio para <strong>{finca.nombre || 'la finca'}</strong>.
              </p>
            </div>
          </div>

          {/* BOTONES PRINCIPALES DE ENVÍO Y DESCARGA (TAMAÑO TÁCTIL GRANDE) */}
          <div className="space-y-2">
            <button
              onClick={handleCompartirPDFNativo}
              disabled={generandoPdf}
              className="w-full min-h-[50px] py-3.5 px-4 bg-gradient-to-r from-[#00652c] to-[#15803d] hover:from-[#005323] hover:to-[#00652c] text-white rounded-2xl font-headline font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition active:scale-98 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
              <span>Compartir Reporte Oficial con PDF Adjunto</span>
            </button>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={handleCompartirWhatsAppConPDF}
                disabled={generandoPdf}
                className="min-h-[44px] py-2.5 px-3 bg-[#f2f3ff] hover:bg-[#e2e7ff] text-[#00652c] border border-[#dae2fd] rounded-xl font-headline font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition shadow-xs active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
                <span>WhatsApp + PDF</span>
              </button>
              
              <button
                onClick={handleEnviarCorreoConPDF}
                disabled={generandoPdf}
                className="min-h-[44px] py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-headline font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition shadow-xs active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">mail</span>
                <span>Correo + PDF</span>
              </button>

              <button
                onClick={handleDescargarPDF}
                disabled={generandoPdf}
                className="min-h-[44px] py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-headline font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition shadow-xs col-span-2 sm:col-span-1 active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Descargar PDF</span>
              </button>
            </div>
          </div>

          {/* PARÁMETROS GEOCLIMÁTICOS Y SATELITALES (GRANDES PARA LECTURA AL SOL) */}
          <div className="bg-white p-4 rounded-2xl border border-[#dae2fd] shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-headline font-bold text-sm uppercase tracking-wider text-[#00652c] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px]">satellite_alt</span>
                <span>Telemetría y Clima de la Finca</span>
              </h4>
              <span className="text-xs font-mono font-bold text-[#005b8c] bg-[#e2e7ff] px-2.5 py-0.5 rounded-full">
                Satélite DEM & Virtual
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-[#faf8ff] p-3 rounded-xl border border-[#eaedff]">
                <span className="text-xs text-slate-500 block font-medium">🏔️ Altitud Finca</span>
                <strong className="font-mono text-[#00652c] font-black text-lg sm:text-xl">{altitudFinca} msnm</strong>
              </div>
              <div className="bg-[#faf8ff] p-3 rounded-xl border border-[#eaedff]">
                <span className="text-xs text-slate-500 block font-medium">🌧️ Lluvia 7 días</span>
                <strong className="font-mono text-[#005b8c] font-black text-lg sm:text-xl">{lluvia7d} mm</strong>
              </div>
              <div className="bg-[#faf8ff] p-3 rounded-xl border border-[#eaedff]">
                <span className="text-xs text-slate-500 block font-medium">💧 Humedad Relativa</span>
                <strong className="font-mono text-cyan-900 font-black text-lg sm:text-xl">{humedadFinca}%</strong>
              </div>
              <div className="bg-[#faf8ff] p-3 rounded-xl border border-[#eaedff]">
                <span className="text-xs text-slate-500 block font-medium">🌡️ Temperatura</span>
                <strong className="font-mono text-orange-900 font-black text-lg sm:text-xl">{tempFinca}°C</strong>
              </div>
            </div>

            {/* OBSERVACIONES I.A. SOBRE FACTORES CLIMÁTICOS (LETRA 14PX) */}
            <div className="bg-[#f2f3ff] p-3.5 rounded-xl border border-[#e2e7ff] space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#dae2fd] pb-1.5">
                <span className="font-headline font-bold text-[#00652c] flex items-center gap-1.5 text-sm">
                  <span className="material-symbols-outlined text-[18px] text-[#416900]">auto_awesome</span>
                  Observaciones y Diagnóstico de la I.A.:
                </span>
                <span className="text-xs font-mono font-bold text-[#00652c] bg-[#d3ffd5] px-2 py-0.5 rounded-full">
                  Validado
                </span>
              </div>
              <p className="text-slate-800 text-sm leading-relaxed">
                {analisisClimaIa.impactoFisiologico}
              </p>

              {/* Badges de Enfermedades y Plagas */}
              {analisisClimaIa.enfermedadesPropensas?.length > 0 && (
                <div className="space-y-1 pt-1.5 border-t border-[#dae2fd]">
                  <span className="font-headline text-xs font-bold text-amber-900 block uppercase">
                    🍄 Alertas de Patógenos por Clima Actual:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {analisisClimaIa.enfermedadesPropensas.map((enf, eIdx) => (
                      <span key={eIdx} className="text-xs bg-white px-2.5 py-1 rounded-lg border border-amber-200 text-amber-950 font-medium shadow-2xs">
                        <strong>{enf.patogeno}</strong> <span className="font-mono text-xs font-bold text-red-600">({enf.riesgo})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MEDICIONES DE SUELO EN CAMPO (LETRA CLARA Y LEGIBLE) */}
          {medicionesSuelo.length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-[#dae2fd] shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-headline font-bold text-sm uppercase tracking-wider text-[#00652c] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[20px]">science</span>
                  <span>Mediciones de Suelo en Campo</span>
                </h4>
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  {medicionesSuelo.length} lecturas
                </span>
              </div>
              <div className="space-y-2.5">
                {medicionesSuelo.map((m, mIdx) => (
                  <div key={m.id || mIdx} className="bg-[#faf8ff] p-3.5 rounded-xl border border-[#eaedff] space-y-2">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-900 text-sm">{m.loteNombre || 'Lote Evaluado'}</span>
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                        {m.metodo || 'Sonda directa'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 text-center py-2 bg-white rounded-xl border border-slate-200/80 font-mono">
                      <div><span className="text-xs text-slate-400 block font-body">pH</span><strong className="text-sm text-slate-900">{m.phSuelo}</strong></div>
                      <div><span className="text-xs text-slate-400 block font-body">CE</span><strong className="text-sm text-slate-900">{m.ceSuelo}</strong></div>
                      <div><span className="text-xs text-slate-400 block font-body">Temp</span><strong className="text-sm text-slate-900">{m.tempSuelo}°C</strong></div>
                      <div><span className="text-xs text-slate-400 block font-body">Humedad</span><strong className="text-sm text-slate-900">{m.humedadSuelo}</strong></div>
                    </div>
                    {m.ajusteRecomendado && (
                      <p className="text-xs sm:text-sm text-slate-800 leading-normal pt-1 border-t border-slate-200">
                        <strong className="text-[#00652c]">Ajuste Recomendado:</strong> {m.ajusteRecomendado}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CAPTURAS DE CAMPO STITCH DESIGN (PROPORCIÓN 4:3 SIN RECORTES CON TEXTO 14PX) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-1.5">
                <span className="font-headline font-bold text-base text-[#131b2e]">Diagnóstico Visual de Hallazgos</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#eaedff] text-[#131b2e] font-mono text-xs font-bold">
                  {hallazgosFiltrados.length}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Fotos HD 4:3
              </span>
            </div>

            {hallazgosFiltrados.map((h, idx) => {
              const esCritico = h.severidad?.toLowerCase().includes('alta') || h.severidad?.toLowerCase().includes('crítica');
              const esOptimo = h.severidad?.toLowerCase().includes('baja') || h.severidad?.toLowerCase().includes('leve');
              
              return (
                <div key={h.id || idx} className="stitch-finding-card flex flex-col overflow-hidden bg-white shadow-sm border border-[#dae2fd]">
                  {/* Visor 4:3 con Foto y Bounding Box IA */}
                  <div 
                    onClick={() => setModalFotoHd({
                      url: h.fotoAnotada,
                      figura: `Figura ${idx + 1}`,
                      titulo: h.titulo,
                      categoria: h.categoria,
                      severidad: h.severidad,
                      lote: h.loteNombre || lote.nombre,
                      fecha: h.fecha || visita?.fecha,
                      descripcion: h.descripcion
                    })}
                    className="relative w-full aspect-[4/3] bg-[#0b1120] overflow-hidden cursor-pointer group"
                    title="Toque para ampliar en pantalla completa"
                  >
                    {h.fotoAnotada ? (
                      <img 
                        src={h.fotoAnotada} 
                        alt={h.titulo} 
                        className="w-full h-full object-contain block transition-transform duration-300 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-mono text-sm">
                        Sin fotografía adjunta
                      </div>
                    )}

                    {/* Badge Flotante Superior Izquierdo */}
                    <div className={`absolute top-2.5 left-2.5 flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md shadow-sm text-xs font-headline font-bold uppercase ${
                      esCritico 
                        ? 'bg-[#ffdad6]/95 text-[#93000a]' 
                        : (esOptimo ? 'bg-[#d3ffd5]/95 text-[#005323]' : 'bg-[#dae2fd]/95 text-[#004b73]')
                    }`}>
                      <span className="material-symbols-outlined text-[16px]">
                        {esCritico ? 'warning' : (esOptimo ? 'eco' : 'science')}
                      </span>
                      <span className="font-mono text-xs">
                        FIG. {idx + 1} • {esCritico ? 'Foco Crítico' : (esOptimo ? 'Estado Óptimo' : 'Alerta')}
                      </span>
                    </div>

                    {/* Retícula de Bounding Box de Inteligencia Artificial */}
                    <div className="absolute top-1/4 right-1/4 w-36 h-28 border-2 border-dashed border-[#acf847] rounded-lg pointer-events-none flex flex-col justify-between p-1.5 bg-[#acf847]/10 backdrop-blur-[1px]">
                      <span className="px-1.5 py-0.5 rounded bg-[#283044]/90 text-white font-mono text-[9px] self-start leading-none">
                        IA: Detección Activa (98%)
                      </span>
                      <span className="material-symbols-outlined text-[#acf847] text-[16px] self-end animate-bounce">
                        center_focus_strong
                      </span>
                    </div>

                    {/* Scrim Inferior con Gradiente Oscuro y Coordenadas GPS */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#283044]/95 via-[#283044]/80 to-transparent p-3 pt-6 flex items-end justify-between text-white">
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-headline font-bold text-sm sm:text-base truncate leading-tight">
                          {h.titulo}
                        </span>
                        <span className="font-body text-xs text-white/90 truncate">
                          {h.categoria} • Severidad: {h.severidad}
                        </span>
                      </div>
                      <div className="flex flex-col items-end text-white/90 font-mono text-[10px] shrink-0">
                        <span>{finca.gps?.lat || '10.0215'}°N, {finca.gps?.lon || '-83.9482'}°W</span>
                        <span className="text-white/70">Lote: {h.loteNombre || '1'} • {h.fecha || visita?.fecha}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cuerpo de la Tarjeta (Texto 14px legible para el productor) */}
                  <div className="p-3.5 sm:p-4 flex flex-col gap-2.5 bg-white text-sm">
                    <p className="font-body text-slate-800 leading-normal">
                      <strong className="text-[#00652c] font-headline font-bold">Figura {idx + 1}: </strong>
                      {h.descripcion}
                    </p>

                    {/* Tarjeta de Recomendación Inmediata IA */}
                    <div className="rounded-xl bg-[#f2f3ff] p-3 flex items-start gap-2.5 border border-[#e2e7ff]">
                      <div className="p-1.5 rounded-lg bg-[#acf847] text-[#416900] flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-mono text-xs text-[#416900] font-bold uppercase tracking-wider">
                          Recomendación IA Inmediata
                        </span>
                        <p className="font-body text-sm text-[#131b2e] mt-0.5 leading-snug font-medium">
                          {h.recomendacionIa || 'Aplicación preventiva inmediata recomendada para frenar esporulación en el lote.'}
                        </p>
                      </div>
                    </div>

                    {/* Pie de Validación */}
                    <div className="flex items-center justify-between pt-1 text-xs text-slate-500 font-mono border-t border-slate-100">
                      <span>{finca.nombre || 'Finca'} • Lote {h.loteNombre || '1'}</span>
                      <span className="text-[#005b8c] font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">check_circle</span>
                        Ing. Barquero (Col. 5896)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PRESCRIPCIÓN SEMANAL DE FERTIRRIEGO Y NUTRICIÓN (FORMATO MÓVIL) */}
          {recFertirriegoFiltradas.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-headline font-bold text-sm uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#005b8c]">water_drop</span>
                <span>Programa de Nutrición y Fertirriego</span>
              </h4>
              {recFertirriegoFiltradas.map(s => (
                <div key={s.semana} className="bg-white p-4 rounded-2xl border border-[#dae2fd] shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2">
                    <span className="font-headline font-bold text-[#00652c] text-base">
                      Prescripción Semana {s.semana}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {s.etapaFenologica && (
                        <span className="text-xs font-mono font-bold bg-[#d3ffd5] text-[#005323] px-2.5 py-0.5 rounded-full border border-[#79db8d]">
                          🌿 {s.etapaFenologica}
                        </span>
                      )}
                      {s.objetivoFertilizacion && (
                        <span className="text-xs font-mono font-bold bg-[#e2e7ff] text-[#004b73] px-2.5 py-0.5 rounded-full border border-[#dae2fd]">
                          🎯 {s.objetivoFertilizacion}
                        </span>
                      )}
                    </div>
                  </div>

                  {(s.eventos || []).map((ev, i) => (
                    <div key={i} className="bg-[#faf8ff] p-3.5 rounded-xl border border-[#eaedff] space-y-2">
                      <div className="flex justify-between items-center font-bold text-slate-900 text-sm">
                        <span>{ev.nombreEvento || ev.nombre || 'Fertirriego'}</span>
                        <div className="flex items-center gap-1 font-mono text-xs">
                          {ev.conductividadObjetivo && (
                            <span className="px-2 py-0.5 rounded bg-[#d3ffd5] text-[#005323] font-bold">
                              CE: {ev.conductividadObjetivo}
                            </span>
                          )}
                          {ev.phObjetivo && (
                            <span className="px-2 py-0.5 rounded bg-[#e2e7ff] text-[#004b73] font-bold">
                              pH: {ev.phObjetivo}
                            </span>
                          )}
                        </div>
                      </div>

                      {ev.lineasTanqueA && ev.lineasTanqueB ? (
                        <div className="space-y-2">
                          <div className="bg-[#e2e7ff]/40 p-2.5 rounded-lg border border-[#dae2fd]">
                            <strong className="text-[#004b73] block text-xs font-headline font-bold uppercase mb-1">
                              🔵 Tanque A (Calcio / Nitratos):
                            </strong>
                            <ul className="space-y-1 text-slate-800 font-mono text-xs sm:text-sm">
                              {ev.lineasTanqueA.map((l, li) => (
                                <li key={li} className="flex justify-between items-center">
                                  <span>{l.producto}</span>
                                  <strong className="text-[#004b73]">{l.dosis} {l.unidad}</strong>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200">
                            <strong className="text-amber-900 block text-xs font-headline font-bold uppercase mb-1">
                              🟡 Tanque B (Fósforo / Sulfatos / Micros):
                            </strong>
                            <ul className="space-y-1 text-slate-800 font-mono text-xs sm:text-sm">
                              {ev.lineasTanqueB.map((l, li) => (
                                <li key={li} className="flex justify-between items-center">
                                  <span>{l.producto}</span>
                                  <strong className="text-amber-950">{l.dosis} {l.unidad}</strong>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <ul className="space-y-1 text-slate-800 font-mono text-xs sm:text-sm">
                            {(ev.productos || []).map((l, li) => (
                              <li key={li} className="flex justify-between items-center">
                                <span>{l.producto}</span>
                                <strong className="text-[#00652c]">{l.dosis} {l.unidad}</strong>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {ev.observacionesPie && (
                        <p className="text-xs text-slate-500 italic pt-1 border-t border-slate-200">
                          Instrucción: {ev.observacionesPie}
                        </p>
                      )}
                    </div>
                  ))}

                  {/* BALANCE NUTRICIONAL ESTEQUIOMÉTRICO (STITCH STYLE) */}
                  {(() => {
                    const lineas = (s.eventos || []).flatMap(ev => [
                      ...(ev.lineasTanqueA || []),
                      ...(ev.lineasTanqueB || []),
                      ...(ev.productos || [])
                    ]);
                    const m = calcularNutrientesTotales(lineas);
                    if (!m || (m.nTotalKg <= 0 && m.p2o5Kg <= 0 && m.k2oKg <= 0)) return null;
                    return (
                      <div className="bg-[#faf8ff] p-3 rounded-xl border border-[#eaedff] space-y-2">
                        <div className="flex items-center justify-between text-xs font-headline font-bold text-[#00652c]">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-[#416900]">balance</span>
                            <span>Aporte Nutricional Elemental Calculado:</span>
                          </span>
                          <span className="font-mono text-[11px] font-bold text-[#005b8c] bg-[#e2e7ff] px-2 py-0.5 rounded-full">
                            K:N = {m.relacionKN || 'Equilibrado'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center font-mono text-xs">
                          <div className="bg-white p-2 rounded-lg border border-slate-200">
                            <span className="text-slate-500 block text-[10px] font-body">N Total</span>
                            <strong className="text-[#00652c] font-black">{m.nTotalKg} kg</strong>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200">
                            <span className="text-slate-500 block text-[10px] font-body">P₂O₅</span>
                            <strong className="text-amber-900 font-black">{m.p2o5Kg} kg</strong>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200">
                            <span className="text-slate-500 block text-[10px] font-body">K₂O</span>
                            <strong className="text-purple-900 font-black">{m.k2oKg} kg</strong>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200">
                            <span className="text-slate-500 block text-[10px] font-body">CaO</span>
                            <strong className="text-blue-900 font-black">{m.caoKg} kg</strong>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200">
                            <span className="text-slate-500 block text-[10px] font-body">MgO</span>
                            <strong className="text-emerald-900 font-black">{m.mgoKg} kg</strong>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200">
                            <span className="text-slate-500 block text-[10px] font-body">Azufre (S)</span>
                            <strong className="text-yellow-900 font-black">{m.sKg} kg</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}

          {/* MANEJO FITOSANITARIO FOLIAR SEGREGADO (SIN COLUMNA FUNCIÓN/BLANCO, DOBLE DOSIS DESTACADA) */}
          {recPlaguicidasFiltradas.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-headline font-bold text-sm uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#00652c]">shield</span>
                <span>Manejo Fitosanitario Foliar Segregado</span>
              </h4>
              {recPlaguicidasFiltradas.map(s => (
                <div key={s.semana} className="bg-white p-4 rounded-2xl border border-[#dae2fd] shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-headline font-bold text-[#00652c] text-base">
                      Recetas Semana {s.semana}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      Rotación FRAC / IRAC
                    </span>
                  </div>

                  {s.sinAplicacion ? (
                    <div className="p-3.5 bg-[#d3ffd5]/50 border border-[#79db8d] rounded-xl text-sm text-[#005323] font-medium flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      <span>No requiere aplicaciones fitosanitarias esta semana. Mantener monitoreo preventivo.</span>
                    </div>
                  ) : (
                    (s.aplicaciones || []).map((app, i) => (
                      <div key={i} className="bg-[#faf8ff] p-3.5 rounded-xl border border-[#eaedff] space-y-2.5">
                        <div className="flex justify-between items-center font-bold text-slate-900 text-sm">
                          <span className="font-headline text-[#00652c] text-base">{app.nombre}</span>
                          <span className="text-slate-600 font-mono text-xs bg-white px-2 py-0.5 rounded border">
                            Tanque: {app.volumenTanque}
                          </span>
                        </div>

                        {/* LISTA SECUENCIAL DE MEZCLA CON DOBLE DOSIS DESTACADA */}
                        <div className="space-y-2">
                          {(app.ordenMezcla || []).map((l, li) => {
                            const dual = calcularDosisDual(l.dosis || '');
                            const dL = l.dosisLitro || dual.dosisLitro;
                            const dE = l.dosisEstanon || dual.dosisEstanon;
                            return (
                              <div key={li} className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-md bg-[#eaedff] text-[#131b2e] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                                      {li + 1}
                                    </span>
                                    <div>
                                      <strong className="font-headline text-slate-900 text-sm sm:text-base block">
                                        {l.producto}
                                      </strong>
                                      {l.registroSfe && (
                                        <span className="font-mono text-[10px] text-[#00652c] font-bold block">
                                          🏛️ {l.registroSfe}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className="font-mono text-xs font-bold text-[#005b8c] bg-[#e2e7ff] px-2 py-0.5 rounded">
                                    {l.fracIrac || 'N/A'}
                                  </span>
                                </div>

                                {/* PÍLDORAS DE DOSIS (LITRO Y ESTAÑÓN 200 L) */}
                                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 font-mono">
                                  <div className="bg-[#e2e7ff]/60 px-2.5 py-1.5 rounded-lg border border-[#dae2fd]">
                                    <span className="text-[10px] text-slate-500 block font-body">Dosis / Litro:</span>
                                    <strong className="text-xs sm:text-sm text-[#005b8c] font-black">{dL}</strong>
                                  </div>
                                  <div className="bg-[#d3ffd5]/60 px-2.5 py-1.5 rounded-lg border border-[#79db8d]">
                                    <span className="text-[10px] text-slate-500 block font-body">Dosis / Estañón (200 L):</span>
                                    <strong className="text-xs sm:text-sm text-[#00652c] font-black">{dE}</strong>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {app.observacionesPie && (
                          <p className="text-xs text-slate-500 italic pt-1 border-t border-slate-100">
                            Instrucción: {app.observacionesPie}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          )}

          {/* FIRMA Y RESPALDO TÉCNICO AL FINAL */}
          <div className="bg-white p-4 rounded-2xl border border-[#dae2fd] shadow-sm text-center space-y-1 font-body text-xs text-slate-500">
            <p className="font-headline font-bold text-sm text-[#00652c]">
              Ing. Agr. Ricardo Manuel Barquero Chacón
            </p>
            <p className="font-mono text-xs text-slate-700">
              Colegiado No. 5896 • Tel: +506 8894-5662
            </p>
            <p className="text-[11px] text-slate-400">
              Colegio de Ingenieros Agrónomos de Costa Rica • AgroAsesor Pro CR™
            </p>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA 2: DOSSIER EDITORIAL STITCH DESIGN SYSTEM (PANTALLA Y PDF) */}
      {/* ========================================================= */}
      <div 
        ref={reportRef} 
        className={`report-sheet max-w-4xl mx-auto text-[#131b2e] font-body ${vistaModo === 'documento' ? 'block' : 'hidden print:block'}`}
      >
        
        {/* ========================================================= */}
        {/* PÁGINA 1: PORTADA EJECUTIVA, AGROCLIMA Y DIAGNÓSTICO I.A. */}
        {/* ========================================================= */}
        <div className="report-editorial-page page-1 bg-[#ffffff]">
          <div className="space-y-2.5">
            {/* ENCABEZADO OFICIAL STITCH DEL PROFESIONAL */}
            <div className="border-b-2 border-[#00652c] pb-3">
              <div className="flex flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#00652c] text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
                    🌱
                  </div>
                  <div>
                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#00652c] block">
                      ASESORÍA TÉCNICA AGRONÓMICA PROFESIONAL
                    </span>
                    <h1 className="font-headline text-base sm:text-lg font-bold text-[#131b2e] tracking-tight leading-tight">
                      Ing. Agr. Ricardo M. Barquero Chacón
                    </h1>
                    <p className="font-headline text-[11px] font-semibold text-[#3f493f]">
                      Ingeniero Agrónomo • Colegiado No. 5896
                    </p>
                    <p className="font-body text-[9.5px] text-slate-500">
                      Tel: {perfilIngeniero.telefono || '+506 8894-5662'} • {perfilIngeniero.ubicacion || 'Coronado, San José, Costa Rica'} • {perfilIngeniero.email || 'h7coordinador@gmail.com'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-headline font-bold bg-[#d3ffd5] text-[#005323] border border-[#79db8d]">
                    INFORME TÉCNICO OFICIAL
                  </span>
                  <div className="mt-1 text-[11px] font-mono font-bold text-slate-700">
                    <span>Fecha: </span>
                    <span className="text-[#131b2e]">{visita?.fecha || '2026-03-10'}</span>
                  </div>
                  <div className="text-[9.5px] text-slate-400 font-mono">
                    Folio: AGRO-CR-{visita?.id?.slice(-5) || '001'}
                  </div>
                </div>
              </div>
            </div>

            {/* RESUMEN EJECUTIVO PARA EL PRODUCTOR */}
            <div className="bg-[#f2f3ff] border border-[#dae2fd] rounded-xl p-2.5">
              <h3 className="font-headline font-bold text-[10.5px] uppercase tracking-wider text-[#00652c] mb-0.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#00652c]">task_alt</span>
                <span>Guía de Trabajo para el Productor:</span>
              </h3>
              <p className="font-body text-[10.5px] text-[#131b2e] leading-snug">
                Estimado(a) <strong>{productor.nombre || 'Productor'}</strong>: Presento el informe agronómico correspondiente a la visita en la finca <strong>{finca.nombre || 'la finca'}</strong>. 
                {filtroLote !== 'todos' ? ` Evaluación consolidada para el lote ${filtroLote}.` : ' Valoración técnica integral de la finca y sus unidades productivas.'} 
                Se documentaron <strong>{hallazgosFiltrados.length} hallazgos</strong> en campo, parámetros automáticos y geoclima satelital, análisis de suelo y las prescripciones semanales correspondientes.
              </p>
            </div>

            {/* 1. DATOS GENERALES DE LA ASESORÍA */}
            <div>
              <h3 className="font-headline font-bold text-[10.5px] uppercase tracking-wider text-[#131b2e] mb-1 pb-0.5 border-b border-slate-200 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-md bg-[#d3ffd5] text-[#00652c] flex items-center justify-center font-mono text-[10px] font-bold">1</span>
                Datos Generales de la Asesoría
              </h3>
              <div className="grid grid-cols-4 print:grid-cols-4 print-grid-4 gap-1.5 text-xs">
                <div className="bg-[#faf8ff] p-2 rounded-lg border border-[#eaedff]">
                  <span className="text-slate-400 block text-[9.5px]">Productor / Cliente:</span>
                  <strong className="text-[#131b2e] font-headline font-bold text-[11px] truncate block">{productor.nombre || 'N/A'}</strong>
                  <span className="font-mono text-slate-500 block text-[9.5px]">{productor.telefono || ''}</span>
                </div>
                <div className="bg-[#faf8ff] p-2 rounded-lg border border-[#eaedff]">
                  <span className="text-slate-400 block text-[9.5px]">Finca Evaluada:</span>
                  <strong className="text-[#131b2e] font-headline font-bold text-[11px] truncate block">{finca.nombre || 'N/A'}</strong>
                  <span className="text-slate-500 block text-[9.5px] truncate">{finca.ubicacion || 'Costa Rica'}</span>
                </div>
                <div className="bg-[#faf8ff] p-2 rounded-lg border border-[#eaedff]">
                  <span className="text-slate-400 block text-[9.5px]">Alcance del Reporte:</span>
                  <strong className="text-[#131b2e] font-headline font-bold text-[11px] truncate block">
                    {filtroLote === 'todos' ? 'Toda la Finca' : filtroLote}
                  </strong>
                  <span className="font-mono text-slate-500 block text-[9.5px]">{lote.area || 'N/A'}</span>
                </div>
                <div className="bg-[#faf8ff] p-2 rounded-lg border border-[#eaedff]">
                  <span className="text-slate-400 block text-[9.5px]">Cultivo y Variedad:</span>
                  <strong className="text-[#00652c] font-headline font-bold text-[11px] truncate block">{lote.cultivoNombre || 'N/A'}</strong>
                  <span className="text-[#416900] block text-[9.5px] font-semibold truncate">Var: {lote.variedad || 'Estándar'}</span>
                </div>
              </div>
            </div>

            {/* 2. TABLA DE PARÁMETROS AUTOMÁTICOS Y CONDICIONES AGROCLIMÁTICAS */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 mb-1 pb-0.5">
                <h3 className="font-headline font-bold text-[10.5px] uppercase tracking-wider text-[#131b2e] flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-md bg-[#cce5ff] text-[#004b73] flex items-center justify-center font-mono text-[10px] font-bold">2</span>
                  Tabla de Parámetros Automáticos y Condiciones Agroclimáticas de la Finca
                </h3>
                <span className="font-mono text-[9px] font-bold text-[#005b8c] bg-[#e2e7ff] px-2 py-0.2 rounded">
                  ⚡ Satélite DEM & Estación Virtual
                </span>
              </div>

              <div className="overflow-hidden border border-[#dae2fd] rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#eaedff] text-[#131b2e] font-headline font-bold border-b border-[#dae2fd] text-[10px]">
                    <tr>
                      <th className="p-1.5">Parámetro Automático</th>
                      <th className="p-1.5">Valor Registrado</th>
                      <th className="p-1.5">Origen / Sistema</th>
                      <th className="p-1.5">Interpretación Técnica / Piso Agronómico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaedff] bg-white text-[10px]">
                    <tr>
                      <td className="p-1.5 font-bold text-[#131b2e] flex items-center gap-1">
                        <span>🏔️</span> Altitud de la Finca
                      </td>
                      <td className="p-1.5">
                        <strong className="font-mono text-[#005b8c] font-black bg-[#e2e7ff] px-1.5 py-0.2 rounded border border-[#dae2fd]">
                          {altitudFinca} m s.n.m.
                        </strong>
                      </td>
                      <td className="p-1.5 text-slate-500 font-mono text-[9.5px]">Satélite DEM / Open-Meteo</td>
                      <td className="p-1.5 text-slate-700">{analisisClimaIa.pisoAltitudinal}: {analisisClimaIa.descAltitud}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 font-bold text-[#131b2e] flex items-center gap-1">
                        <span>📍</span> Geolocalización GPS
                      </td>
                      <td className="p-1.5 font-mono text-slate-900 font-bold">
                        {finca.gps?.lat ? `${finca.gps.lat}, ${finca.gps.lon}` : '10.0215, -83.9482'}
                      </td>
                      <td className="p-1.5 text-slate-500 font-mono text-[9.5px]">WGS84 GPS Móvil</td>
                      <td className="p-1.5 text-slate-700">{finca.ubicacion || 'Ubicación georreferenciada'}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 font-bold text-[#131b2e] flex items-center gap-1">
                        <span>🌡️</span> Temperatura en Visita
                      </td>
                      <td className="p-1.5">
                        <strong className="font-mono text-slate-900 font-bold bg-orange-50 px-1.5 py-0.2 rounded border border-orange-200">
                          {tempFinca} °C
                        </strong>
                      </td>
                      <td className="p-1.5 text-slate-500 font-mono text-[9.5px]">Estación Meteorológica Virtual</td>
                      <td className="p-1.5 text-slate-700">Condición térmica en campo al momento del recorrido</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 font-bold text-[#131b2e] flex items-center gap-1">
                        <span>💧</span> Humedad Relativa & Rocío
                      </td>
                      <td className="p-1.5">
                        <strong className="font-mono text-cyan-950 font-bold bg-cyan-50 px-1.5 py-0.2 rounded border border-cyan-200">
                          {humedadFinca} %
                        </strong>
                      </td>
                      <td className="p-1.5 text-slate-500 font-mono text-[9.5px]">Sensor Atmosférico Satelital</td>
                      <td className="p-1.5 text-slate-700">
                        {humedadFinca >= 75 ? '⚠️ Alta humedad: Conducente a libre de agua y germinación fúngica' : 'Humedad en rango moderado'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-1.5 font-bold text-[#131b2e] flex items-center gap-1">
                        <span>🌧️</span> Lluvia Acumulada (7 Días)
                      </td>
                      <td className="p-1.5">
                        <strong className="font-mono text-[#005b8c] font-black bg-[#e2e7ff] px-1.5 py-0.2 rounded border border-[#dae2fd]">
                          {lluvia7d} mm
                        </strong>
                      </td>
                      <td className="p-1.5 text-slate-500 font-mono text-[9.5px]">Pluviometría Semanal</td>
                      <td className="p-1.5 text-slate-700">
                        {lluvia7d > 35 ? '⚠️ Lluvias intensas: Monitorear asfixia radicular, Phytophthora y lavado' : 'Régimen pluviométrico semanal moderado'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-1.5 font-bold text-[#131b2e] flex items-center gap-1">
                        <span>📊</span> Lluvia Histórica Expediente
                      </td>
                      <td className="p-1.5">
                        <strong className="font-mono text-indigo-950 font-black bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                          {lluviaAcumuladaFinca} mm
                        </strong>
                      </td>
                      <td className="p-1.5 text-slate-500 font-mono text-[9.5px]">Historial Finca ({estadisticasClima?.totalVisitas || 1} visitas)</td>
                      <td className="p-1.5 text-slate-700">Acumulado continuo registrado en el expediente del cliente</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. OBSERVACIONES Y VALORACIÓN I.A. SOBRE FACTORES AGROCLIMÁTICOS Y RIESGOS */}
            <div className="bg-[#f2f3ff] border border-[#dae2fd] rounded-xl p-2.5 text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-[#dae2fd] pb-1">
                <span className="font-headline font-bold text-[#00652c] flex items-center gap-1 text-[11px]">
                  <span className="material-symbols-outlined text-[15px] text-[#416900]">auto_awesome</span>
                  3. Observaciones y Valoración I.A.: Factores Climáticos y Riesgos Fitosanitarios
                </span>
                <span className="font-mono text-[9px] font-bold text-[#00652c] bg-[#d3ffd5] border border-[#79db8d] px-1.5 py-0.2 rounded-full flex items-center gap-1">
                  Validado por Agrónomo
                </span>
              </div>

              {/* Impacto Fisiológico */}
              <div className="bg-white p-2 rounded-lg border border-[#eaedff] text-[10px] leading-relaxed text-slate-800 space-y-0.5">
                <strong className="text-[#00652c] block font-headline font-bold text-[10.5px]">
                  🌡️ Impacto Fisiológico de Temperatura ({tempFinca}°C) y Humedad ({humedadFinca}%) en {lote.cultivoNombre || 'el cultivo'}:
                </strong>
                <p>{analisisClimaIa.impactoFisiologico}</p>
              </div>

              {/* Grid 2 Columnas de Riesgos */}
              <div className="grid grid-cols-2 print:grid-cols-2 print-grid-2 gap-1.5 text-[10px]">
                {/* Enfermedades Propensas */}
                <div className="bg-white p-2 rounded-lg border border-amber-200 space-y-1">
                  <span className="font-headline font-bold text-amber-950 flex items-center justify-between border-b border-amber-100 pb-0.5 text-[10.5px]">
                    <span>🍄 Enfermedades Propensas:</span>
                    <span className="font-mono text-[8.5px] font-bold px-1 py-0.2 bg-amber-100 text-amber-900 rounded">Alerta Fúngica</span>
                  </span>
                  <div className="space-y-1">
                    {(analisisClimaIa.enfermedadesPropensas || []).slice(0, 2).map((enf, eIdx) => (
                      <div key={eIdx} className="bg-amber-50/60 p-1 rounded border border-amber-100 space-y-0.5">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-amber-950">{enf.patogeno}</span>
                          <span className={`font-mono text-[8.5px] font-black px-1 rounded ${
                            enf.riesgo.includes('Crítico') ? 'bg-[#ba1a1a] text-white' : (enf.riesgo.includes('Alto') ? 'bg-orange-500 text-white' : 'bg-amber-200 text-amber-950')
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
                  <span className="font-headline font-bold text-purple-950 flex items-center justify-between border-b border-purple-100 pb-0.5 text-[10.5px]">
                    <span>🐛 Insectos / Ácaros Propensos:</span>
                    <span className="font-mono text-[8.5px] font-bold px-1 py-0.2 bg-purple-100 text-purple-900 rounded">Dinámica Térmica</span>
                  </span>
                  <div className="space-y-1">
                    {(analisisClimaIa.insectosAcarosPropensos || []).slice(0, 2).map((plaga, pIdx) => (
                      <div key={pIdx} className="bg-purple-50/60 p-1 rounded border border-purple-100 space-y-0.5">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-purple-950">{plaga.plaga}</span>
                          <span className={`font-mono text-[8.5px] font-black px-1 rounded ${
                            plaga.riesgo.includes('Crítico') ? 'bg-[#ba1a1a] text-white' : (plaga.riesgo.includes('Alto') ? 'bg-purple-600 text-white' : 'bg-purple-200 text-purple-950')
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
              <div className="bg-[#d3ffd5]/50 p-2 rounded-lg border border-[#79db8d] text-[10px] text-[#005323] space-y-0.5">
                <strong className="block font-headline font-bold text-[10.5px] text-[#005323]">
                  🛡️ Estrategia y Medidas Preventivas Inmediatas Recomendadas por la I.A.:
                </strong>
                <p className="leading-tight text-slate-800">
                  {analisisClimaIa.medidasPreventivas}
                </p>
              </div>
            </div>
          </div>

          {/* PIE DE PÁGINA 1 EDITORIAL */}
          <div className="border-t border-[#dae2fd] pt-2 flex items-center justify-between text-[9px] text-slate-400 font-mono">
            <span>AgroAsesor Pro CR™ • Ing. Agr. Ricardo M. Barquero Chacón (Col. 5896)</span>
            <span>Dossier Agronómico Oficial • Costa Rica</span>
            <span className="font-bold text-[#00652c]">Página 1 de {totalPaginas}</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PÁGINA(S) 2: DOSSIER CIENTÍFICO DE HALLAZGOS Y SUELO     */}
        {/* ========================================================= */}
        {paginasHallazgos.map((grupoHallazgos, pIdx) => {
          const numPaginaActual = 2 + pIdx;
          // Cálculo dinámico acumulado del índice de figuras sin saltos
          let figureOffset = 0;
          for (let k = 0; k < pIdx; k++) {
            figureOffset += paginasHallazgos[k].length;
          }
          return (
            <div key={`hallazgos-page-${pIdx}`} className={`report-editorial-page page-${numPaginaActual} bg-[#ffffff]`}>
              <div className="space-y-2.5">
                {/* Header Mini de Revista Científica */}
                <div className="border-b-2 border-[#00652c] pb-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[#00652c] font-headline font-bold text-sm">🌱 AgroAsesor Pro CR</span>
                    <span className="text-slate-300">|</span>
                    <span className="font-headline font-bold text-[#131b2e] uppercase tracking-wide text-[11px]">
                      Dossier Científico de Hallazgos en Campo y Análisis Edáfico {pIdx > 0 ? `(Parte ${pIdx + 1})` : ''}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono">
                    <span>{finca.nombre || 'Finca'}</span> • <span>{visita?.fecha}</span>
                  </div>
                </div>

                {/* Mediciones de Suelo y Sustrato en Campo (Solo en la primera página de hallazgos) */}
                {pIdx === 0 && medicionesSuelo.length > 0 && (
                  <div className="space-y-1.5">
                    <h3 className="font-headline font-bold text-[10.5px] uppercase tracking-wider text-[#131b2e] pb-0.5 border-b border-slate-200 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-md bg-[#cce5ff] text-[#004b73] flex items-center justify-center font-mono text-[10px] font-bold">3</span>
                      Mediciones de Suelo y Sustrato en Campo
                    </h3>

                    {medicionesSuelo.map((m, mIdx) => (
                      <div key={m.id || mIdx} className="bg-[#faf8ff] border border-[#dae2fd] rounded-xl p-2 space-y-1 text-xs">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                          <span className="font-headline font-bold text-[#131b2e] text-[11px]">
                            📍 {m.loteNombre || 'Lote Evaluado'} — {m.metodo || 'Sonda directa en campo'}
                          </span>
                          <span className="font-mono text-[9px] font-bold text-[#00652c] bg-[#d3ffd5] px-2 py-0.2 rounded">
                            Validado por Ing. Ricardo Barquero (Col. 5896)
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left bg-white rounded-lg border border-[#eaedff] overflow-hidden">
                            <thead>
                              <tr className="bg-[#eaedff] text-[#131b2e] font-headline text-[9.5px]">
                                <th className="py-1 px-2 font-bold">Parámetro</th>
                                <th className="py-1 px-2 font-bold text-center">Valor Medido</th>
                                <th className="py-1 px-2 font-bold text-center">Rango Óptimo ({cultivoDef.nombre})</th>
                                <th className="py-1 px-2 font-bold">Evaluación Agronómica</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#eaedff] text-[9.5px]">
                              <tr>
                                <td className="py-1 px-2 font-medium text-slate-800">pH del Suelo / Sustrato</td>
                                <td className="py-1 px-2 text-center font-mono font-black text-[#131b2e]">{m.phSuelo}</td>
                                <td className="py-1 px-2 text-center text-slate-500 font-mono">{cultivoDef.rangoPh || '5.5 - 6.5'}</td>
                                <td className="py-1 px-2 font-semibold text-[#00652c]">
                                  {parseFloat(m.phSuelo) >= 5.5 && parseFloat(m.phSuelo) <= 6.5 ? 'Dentro de rango óptimo' : 'Requiere ajuste en solución'}
                                </td>
                              </tr>
                              <tr>
                                <td className="py-1 px-2 font-medium text-slate-800">Conductividad Eléctrica (CE)</td>
                                <td className="py-1 px-2 text-center font-mono font-black text-[#131b2e]">{m.ceSuelo} mS/cm</td>
                                <td className="py-1 px-2 text-center text-slate-500 font-mono">{cultivoDef.rangoCe || '1.2 - 1.8 mS/cm'}</td>
                                <td className="py-1 px-2 font-semibold text-[#00652c]">
                                  {parseFloat(m.ceSuelo) >= 1.0 && parseFloat(m.ceSuelo) <= 2.0 ? 'Salinidad controlada' : 'Ajustar conductividad'}
                                </td>
                              </tr>
                              <tr>
                                <td className="py-1 px-2 font-medium text-slate-800">Temperatura del Suelo</td>
                                <td className="py-1 px-2 text-center font-mono font-black text-[#131b2e]">{m.tempSuelo}°C</td>
                                <td className="py-1 px-2 text-center text-slate-500 font-mono">{cultivoDef.rangoTempSuelo || '16 - 22 °C'}</td>
                                <td className="py-1 px-2 font-semibold text-[#00652c]">Actividad radicular favorable</td>
                              </tr>
                              <tr>
                                <td className="py-1 px-2 font-medium text-slate-800">Humedad en Rizósfera</td>
                                <td className="py-1 px-2 text-center font-mono font-black text-[#131b2e]">{m.humedadSuelo}</td>
                                <td className="py-1 px-2 text-center text-slate-500 font-mono">{cultivoDef.rangoHumedadSuelo || '60 - 80%'}</td>
                                <td className="py-1 px-2 font-semibold text-[#00652c]">Adecuada capacidad de campo</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {m.ajusteRecomendado && (
                          <div className="bg-[#d3ffd5]/40 p-1.5 rounded-lg border border-[#79db8d] text-slate-800 text-[9.5px]">
                            <strong className="text-[#005323] font-bold block">Ajuste y Recomendación Agronómica:</strong>
                            <span>{m.ajusteRecomendado}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Diagnóstico Visual de Hallazgos en Formato Stitch / Revista */}
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200 mb-2 pb-1">
                    <h3 className="font-headline font-bold text-[10.5px] uppercase tracking-wider text-[#131b2e] flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-md bg-[#acf847]/40 text-[#416900] flex items-center justify-center font-mono text-[10px] font-bold">
                        {pIdx === 0 ? '4' : '4b'}
                      </span>
                      Diagnóstico Visual de Hallazgos Fitosanitarios en Campo
                    </h3>
                    <span className="font-mono text-[9px] font-bold text-[#005b8c]">
                      Stitch AI Specimen Cards • Proporción 4:3 Real
                    </span>
                  </div>

                  {grupoHallazgos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 print-grid-2 gap-2.5">
                      {grupoHallazgos.map((h, hIdx) => {
                        const figureIndex = figureOffset + hIdx + 1;
                        const esCritico = h.severidad?.toLowerCase().includes('alta') || h.severidad?.toLowerCase().includes('crítica');
                        const esOptimo = h.severidad?.toLowerCase().includes('baja') || h.severidad?.toLowerCase().includes('leve');

                        return (
                          <div key={h.id || hIdx} className="stitch-finding-card border border-[#dae2fd] rounded-xl overflow-hidden bg-white shadow-xs flex flex-col justify-between">
                            {/* Media Box 4:3 con Scrim y Telemetría */}
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
                              className="relative w-full aspect-[4/3] bg-[#0b1120] overflow-hidden cursor-pointer group"
                              title="Click para ampliar imagen en Alta Definición HD"
                            >
                              {h.fotoAnotada ? (
                                <img 
                                  src={h.fotoAnotada} 
                                  alt={h.titulo} 
                                  className="w-full h-full object-contain block transition-transform duration-300 group-hover:scale-105" 
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 font-mono text-xs">
                                  Sin fotografía adjunta
                                </div>
                              )}

                              {/* Badge Flotante Superior Izquierdo */}
                              <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-md shadow-xs text-[9px] font-headline font-semibold uppercase ${
                                esCritico 
                                  ? 'bg-[#ffdad6]/95 text-[#93000a]' 
                                  : (esOptimo ? 'bg-[#d3ffd5]/95 text-[#005323]' : 'bg-[#dae2fd]/95 text-[#004b73]')
                              }`}>
                                <span className="material-symbols-outlined text-[12px]">
                                  {esCritico ? 'warning' : (esOptimo ? 'eco' : 'science')}
                                </span>
                                <span className="font-mono text-[8.5px]">
                                  FIG. {figureIndex} • {esCritico ? 'Foco Crítico' : (esOptimo ? 'Óptimo' : 'Alerta')}
                                </span>
                              </div>

                              {/* Retícula de Bounding Box IA */}
                              <div className="absolute top-1/4 right-1/4 w-28 h-20 border-2 border-dashed border-[#acf847] rounded-lg pointer-events-none flex flex-col justify-between p-1 bg-[#acf847]/10 backdrop-blur-[1px]">
                                <span className="px-1 py-0.2 rounded bg-[#283044]/90 text-white font-mono text-[8px] self-start leading-none">
                                  IA: Patógeno (98%)
                                </span>
                                <span className="material-symbols-outlined text-[#acf847] text-[14px] self-end animate-bounce">
                                  center_focus_strong
                                </span>
                              </div>

                              {/* Scrim Inferior con Coordenadas GPS */}
                              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#283044]/95 via-[#283044]/80 to-transparent p-2 pt-4 flex items-end justify-between text-white">
                                <div className="flex flex-col min-w-0 pr-1">
                                  <span className="font-headline font-bold text-xs truncate leading-tight">
                                    {h.titulo}
                                  </span>
                                  <span className="font-body text-[9.5px] text-white/80 truncate">
                                    {h.categoria} • Severidad: {h.severidad}
                                  </span>
                                </div>
                                <div className="flex flex-col items-end text-white/90 font-mono text-[8.5px] shrink-0">
                                  <span>{finca.gps?.lat || '10.0215'}°N, {finca.gps?.lon || '-83.9482'}°W</span>
                                  <span className="text-white/70">{h.loteNombre || 'Lote 1'} • {h.fecha || visita?.fecha}</span>
                                </div>
                              </div>
                            </div>

                            {/* Pie Técnico de la Tarjeta Stitch */}
                            <div className="p-2.5 flex flex-col gap-1.5 bg-white text-xs flex-1 justify-between">
                              <div>
                                <p className="font-body text-slate-700 text-[10px] leading-snug">
                                  <strong className="text-[#00652c] font-headline font-bold">Figura {figureIndex}: </strong>
                                  {h.descripcion}
                                </p>
                              </div>

                              {/* Recomendación Inmediata IA */}
                              <div className="rounded-lg bg-[#f2f3ff] p-2 flex items-start gap-1.5 border border-[#e2e7ff]">
                                <div className="p-0.5 rounded bg-[#acf847] text-[#416900] flex items-center justify-center shrink-0 mt-0.5">
                                  <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-mono text-[8.5px] text-[#416900] font-bold uppercase tracking-wider">
                                    Recomendación IA Inmediata
                                  </span>
                                  <p className="font-body text-[9.5px] text-[#131b2e] leading-tight mt-0.5">
                                    {h.recomendacionIa || 'Aplicación preventiva inmediata recomendada para frenar esporulación en el lote.'}
                                  </p>
                                </div>
                              </div>

                              {/* Validación en Campo */}
                              <div className="flex items-center justify-between pt-0.5 text-[9px] text-slate-400 font-mono border-t border-slate-100">
                                <span>{finca.nombre || 'Finca'}</span>
                                <span className="text-[#005b8c] font-semibold flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                  Validado por Ing. Barquero (Col. 5896)
                                </span>
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
              <div className="border-t border-[#dae2fd] pt-2 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <span>AgroAsesor Pro CR™ • Ing. Agr. Ricardo M. Barquero Chacón (Col. 5896)</span>
                <span>Dossier Agronómico Oficial • Costa Rica</span>
                <span className="font-bold text-[#00652c]">Página {numPaginaActual} de {totalPaginas}</span>
              </div>
            </div>
          );
        })}

        {/* ========================================================= */}
        {/* PÁGINAS SEMANALES DEDICADAS DE RECOMENDACIONES (INTELIGENTES) */}
        {/* ========================================================= */}
        {paginasSemanales.map((pagSem, sIdx) => {
          const numPaginaActual = 1 + paginasHallazgos.length + sIdx + 1;
          const semNum = pagSem.semana;
          const fertSemana = pagSem.fertSemana;
          const plagSemana = pagSem.plagSemana;
          const esUltimaSemana = sIdx === paginasSemanales.length - 1;

          // Cálculo estequiométrico elemental para esta prescripción semanal
          const lineasFertSemana = (fertSemana?.eventos || []).flatMap(ev => [
            ...(ev.lineasTanqueA || []),
            ...(ev.lineasTanqueB || []),
            ...(ev.productos || [])
          ]);
          const metricasNutricionales = calcularNutrientesTotales(lineasFertSemana);

          const renderFertirriego = pagSem.subTipo === 'fertirriego' || pagSem.subTipo === 'mixto';
          const renderFitosanitarios = pagSem.subTipo === 'fitosanitarios' || pagSem.subTipo === 'mixto';

          return (
            <div key={`semana-page-${semNum}-${sIdx}`} className={`report-editorial-page page-${numPaginaActual} bg-[#ffffff]`}>
              <div className="space-y-2.5">
                {/* Header Semanal de Alta Gama Stitch */}
                <div className="border-b-2 border-[#00652c] pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-[#00652c] text-white flex items-center justify-center font-mono font-bold text-xs shadow-xs">
                      S{semNum}
                    </span>
                    <div>
                      <h3 className="font-headline font-bold text-xs sm:text-sm text-[#131b2e] uppercase tracking-wide">
                        Prescripción Técnica • Semana {semNum}
                        {pagSem.esParteDeDivision && (
                          <span className="text-[#005b8c] font-mono text-xs normal-case ml-2">
                            (Parte {pagSem.parteNum} de {pagSem.totalPartes}: {pagSem.subTipo === 'fertirriego' ? 'Nutrición y Fertirriego' : 'Sanidad Foliar'})
                          </span>
                        )}
                      </h3>
                      <span className="font-mono text-[9.5px] font-bold text-[#00652c] block">
                        {renderFertirriego && renderFitosanitarios 
                          ? 'Nutrición, Fertirriego y Manejo Fitosanitario Segregado con Doble Dosis (L / 200 L)'
                          : (renderFertirriego ? 'Programa Nutricional, Fertirriego y Aportes Elementales' : 'Manejo Fitosanitario Foliar Segregado con Doble Dosis (L / 200 L)')}
                      </span>
                      {((fertSemana?.etapaFenologica || fertSemana?.objetivoFertilizacion) || (plagSemana?.etapaFenologica)) && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {(fertSemana?.etapaFenologica || plagSemana?.etapaFenologica) && (
                            <span className="text-[8.5px] font-mono font-bold bg-[#d3ffd5] text-[#005323] px-1.5 py-0.2 rounded border border-[#79db8d]">
                              🌿 Etapa: {fertSemana?.etapaFenologica || plagSemana?.etapaFenologica}
                            </span>
                          )}
                          {fertSemana?.objetivoFertilizacion && (
                            <span className="text-[8.5px] font-mono font-bold bg-[#e2e7ff] text-[#004b73] px-1.5 py-0.2 rounded border border-[#dae2fd]">
                              🎯 Meta: {fertSemana.objetivoFertilizacion}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-[10.5px]">
                    <span className="font-headline font-bold text-[#131b2e] block">{finca.nombre || 'Finca'}</span>
                    <span className="font-mono text-slate-500 text-[9.5px]">Validez: 7 días de prescripción</span>
                  </div>
                </div>

                {/* SECCIÓN A: NUTRICIÓN Y FERTIRRIEGO DE LA SEMANA */}
                {renderFertirriego && (
                  <div className="bg-[#f2f3ff] border border-[#dae2fd] rounded-xl p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between border-b border-[#dae2fd] pb-1">
                      <span className="font-headline font-bold text-[#00652c] text-xs flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-[#005b8c]">water_drop</span>
                        A. Programa Nutricional y Fertirriego — Semana {semNum}
                      </span>
                      <span className="font-mono text-[9px] font-bold text-[#005b8c] bg-[#e2e7ff] px-2 py-0.2 rounded">
                        Sales Solubles y Enmiendas
                      </span>
                    </div>

                    {fertSemana && fertSemana.eventos && fertSemana.eventos.length > 0 ? (
                      <div className="space-y-1.5">
                        {fertSemana.eventos.map((ev, eIdx) => (
                          <div key={eIdx} className="bg-white rounded-lg border border-[#eaedff] p-2 text-xs space-y-1.5">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-0.5">
                              <div className="flex items-center gap-1 font-headline font-bold text-slate-800">
                                <span>{ev.modalidadIcono || '💧'}</span>
                                <span>{ev.nombreEvento || ev.modalidadNombre || 'Fertirriego'}</span>
                                <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#d3ffd5] text-[#005323] border border-[#79db8d]">
                                  {ev.alcance || 'Toda la Finca'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 font-mono text-[9.5px]">
                                {ev.conductividadObjetivo && (
                                  <span className="font-bold text-[#00652c] bg-[#d3ffd5] px-1.5 py-0.2 rounded border border-[#79db8d]">
                                    CE: {ev.conductividadObjetivo}
                                  </span>
                                )}
                                {ev.phObjetivo && (
                                  <span className="font-bold text-[#005b8c] bg-[#e2e7ff] px-1.5 py-0.2 rounded border border-[#dae2fd]">
                                    pH: {ev.phObjetivo}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Tanque A y Tanque B */}
                            {ev.lineasTanqueA && ev.lineasTanqueB ? (
                              <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div className="bg-[#e2e7ff]/50 p-1.5 rounded border border-[#dae2fd] space-y-0.5">
                                  <strong className="font-headline text-[#004b73] block text-[9.5px] font-bold border-b border-[#dae2fd] pb-0.5">
                                    🔵 TANQUE A (Calcio y Nitratos):
                                  </strong>
                                  {ev.lineasTanqueA.map((l, lIdx) => (
                                    <div key={lIdx} className="flex justify-between text-slate-800 font-mono py-0.2">
                                      <span className="font-body text-[9.5px]">{l.producto}</span>
                                      <strong className="text-[#004b73] ml-1">{l.dosis} {l.unidad}</strong>
                                    </div>
                                  ))}
                                </div>
                                <div className="bg-amber-50/60 p-1.5 rounded border border-amber-200 space-y-0.5">
                                  <strong className="font-headline text-amber-900 block text-[9.5px] font-bold border-b border-amber-200 pb-0.5">
                                    🟡 TANQUE B (Fósforo, Sulfatos y Micros):
                                  </strong>
                                  {ev.lineasTanqueB.map((l, lIdx) => (
                                    <div key={lIdx} className="flex justify-between text-slate-800 font-mono py-0.2">
                                      <span className="font-body text-[9.5px]">{l.producto}</span>
                                      <strong className="text-amber-950 ml-1">{l.dosis} {l.unidad}</strong>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="bg-[#faf8ff] p-1.5 rounded border border-[#eaedff] space-y-0.5 text-[10px]">
                                {(ev.productos || []).map((l, lIdx) => (
                                  <div key={lIdx} className="flex justify-between py-0.5 border-b border-slate-100 last:border-0 font-mono">
                                    <span className="font-body text-slate-800">{l.producto}</span>
                                    <strong className="text-[#00652c] ml-1">{l.dosis} {l.unidad}</strong>
                                  </div>
                                ))}
                              </div>
                            )}

                            {ev.observacionesPie && (
                              <p className="font-body text-[9.5px] text-slate-500 italic pt-0.5">
                                Instrucción: {ev.observacionesPie}
                              </p>
                            )}
                          </div>
                        ))}

                        {/* RESUMEN ESTEQUIOMÉTRICO ELEMENTAL DE APORTE */}
                        {metricasNutricionales && (metricasNutricionales.nTotalKg > 0 || metricasNutricionales.p2o5Kg > 0 || metricasNutricionales.k2oKg > 0) && (
                          <div className="bg-white p-1.5 rounded-lg border border-[#eaedff] space-y-1">
                            <div className="flex items-center justify-between text-[9px] font-headline font-bold text-[#00652c]">
                              <span>⚖️ Aporte Elemental Estequiométrico:</span>
                              <span className="font-mono text-[#005b8c]">Relación K:N = {metricasNutricionales.relacionKN || 'Equilibrado'}</span>
                            </div>
                            <div className="grid grid-cols-6 gap-1 text-center font-mono text-[9px]">
                              <div className="bg-[#faf8ff] p-1 rounded border border-[#dae2fd]">
                                <span className="text-slate-400 block text-[8px]">N Total</span>
                                <strong className="text-[#00652c]">{metricasNutricionales.nTotalKg} kg</strong>
                              </div>
                              <div className="bg-[#faf8ff] p-1 rounded border-[#dae2fd] border">
                                <span className="text-slate-400 block text-[8px]">P₂O₅</span>
                                <strong className="text-amber-900">{metricasNutricionales.p2o5Kg} kg</strong>
                              </div>
                              <div className="bg-[#faf8ff] p-1 rounded border-[#dae2fd] border">
                                <span className="text-slate-400 block text-[8px]">K₂O</span>
                                <strong className="text-purple-900">{metricasNutricionales.k2oKg} kg</strong>
                              </div>
                              <div className="bg-[#faf8ff] p-1 rounded border-[#dae2fd] border">
                                <span className="text-slate-400 block text-[8px]">CaO</span>
                                <strong className="text-blue-900">{metricasNutricionales.caoKg} kg</strong>
                              </div>
                              <div className="bg-[#faf8ff] p-1 rounded border-[#dae2fd] border">
                                <span className="text-slate-400 block text-[8px]">MgO</span>
                                <strong className="text-emerald-900">{metricasNutricionales.mgoKg} kg</strong>
                              </div>
                              <div className="bg-[#faf8ff] p-1 rounded border-[#dae2fd] border">
                                <span className="text-slate-400 block text-[8px]">S</span>
                                <strong className="text-yellow-900">{metricasNutricionales.sKg} kg</strong>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10.5px] text-slate-500 italic bg-white p-2 rounded-lg border border-[#eaedff]">
                        Nutrición edáfica continua. No se programan cambios en la solución madre esta semana.
                      </p>
                    )}
                  </div>
                )}

                {/* SECCIÓN B: MANEJO FITOSANITARIO FOLIAR SEGREGADO */}
                {renderFitosanitarios && (
                  <div className="bg-[#faf8ff] border border-[#dae2fd] rounded-xl p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between border-b border-[#dae2fd] pb-1">
                      <span className="font-headline font-bold text-[#131b2e] text-xs flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-[#00652c]">shield</span>
                        B. Programa Fitosanitario Foliar Segregado — Semana {semNum}
                      </span>
                      <span className="font-mono text-[9px] font-bold text-[#416900] bg-[#acf847]/30 px-2 py-0.2 rounded">
                        Rotación FRAC / IRAC & Dosis Doble (L / 200L)
                      </span>
                    </div>

                    {plagSemana && plagSemana.sinAplicacion ? (
                      <div className="bg-[#d3ffd5]/40 border border-[#79db8d] rounded-lg p-2.5 flex items-start gap-2 text-xs text-[#005323]">
                        <span className="material-symbols-outlined text-[18px] text-[#00652c] shrink-0 mt-0.5">check_circle</span>
                        <div>
                          <strong className="block font-headline font-bold text-[#005323]">Sin Aplicación Fitosanitaria Requerida:</strong>
                          <span className="font-body text-[10.5px]">
                            {plagSemana.motivoSinAplicacion || 'Poblaciones fitófagas y fúngicas por debajo del umbral económico. Mantener monitoreo semanal sin intervención química.'}
                          </span>
                        </div>
                      </div>
                    ) : plagSemana && plagSemana.aplicaciones && plagSemana.aplicaciones.length > 0 ? (
                      <div className="space-y-2">
                        {plagSemana.aplicaciones.map((app, aIdx) => (
                          <div key={aIdx} className="bg-white rounded-lg border border-[#eaedff] p-2 text-xs space-y-1.5">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.2 rounded font-mono text-[8.5px] font-bold text-white ${
                                  app.tipoMezcla === 'fungicida_foliar' ? 'bg-[#00652c]' : 'bg-[#005b8c]'
                                }`}>
                                  {app.tipoMezcla === 'fungicida_foliar' ? 'MEZCLA 1 (Fungicida + Foliar)' : 'MEZCLA 2 (Insecticida + Acaricida)'}
                                </span>
                                <strong className="font-headline text-[#131b2e] text-[11px]">{app.nombre}</strong>
                              </div>
                              <span className="text-slate-500 font-mono text-[9.5px]">Tanque: {app.volumenTanque}</span>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left">
                                <thead>
                                  <tr className="bg-[#eaedff] text-[#131b2e] font-headline border-b border-[#dae2fd] text-[9.5px]">
                                    <th className="py-1 px-1.5 font-bold w-6 text-center">Paso</th>
                                    <th className="py-1 px-1.5 font-bold">Insumo Comercial</th>
                                    <th className="py-1 px-1.5 font-bold">FRAC / IRAC</th>
                                    <th className="py-1 px-1.5 font-bold text-center text-[#005b8c] bg-[#e2e7ff]/70 border-x border-[#dae2fd]">Dosis / Litro</th>
                                    <th className="py-1 px-1.5 font-bold text-center text-[#00652c] bg-[#d3ffd5]/60 border-r border-[#79db8d]">Dosis / Estañón 200 L</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#eaedff] font-mono text-[9.5px]">
                                  {(app.ordenMezcla || []).map((l, lIdx) => {
                                    const dual = calcularDosisDual(l.dosis || '');
                                    const dLitro = l.dosisLitro || dual.dosisLitro;
                                    const dEstanon = l.dosisEstanon || dual.dosisEstanon;
                                    return (
                                      <tr key={lIdx} className="hover:bg-slate-50/50">
                                        <td className="py-1 px-1.5 text-center font-bold text-slate-400">
                                          {lIdx + 1}
                                        </td>
                                        <td className="py-1 px-1.5 font-headline font-bold text-[#131b2e]">
                                          <span>{l.producto}</span>
                                          {l.registroSfe && (
                                            <span className="block font-mono text-[8px] font-bold text-[#00652c]">
                                              🏛️ {l.registroSfe}
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-1 px-1.5 font-bold text-[#005b8c]">
                                          {l.fracIrac || 'N/A'}
                                        </td>
                                        <td className="py-1 px-1.5 font-bold text-[#005b8c] text-center bg-[#e2e7ff]/30 border-x border-[#dae2fd] whitespace-nowrap">
                                          {dLitro}
                                        </td>
                                        <td className="py-1 px-1.5 font-black text-[#00652c] text-center bg-[#d3ffd5]/30 border-r border-[#79db8d] whitespace-nowrap">
                                          {dEstanon}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {app.observacionesPie && (
                              <p className="font-body text-[9.5px] text-slate-500 italic pt-0.5 border-t border-slate-100">
                                Instrucción: {app.observacionesPie}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10.5px] text-slate-500 italic bg-white p-2 rounded-lg border border-[#eaedff]">
                        No se han programado aplicaciones fitosanitarias químicas para esta semana.
                      </p>
                    )}
                  </div>
                )}

                {/* MARCO LEGAL Y FIRMA DEL INGENIERO (EN LA ÚLTIMA PÁGINA) */}
                {esUltimaSemana && (
                  <div className="border-t-2 border-[#dae2fd] pt-2.5 mt-2">
                    <div className="flex flex-row items-center justify-between gap-4">
                      <div className="space-y-0.5 text-left">
                        <div className="text-base text-[#00652c] font-bold italic tracking-wide font-headline">
                          Ricardo M. Barquero Chacón
                        </div>
                        <div className="w-48 h-0.5 bg-slate-400"></div>
                        <p className="font-headline text-xs font-bold text-[#131b2e]">
                          Ing. Agr. Ricardo Manuel Barquero Chacón
                        </p>
                        <p className="font-mono text-[10px] text-[#3f493f]">
                          Ingeniero Agrónomo • Colegiado No. 5896
                        </p>
                        <p className="font-body text-[8.5px] text-slate-500">
                          Colegio de Ingenieros Agrónomos de Costa Rica • Tel: +506 8894-5662
                        </p>
                      </div>

                      <div className="p-2 bg-[#f2f3ff] border border-[#dae2fd] rounded-xl text-center space-y-0.5 max-w-xs">
                        <span className="font-mono text-[8.5px] font-bold uppercase tracking-wider text-[#00652c] block">
                          VALIDACIÓN OFICIAL BPA COSTA RICA
                        </span>
                        <p className="font-body text-[9px] text-slate-600 leading-tight">
                          Prescripción conforme al marco fitosanitario nacional (SFE / MAG) y registro oficial.
                        </p>
                        <div className="pt-0.5 font-mono text-[8.5px] text-slate-400">
                          REG-CR: 5896 • {visita?.fecha || '2026-03-10'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-1.5 pt-1 border-t border-[#eaedff] text-center font-body text-[8px] text-slate-400">
                      © 2026 <strong>Ricardo Manuel Barquero Chacón</strong>. Todos los derechos reservados • AgroAsesor Pro CR™.
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Página Semanal */}
              <div className="border-t border-[#dae2fd] pt-2 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <span>AgroAsesor Pro CR™ • Ing. Agr. Ricardo M. Barquero Chacón (Col. 5896)</span>
                <span>Prescripción Técnica Oficial • Semana {semNum}</span>
                <span className="font-bold text-[#00652c]">Página {numPaginaActual} de {totalPaginas}</span>
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
