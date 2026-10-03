import React, { useState } from 'react';
import { 
  Plus, Trash2, AlertTriangle, Sparkles, Check, 
  Calendar, Sliders, X, MapPin, Edit3, List, Save
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import { 
  ETAPAS_FENOLOGICAS, 
  OBJETIVOS_FERTILIZACION,
  proponerFormulaDosatron,
  escalarFormulaPorVolumen,
  reescalarLineasPorVolumen,
  calcularDetalleCuadroFertilizacion,
  normalizarSalDosisUnidad
} from '../services/nutritionCalculatorService';

// Modalidades oficiales solicitadas por el Ing. Agr. Ricardo Barquero
const MODALIDADES = [
  { 
    id: 'dosatron', 
    nombre: 'Dosatron (Tanque A y B)', 
    icono: '🧪', 
    subtitulo: 'Inyección proporcional dual (A: Calcio/Nitratos, B: Fosfatos/Sulfatos)',
    unidades: [
      'kg / tanque 1000 L', 
      'g / tanque 1000 L', 
      'cc / 1000 L', 
      'L / 1000 L', 
      'kg / estañón (200 L)', 
      'g / estañón (200 L)', 
      'cc / estañón (200 L)', 
      '% inyección (ej: 1:100)'
    ]
  },
  { 
    id: 'tanque_directo', 
    nombre: 'Tanque Directo', 
    icono: '💧', 
    subtitulo: 'Mezcla en un solo tanque listo para riego o goteo directo',
    unidades: [
      'kg / tanque 1000 L', 
      'g / tanque 1000 L', 
      'cc / 1000 L', 
      'L / 1000 L', 
      'kg / estañón (200 L)', 
      'g / estañón (200 L)', 
      'cc / estañón (200 L)', 
      'g / L', 
      'cc / L'
    ]
  },
  { 
    id: 'venturi', 
    nombre: 'Mezclas con Venturi', 
    icono: '🔄', 
    subtitulo: 'Succión por depresión Venturi desde estañón o tanque nodriza',
    unidades: [
      'kg / estañón (200 L)', 
      'g / estañón (200 L)', 
      'L / estañón (200 L)', 
      'cc / estañón (200 L)', 
      'cc / 1000 L', 
      'g / 1000 L', 
      'kg / tanque 1000 L', 
      'L / 1000 L', 
      'g / L'
    ]
  },
  { 
    id: 'inyeccion', 
    nombre: 'Inyección de Fertirriego', 
    icono: '⚡', 
    subtitulo: 'Cabezal de inyección automatizada o bombas dosificadoras',
    unidades: [
      'cc / 1000 L', 
      'L / 1000 L', 
      'g / 1000 L', 
      'kg / 1000 L', 
      'L / m3 de agua', 
      'cc / m3 de agua', 
      'g / m3 de agua', 
      'kg / m3 de agua', 
      'kg / ha'
    ]
  },
  { 
    id: 'drench', 
    nombre: 'Drench por Estañón / Planta', 
    icono: '🪴', 
    subtitulo: 'Aplicación localizada al cuello o raíz con bomba o lanza',
    unidades: [
      'cc / estañón (200 L)', 
      'g / estañón (200 L)', 
      'kg / estañón (200 L)', 
      'cc / 1000 L', 
      'g / 1000 L', 
      'L / 1000 L', 
      'cc / planta (ej: 150-200 cc)', 
      'g / planta', 
      'cc / bomba (18-20 L)', 
      'g / bomba (18-20 L)'
    ]
  },
  { 
    id: 'granular', 
    nombre: 'Fertilización Granular al Suelo', 
    icono: '🌾', 
    subtitulo: 'Abonamiento edáfico sólido (Pre-siembra, aporque o desarrollo)',
    unidades: [
      'kg / ha', 
      'sacos (46 kg) / ha', 
      'g / planta', 
      'kg / cama (100 m)', 
      'quintales / mz'
    ]
  }
];

export default function FertigationModule({ visita, onUpdateVisita, onOpenAi }) {
  const [semanaActiva, setSemanaActiva] = useState(1);
  const [mostrarModalEvento, setMostrarModalEvento] = useState(false);
  const [eventoEditandoId, setEventoEditandoId] = useState(null); // null = nuevo, string = editando
  const [modalidadSeleccionada, setModalidadSeleccionada] = useState('dosatron');
  const [auditandoNutricion, setAuditandoNutricion] = useState(false);
  const [resultadoAuditoriaNutricional, setResultadoAuditoriaNutricional] = useState(null);
  const [mostrarPanelAuditoria, setMostrarPanelAuditoria] = useState(true);
  
  // Campos del evento
  const [nombreEvento, setNombreEvento] = useState('');
  const [diaAplicacion, setDiaAplicacion] = useState('Lunes');
  const [objetivoAplicacion, setObjetivoAplicacion] = useState('Llenado y engrose de fruto');
  const [esObjetivoManual, setEsObjetivoManual] = useState(false);
  const [volumenTanqueMadre, setVolumenTanqueMadre] = useState(1000);
  const [relacionInyeccion, setRelacionInyeccion] = useState('1:100');
  const [analizandoEventoIa, setAnalizandoEventoIa] = useState(false);
  const [resultadoAnalisisEventoIa, setResultadoAnalisisEventoIa] = useState(null);
  const [productoInvestigadoMsg, setProductoInvestigadoMsg] = useState(null);
  const [alcanceEvento, setAlcanceEvento] = useState('Toda la Finca');
  const [conductividad, setConductividad] = useState('1.5');
  const [ph, setPh] = useState('5.8');
  const [observaciones, setObservaciones] = useState('');

  // Estados para Tanque Directo y Fórmulas Predefinidas (F1 a F4 y Personalizadas)
  const [volumenTanqueDirecto, setVolumenTanqueDirecto] = useState(1000);
  const [formulaSeleccionadaId, setFormulaSeleccionadaId] = useState('');
  const [mostrarModalGuardarFormula, setMostrarModalGuardarFormula] = useState(false);
  const [nombreNuevaFormula, setNombreNuevaFormula] = useState('');
  const [etapaNuevaFormula, setEtapaNuevaFormula] = useState('');
  const [objetivoNuevaFormula, setObjetivoNuevaFormula] = useState('');
  const [notasNuevaFormula, setNotasNuevaFormula] = useState('');
  const [mensajeFormulaFeedback, setMensajeFormulaFeedback] = useState(null);
  const [mostrarSelectorSuplementos, setMostrarSelectorSuplementos] = useState(false);

  // Filas del formulario (Inician limpias, cada fila contiene modo 'dropdown' o 'manual')
  const [lineasProductos, setLineasProductos] = useState([]);
  const [lineasTanqueA, setLineasTanqueA] = useState([]);
  const [lineasTanqueB, setLineasTanqueB] = useState([]);

  const recomendaciones = visita.recomendacionesFertirriego || [];
  const recomendacionSemana = recomendaciones.find(r => r.semana === semanaActiva) || {
    semana: semanaActiva,
    titulo: `Semana ${semanaActiva} - Programa de Fertirriego y Nutrición`,
    alcance: 'Toda la Finca',
    eventos: []
  };

  const modalidadActualConfig = MODALIDADES.find(m => m.id === modalidadSeleccionada) || MODALIDADES[0];
  const todosFertilizantes = storageService.getTodosLosFertilizantes(modalidadSeleccionada);
  const formulasDisponibles = storageService.getFormulasFertirriego(visita.lote?.cultivoId || 'fresa');
  const suplementosDisponibles = storageService.getSuplementosFertirriego();

  // Obtener lotes de la finca para el alcance
  const clientes = storageService.getClientes();
  const clienteActual = clientes.find(c => c.id === visita.clienteId);
  const fincaActual = clienteActual?.fincas?.find(f => f.id === visita.finca?.id);
  const lotesDeFinca = fincaActual?.lotes || [visita.lote].filter(Boolean);

  // Listas especializadas para desplegar en cada celda según el tanque
  const productosTanqueA = todosFertilizantes.filter(f => {
    const n = f.nombreComercial.toLowerCase();
    return n.includes('calcinit') || n.includes('calcio') || n.includes('nitrato') || 
           n.includes('hierro') || n.includes('librel') || n.includes('multi-k') || f.esPersonalizado;
  });

  const productosTanqueB = todosFertilizantes.filter(f => {
    const n = f.nombreComercial.toLowerCase();
    return n.includes('mkp') || n.includes('map') || n.includes('fosfato') || 
           n.includes('sulfato') || n.includes('magnesio') || n.includes('cosmoquel') || 
           n.includes('ácido') || n.includes('boro') || n.includes('zinc') || n.includes('micro') || f.esPersonalizado;
  });

  // Verificar incompatibilidad de Calcio con Sulfatos/Fosfatos en Tanque A (Dosatron)
  const verificarIncompatibilidadCalcio = (lineasA) => {
    const nombres = lineasA.map(l => (l.producto || '').toLowerCase()).join(' ');
    const tieneCalcio = nombres.includes('calcinit') || nombres.includes('calcio');
    const tieneFosfato = nombres.includes('mkp') || nombres.includes('fosfato') || nombres.includes('ácido fosfórico');
    const tieneSulfato = nombres.includes('sulfato');

    if (tieneCalcio && (tieneFosfato || tieneSulfato)) {
      return '⚠️ ALERTA QUÍMICA CRÍTICA: Se detectó Calcio mezclado con Sulfatos o Fosfatos en Tanque A. Esto precipitará Yeso (Sulfato de Calcio insoluble) y taponará irreversiblemente los emisores de goteo. Mueva los sulfatos y fosfatos al Tanque B.';
    }
    return null;
  };

  const alertaCalcioA = modalidadSeleccionada === 'dosatron' ? verificarIncompatibilidadCalcio(lineasTanqueA) : null;

  // Abrir modal configurando un lienzo limpio para nuevo cuadro
  const handleAbrirModalConModalidad = (modId) => {
    setEventoEditandoId(null);
    setModalidadSeleccionada(modId);
    setNombreEvento('');
    setAlcanceEvento('Toda la Finca');
    setDiaAplicacion('Lunes');
    setObjetivoAplicacion(recomendacionSemana.objetivoFertilizacion || 'Llenado y engrose de fruto');
    setEsObjetivoManual(false);
    setVolumenTanqueMadre(1000);
    setRelacionInyeccion('1:100');
    setVolumenTanqueDirecto(1000);
    setFormulaSeleccionadaId('');
    setMensajeFormulaFeedback(null);
    setMostrarSelectorSuplementos(false);
    setResultadoAnalisisEventoIa(null);
    setProductoInvestigadoMsg(null);
    setObservaciones('');
    
    // Iniciar con 1 fila limpia con selector desplegable listo
    if (modId === 'dosatron') {
      setLineasTanqueA([{ producto: '', dosis: '', unidad: 'kg / tanque 1000 L', aporte: '', esManual: false }]);
      setLineasTanqueB([{ producto: '', dosis: '', unidad: 'kg / tanque 1000 L', aporte: '', esManual: false }]);
      setLineasProductos([]);
    } else {
      const config = MODALIDADES.find(m => m.id === modId) || MODALIDADES[0];
      setLineasProductos([{ producto: '', dosis: '', unidad: config.unidades[0], aporte: '', esManual: false }]);
      setLineasTanqueA([]);
      setLineasTanqueB([]);
    }
    setMostrarModalEvento(true);
  };

  // Abrir modal para editar un cuadro existente
  const handleEditarEvento = (ev) => {
    setEventoEditandoId(ev.id);
    setModalidadSeleccionada(ev.modalidad || 'dosatron');
    setNombreEvento(ev.nombreEvento || '');
    setAlcanceEvento(ev.alcance || 'Toda la Finca');
    setDiaAplicacion(ev.dia || 'Lunes');
    setObjetivoAplicacion(ev.objetivo || recomendacionSemana.objetivoFertilizacion || 'Llenado y engrose de fruto');
    setEsObjetivoManual(false);
    setVolumenTanqueMadre(ev.volumenTanqueMadreLitros || 1000);
    setVolumenTanqueDirecto(ev.volumenTanqueDirectoLitros || 1000);
    setFormulaSeleccionadaId('');
    setMensajeFormulaFeedback(null);
    setMostrarSelectorSuplementos(false);
    setRelacionInyeccion(ev.relacionInyeccion || '1:100');
    setResultadoAnalisisEventoIa(ev.analisisIa ? { analisisIa: ev.analisisIa } : null);
    setProductoInvestigadoMsg(null);
    setConductividad(ev.conductividadObjetivo ? ev.conductividadObjetivo.replace(' mS/cm', '').trim() : '');
    setPh(ev.phObjetivo || '');
    setObservaciones(ev.observacionesPie || '');

    if (ev.modalidad === 'dosatron') {
      const lineasA = (ev.lineasTanqueA || []).map(l => ({
        ...l,
        esManual: l.esManual !== undefined ? l.esManual : !productosTanqueA.some(p => p.nombreComercial.toLowerCase() === (l.producto || '').toLowerCase())
      }));
      const lineasB = (ev.lineasTanqueB || []).map(l => ({
        ...l,
        esManual: l.esManual !== undefined ? l.esManual : !productosTanqueB.some(p => p.nombreComercial.toLowerCase() === (l.producto || '').toLowerCase())
      }));
      setLineasTanqueA(lineasA.length > 0 ? lineasA : [{ producto: '', dosis: '', unidad: 'kg / tanque 1000 L', aporte: '', esManual: false }]);
      setLineasTanqueB(lineasB.length > 0 ? lineasB : [{ producto: '', dosis: '', unidad: 'kg / tanque 1000 L', aporte: '', esManual: false }]);
      setLineasProductos([]);
    } else {
      const config = MODALIDADES.find(m => m.id === (ev.modalidad || modalidadSeleccionada)) || MODALIDADES[0];
      const prods = (ev.productos || []).map(l => ({
        ...l,
        esManual: l.esManual !== undefined ? l.esManual : !todosFertilizantes.some(p => p.nombreComercial.toLowerCase() === (l.producto || '').toLowerCase())
      }));
      setLineasProductos(prods.length > 0 ? prods : [{ producto: '', dosis: '', unidad: config.unidades[0], aporte: '', esManual: false }]);
      setLineasTanqueA([]);
      setLineasTanqueB([]);
    }
    setMostrarModalEvento(true);
  };

  // Seleccionar fórmula predefinida (F1, F2, F3, F4 o personalizada)
  const handleSeleccionarFormulaPredefinida = (formulaId, volumenCustom = null) => {
    setFormulaSeleccionadaId(formulaId);
    if (!formulaId) return;

    const formula = formulasDisponibles.find(f => f.id === formulaId);
    if (!formula) return;

    // Cambiar a la modalidad de la fórmula (por defecto tanque directo para F1-F4)
    const mod = formula.modalidad || 'tanque_directo';
    setModalidadSeleccionada(mod);

    // Ajustar campos generales
    setNombreEvento(formula.nombre);
    if (formula.frecuenciaRecomendada) {
      setDiaAplicacion(formula.frecuenciaRecomendada);
    }
    if (formula.objetivoFertilizacion) {
      setObjetivoAplicacion(formula.objetivoFertilizacion);
      setEsObjetivoManual(false);
    }
    if (formula.ceEstimada) {
      setConductividad(formula.ceEstimada);
    }
    if (formula.phEstimado) {
      setPh(formula.phEstimado);
    }
    if (formula.instruccionesPreparacion) {
      setObservaciones(formula.instruccionesPreparacion);
    }

    // Actualizar etapa y objetivo en la recomendación semanal si está definida
    if (formula.etapaFenologica || formula.objetivoFertilizacion) {
      handleActualizarEtapaYObjetivo(formula.etapaFenologica, formula.objetivoFertilizacion);
    }

    // Escalar dosis según el volumen actual del tanque directo
    const vol = Math.max(1, Number(volumenCustom || volumenTanqueDirecto) || 1000);
    const lineasEscaladas = escalarFormulaPorVolumen(formula, vol);
    setLineasProductos(lineasEscaladas);

    // Feedback visual
    setMensajeFormulaFeedback({
      tipo: 'exito',
      texto: `✅ Fórmula "${formula.nombre}" cargada. Dosis calculadas automáticamente para tanque de ${vol} Litros.`
    });

    // Auto-generar dictamen técnico con la fundamentación del programa
    const salesTotales = Math.round((formula.totalSalesGramos || 1315) * (vol / 1000));
    setResultadoAnalisisEventoIa({
      origen: formula.origen || 'Programa Oficial de Fresa (Llano Grande)',
      analisisIa: `📋 FÓRMULA OFICIAL DEL PROGRAMA CARGADA: ${formula.nombre}\n\n• Etapa: ${formula.etapaFenologica || 'Definida'}\n• Objetivo Agronómico: ${formula.objetivoFertilizacion || 'Nutrición balanceada'}\n• CE esperada: ${formula.ceEstimada || '1.3'} mS/cm | pH: ${formula.phEstimado || '5.8'}\n• Concentración de sales: ${salesTotales} g / tanque ${vol} L (${(salesTotales/vol).toFixed(2)} g/L).\n\nFundamentación técnica: La mezcla en tanque directo a concentración diluida (< 2.0 g/L) mantiene la saturación de yeso < 40%, garantizando 100% de solubilidad sin riesgo de precipitación al respetar el orden de disolución indicado.`
    });
  };

  // Cargar fórmula directamente desde los botones de la pantalla principal
  const handleCargarFormulaDirectaDesdeBoton = (formulaId) => {
    handleAbrirModalConModalidad('tanque_directo');
    setTimeout(() => {
      handleSeleccionarFormulaPredefinida(formulaId, 1000);
    }, 50);
  };

  // Cambiar volumen del tanque directo con re-escalado automático de sales
  const handleCambiarVolumenTanqueDirecto = (nuevoVolumenStr) => {
    const volAnterior = Number(volumenTanqueDirecto) || 1000;
    setVolumenTanqueDirecto(nuevoVolumenStr);
    const nuevoVol = parseFloat(nuevoVolumenStr);

    if (!isNaN(nuevoVol) && nuevoVol > 0 && volAnterior > 0 && nuevoVol !== volAnterior) {
      const lineasReescaladas = reescalarLineasPorVolumen(lineasProductos, volAnterior, nuevoVol);
      setLineasProductos(lineasReescaladas);

      setMensajeFormulaFeedback({
        tipo: 'info',
        texto: `🔄 Dosis reajustadas automáticamente de ${volAnterior} L a ${nuevoVol} L (factor: ${(nuevoVol/volAnterior).toFixed(2)}x).`
      });
    }
  };

  // Agregar suplemento especial (Trichoderma, Nematicida, etc.) a la receta actual
  const handleAgregarSuplemento = (suplemento) => {
    const vol = Number(volumenTanqueDirecto) || 1000;
    const factor = vol / 1000.0;
    const dosisEscalada = Math.round((suplemento.dosisSugerida1000L || 200) * factor * 10) / 10;
    const unidadLimpia = (suplemento.unidad || 'g / tanque 1000 L').replace(/1000\s*L/i, `${vol} L`);

    const nuevaLinea = {
      producto: suplemento.nombre,
      dosis: dosisEscalada.toString(),
      unidad: unidadLimpia,
      aporte: suplemento.categoria || 'Suplemento / Biocontrolador',
      esManual: true,
      tipo: suplemento.tipo || 'suplemento'
    };

    setLineasProductos(prev => [...prev, nuevaLinea]);
    setMostrarSelectorSuplementos(false);
    setMensajeFormulaFeedback({
      tipo: 'suplemento',
      texto: `🧪 Se agregó "${suplemento.nombre}" (${dosisEscalada} ${unidadLimpia}) a la receta.`
    });
  };

  // Abrir modal para guardar fórmula personalizada
  const handleAbrirModalGuardarFormula = () => {
    setNombreNuevaFormula(nombreEvento ? `${nombreEvento} (Personalizada)` : 'Fórmula Personalizada');
    setEtapaNuevaFormula(recomendacionSemana.etapaFenologica || 'Llenado, engrose y calibre de fruto');
    setObjetivoNuevaFormula(objetivoAplicacion || 'Nutrición balanceada');
    setNotasNuevaFormula(observaciones || '');
    setMostrarModalGuardarFormula(true);
  };

  // Confirmar y guardar la nueva fórmula en el catálogo
  const handleConfirmarGuardarFormula = (e) => {
    e.preventDefault();
    if (!nombreNuevaFormula.trim()) return;

    const vol = Number(volumenTanqueDirecto) || 1000;
    const salesBase1000L = lineasProductos.filter(l => l.producto && l.dosis).map((l, i) => {
      const dosisNum = parseFloat(String(l.dosis).replace(',', '.')) || 0;
      const dosis1000L = (dosisNum * 1000.0) / vol;
      return {
        producto: l.producto,
        dosis1000L: Math.round(dosis1000L * 10) / 10,
        unidad: 'g / tanque 1000 L',
        orden: i + 1,
        tipo: l.tipo || 'sal_fertilizante'
      };
    });

    const totalSalesGramos = salesBase1000L.reduce((acc, s) => acc + s.dosis1000L, 0);

    const nuevaFormula = {
      id: 'custom_form_' + Date.now(),
      codigo: 'FC' + Math.floor(Math.random() * 90 + 10),
      nombre: nombreNuevaFormula.trim(),
      cultivoId: visita.lote?.cultivoId || 'fresa',
      cultivoNombre: visita.lote?.cultivoNombre || 'Fresa (Fragaria x ananassa)',
      etapaFenologica: etapaNuevaFormula,
      objetivoFertilizacion: objetivoNuevaFormula,
      frecuenciaRecomendada: diaAplicacion,
      modalidad: modalidadSeleccionada,
      volumenBaseLitros: 1000,
      ceEstimada: conductividad || '1.3',
      phEstimado: ph || '5.8',
      salesBase1000L,
      totalSalesGramos,
      instruccionesPreparacion: notasNuevaFormula,
      origen: 'Fórmula Personalizada Guardada en AgroAsesor Pro CR',
      esPersonalizada: true
    };

    storageService.guardarFormulaPersonalizada(nuevaFormula);
    setMostrarModalGuardarFormula(false);
    setFormulaSeleccionadaId(nuevaFormula.id);
    setMensajeFormulaFeedback({
      tipo: 'exito',
      texto: `💾 ¡Fórmula "${nuevaFormula.nombre}" guardada con éxito en el catálogo! Ahora está disponible en el desplegable.`
    });
  };

  // Eliminar fórmula personalizada del catálogo
  const handleEliminarFormulaPersonalizada = (fId, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!confirm('¿Desea eliminar esta fórmula personalizada del catálogo?')) return;
    storageService.eliminarFormulaPersonalizada(fId);
    if (formulaSeleccionadaId === fId) setFormulaSeleccionadaId('');
    setMensajeFormulaFeedback({
      tipo: 'info',
      texto: 'Fórmula eliminada del catálogo.'
    });
  };

  // Manejar selección de producto en el dropdown
  const handleSeleccionarProductoEnLinea = (valor, lineas, setLineas, idx) => {
    const nuevas = [...lineas];
    if (valor === '__manual__') {
      nuevas[idx].esManual = true;
      nuevas[idx].producto = '';
    } else {
      nuevas[idx].esManual = false;
      nuevas[idx].producto = valor;
      // NO autocompletar dosis automáticamente (la dosis varía según lote, suelo y cultivo)
      if (!nuevas[idx].dosis) {
        nuevas[idx].dosis = '';
      }
    }
    setLineas(nuevas);
  };

  // Auto-búsqueda e inferencia agronómica de producto nuevo
  const handleInvestigarProductoNuevo = async (nombreProd) => {
    if (!nombreProd || nombreProd.trim().length < 2) return;
    setProductoInvestigadoMsg({ estado: 'buscando', texto: `Buscando riqueza técnica de "${nombreProd}"...` });
    try {
      const res = await geminiService.buscarOInferirComposicionFertilizante(nombreProd);
      if (res) {
        setProductoInvestigadoMsg({
          estado: 'exito',
          texto: `✅ Registrado en catálogo: ${res.nombre} (N:${res.nTotal}% P:${res.p2o5}% K:${res.k2o}% Ca:${res.cao}% Mg:${res.mgo}% S:${res.s}%)`
        });
      }
    } catch (err) {
      console.warn('Error investigando producto:', err);
      setProductoInvestigadoMsg(null);
    }
  };

  // Proponer fórmula para Dosatron con IA
  const handleProponerFormulaDosatronIa = () => {
    const prop = proponerFormulaDosatron({
      cultivo: visita.lote?.cultivoNombre || 'Fresa',
      etapaFenologica: recomendacionSemana.etapaFenologica || 'Llenado, engrose y calibre de fruto',
      objetivoFertilizacion: objetivoAplicacion,
      volumenTanqueMadreLitros: Number(volumenTanqueMadre) || 1000,
      relacionInyeccion: relacionInyeccion
    });

    if (prop) {
      setLineasTanqueA(prop.lineasTanqueA.map(l => ({ ...l, esManual: false })));
      setLineasTanqueB(prop.lineasTanqueB.map(l => ({ ...l, esManual: false })));
      if (prop.ceEsperada && !conductividad) {
        setConductividad(prop.ceEsperada.split(' ')[0]);
      }
      setResultadoAnalisisEventoIa({
        origen: 'Propuesta Preliminar Dosatron (Ing. Barquero / IA)',
        analisisIa: `Fórmula propuesta para ${prop.cultivo} (${prop.objetivo}).\n\n• Tanque A: Nitratos y Calcio asimilable.\n• Tanque B: Fosfatos, Sulfatos y Magnesio.\n• Justificación: ${prop.justificacion}`
      });
    }
  };

  // Analizar aplicación individual con IA
  const handleAnalizarAplicacionIndividual = async () => {
    setAnalizandoEventoIa(true);
    try {
      const appTemp = {
        id: eventoEditandoId || 'temp',
        nombre: nombreEvento || modalidadActualConfig.nombre,
        dia: diaAplicacion,
        objetivo: objetivoAplicacion,
        modalidad: modalidadSeleccionada,
        lineasProductos,
        lineasTanqueA,
        lineasTanqueB,
        volumenAguaLitros: modalidadSeleccionada === 'tanque_directo' ? 1000 : null
      };

      const res = await geminiService.analizarAplicacionFertilizacionIndividual({
        aplicacion: appTemp,
        cultivo: visita.lote?.cultivoNombre || 'Fresa',
        etapaFenologica: recomendacionSemana.etapaFenologica || 'Llenado, engrose y calibre de fruto',
        volumenTanqueMadre: Number(volumenTanqueMadre) || 1000,
        relacionInyeccion: relacionInyeccion
      });

      setResultadoAnalisisEventoIa(res);
    } catch (err) {
      console.error('Error analizando aplicación con IA:', err);
    } finally {
      setAnalizandoEventoIa(false);
    }
  };

  // Guardar nuevo evento / cuadro en la semana activa
  const handleGuardarEvento = (e) => {
    e.preventDefault();

    const todosProds = modalidadSeleccionada === 'dosatron' 
      ? [...lineasTanqueA, ...lineasTanqueB] 
      : lineasProductos;

    todosProds.forEach(l => {
      if (l.producto && l.producto.trim()) {
        storageService.registrarInsumoSiNoExiste({
          nombreComercial: l.producto.trim(),
          esFertilizante: true,
          categoria: modalidadActualConfig.nombre,
          dosis: `${l.dosis} ${l.unidad}`
        });
      }
    });

    const eventoFinal = {
      id: eventoEditandoId || ('ev-' + Date.now()),
      modalidad: modalidadSeleccionada,
      modalidadNombre: modalidadActualConfig.nombre,
      modalidadIcono: modalidadActualConfig.icono,
      nombreEvento: nombreEvento || `${modalidadActualConfig.nombre} - ${diaAplicacion} (${(recomendacionSemana.eventos || []).length + 1})`,
      dia: diaAplicacion,
      objetivo: objetivoAplicacion,
      volumenTanqueMadreLitros: modalidadSeleccionada === 'dosatron' ? Number(volumenTanqueMadre) || 1000 : null,
      volumenTanqueDirectoLitros: modalidadSeleccionada === 'tanque_directo' ? (Number(volumenTanqueDirecto) || 1000) : null,
      relacionInyeccion: modalidadSeleccionada === 'dosatron' ? relacionInyeccion : null,
      analisisIa: resultadoAnalisisEventoIa?.analisisIa || null,
      alcance: alcanceEvento,
      sistema: modalidadActualConfig.subtitulo,
      conductividadObjetivo: modalidadSeleccionada !== 'granular' && conductividad ? `${conductividad} mS/cm` : null,
      phObjetivo: modalidadSeleccionada !== 'granular' && ph ? ph : null,
      lineasTanqueA: modalidadSeleccionada === 'dosatron' ? lineasTanqueA.filter(l => l.producto.trim()) : null,
      lineasTanqueB: modalidadSeleccionada === 'dosatron' ? lineasTanqueB.filter(l => l.producto.trim()) : null,
      productos: modalidadSeleccionada !== 'dosatron' ? lineasProductos.filter(l => l.producto.trim()) : null,
      observacionesPie: observaciones || ''
    };

    let eventosActualizados = [];
    if (eventoEditandoId) {
      eventosActualizados = (recomendacionSemana.eventos || []).map(ev => 
        ev.id === eventoEditandoId ? eventoFinal : ev
      );
    } else {
      eventosActualizados = [...(recomendacionSemana.eventos || []), eventoFinal];
    }

    const recActualizada = { ...recomendacionSemana, eventos: eventosActualizados };

    const todasRecs = recomendaciones.filter(r => r.semana !== semanaActiva);
    todasRecs.push(recActualizada);
    todasRecs.sort((a, b) => a.semana - b.semana);

    onUpdateVisita({ ...visita, recomendacionesFertirriego: todasRecs });
    setMostrarModalEvento(false);
    setEventoEditandoId(null);
  };

  const handleEliminarEvento = (id) => {
    if (!confirm('¿Desea eliminar este cuadro de recomendación?')) return;
    const eventosActualizados = (recomendacionSemana.eventos || []).filter(e => e.id !== id);
    const recActualizada = { ...recomendacionSemana, eventos: eventosActualizados };
    const todasRecs = recomendaciones.filter(r => r.semana !== semanaActiva);
    todasRecs.push(recActualizada);
    todasRecs.sort((a, b) => a.semana - b.semana);
    onUpdateVisita({ ...visita, recomendacionesFertirriego: todasRecs });
  };

  const handleActualizarEtapaYObjetivo = (nuevaEtapa, nuevoObjetivo) => {
    const recActualizada = { 
      ...recomendacionSemana, 
      etapaFenologica: nuevaEtapa !== undefined ? nuevaEtapa : (recomendacionSemana.etapaFenologica || ''),
      objetivoFertilizacion: nuevoObjetivo !== undefined ? nuevoObjetivo : (recomendacionSemana.objetivoFertilizacion || '')
    };
    const todasRecs = recomendaciones.filter(r => r.semana !== semanaActiva);
    todasRecs.push(recActualizada);
    todasRecs.sort((a, b) => a.semana - b.semana);
    onUpdateVisita({ ...visita, recomendacionesFertirriego: todasRecs });
  };

  // Función para auditar la nutrición y fertilización de la semana activa
  const handleAuditarNutricionSemanal = async () => {
    setAuditandoNutricion(true);
    try {
      const eventosDeSemana = recomendacionSemana.eventos || [];
      const todasLineasA = [];
      const todasLineasB = [];
      const todasLineasProd = [];

      eventosDeSemana.forEach(ev => {
        if (ev.lineasTanqueA) todasLineasA.push(...ev.lineasTanqueA);
        if (ev.lineasTanqueB) todasLineasB.push(...ev.lineasTanqueB);
        if (ev.productos) todasLineasProd.push(...ev.productos);
      });

      // Se envían los eventos estructurados para auditar cada evento por separado (sin falsas incompatibilidades cruzadas de días distintos)
      const res = await geminiService.auditarNutricionFertirriego({
        cultivo: visita.lote?.cultivoNombre || 'Cultivo',
        etapaFenologica: recomendacionSemana.etapaFenologica || 'Llenado, engrose y calibre de fruto',
        objetivoFertilizacion: recomendacionSemana.objetivoFertilizacion || 'Llenado de fruto y calibre comercial',
        semana: semanaActiva,
        modalidad: eventosDeSemana[0]?.modalidad || 'dosatron',
        lineasA: todasLineasA,
        lineasB: todasLineasB,
        lineasProductos: todasLineasProd
      });

      setResultadoAuditoriaNutricional(res);
      setMostrarPanelAuditoria(true);
    } catch (e) {
      console.error('Error auditando nutrición:', e);
    } finally {
      setAuditandoNutricion(false);
    }
  };

  const handleAgregarSemana = () => {
    const siguienteSemana = Math.max(...recomendaciones.map(r => r.semana), 0) + 1;
    const nuevaRec = {
      semana: siguienteSemana,
      titulo: `Semana ${siguienteSemana} - Programa de Fertirriego`,
      alcance: 'Toda la Finca',
      eventos: []
    };
    const todasRecs = [...recomendaciones, nuevaRec].sort((a, b) => a.semana - b.semana);
    onUpdateVisita({ ...visita, recomendacionesFertirriego: todasRecs });
    setSemanaActiva(siguienteSemana);
  };

  return (
    <div className="space-y-4">
      {/* Cabecera del módulo */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              💧
            </span>
            <h2 className="font-bold text-base sm:text-lg text-slate-900">Recomendaciones de Fertirriego y Nutrición</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Selección directa de insumos en listas desplegables al tocar la celda. Alcance configurable por finca o lote.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenAi('fertirriego')}
            className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition flex items-center gap-1.5 active:scale-95"
            title="Consultar al Asistente IA para revisión o propuesta"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Consultar IA</span>
          </button>

          <button
            onClick={handleAgregarSemana}
            className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition flex items-center gap-1 shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Semana</span>
          </button>
        </div>
      </div>

      {/* Selector de Semanas */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {recomendaciones.length > 0 ? (
          recomendaciones.map(r => (
            <button
              key={r.semana}
              onClick={() => setSemanaActiva(r.semana)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 shrink-0 transition ${
                semanaActiva === r.semana
                  ? 'bg-blue-700 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Semana {r.semana}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                semanaActiva === r.semana ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600'
              }`}>
                {(r.eventos || []).length}
              </span>
            </button>
          ))
        ) : (
          <button
            onClick={() => setSemanaActiva(1)}
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-blue-700 text-white flex items-center gap-2"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Semana 1</span>
          </button>
        )}
      </div>

      {/* PANEL DE CONTROL AGRONÓMICO: ETAPA FENOLÓGICA Y OBJETIVO DE FERTILIZACIÓN */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-md space-y-3 border border-emerald-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-700/60 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#acf847] text-[#102000] flex items-center justify-center font-black text-sm shadow-xs">
              🌱
            </span>
            <div>
              <h3 className="font-headline font-bold text-sm text-white flex items-center gap-1.5">
                <span>Semana {semanaActiva} • Curva de Absorción y Metas Fenológicas</span>
              </h3>
              <p className="text-[11px] text-emerald-200/90 font-body">
                Cultivo: <strong>{visita.lote?.cultivoNombre || 'Cultivo'}</strong> ({visita.lote?.variedad || 'Variedad estándar'})
              </p>
            </div>
          </div>
          <button
            onClick={handleAuditarNutricionSemanal}
            disabled={auditandoNutricion || (recomendacionSemana.eventos || []).length === 0}
            className="px-3 py-1.5 rounded-xl bg-[#acf847] hover:bg-[#91db2a] text-[#102000] text-xs font-black transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 self-start sm:self-auto"
            title="Evaluar balance químico y estequiométrico con IA"
          >
            <Sparkles className={`w-3.5 h-3.5 text-[#102000] ${auditandoNutricion ? 'animate-spin' : ''}`} />
            <span>{auditandoNutricion ? 'Auditando...' : '⚡ Auditar Nutrición con I.A.'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
          {/* Selector de Etapa Fenológica */}
          <div className="space-y-1">
            <label className="text-[11px] font-headline font-bold text-emerald-200 flex items-center justify-between">
              <span>🌿 Etapa Fenológica del Cultivo:</span>
              <span className="text-[10px] text-emerald-300/80 font-normal">Requerimiento nutricional</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={recomendacionSemana.etapaFenologica || ''}
                onChange={(e) => handleActualizarEtapaYObjetivo(e.target.value, undefined)}
                placeholder="Ej: Planta saliendo de cosecha, Floración..."
                className="flex-1 bg-emerald-950/90 text-white placeholder:text-emerald-400/60 border border-emerald-600/70 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#acf847] outline-none"
              />
              <select
                onChange={(e) => {
                  if (e.target.value) handleActualizarEtapaYObjetivo(e.target.value, undefined);
                }}
                value=""
                className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs border border-emerald-600 rounded-xl px-2 py-2 cursor-pointer outline-none"
                title="Seleccionar etapa predefinida"
              >
                <option value="" disabled>Sugerencias...</option>
                {ETAPAS_FENOLOGICAS.map((et, i) => (
                  <option key={i} value={et}>{et}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Selector de Objetivo de Fertilización */}
          <div className="space-y-1">
            <label className="text-[11px] font-headline font-bold text-emerald-200 flex items-center justify-between">
              <span>🎯 Objetivo de la Fertilización:</span>
              <span className="text-[10px] text-emerald-300/80 font-normal">Meta agronómica</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={recomendacionSemana.objetivoFertilizacion || ''}
                onChange={(e) => handleActualizarEtapaYObjetivo(undefined, e.target.value)}
                placeholder="Ej: Promoción de floración, Llenado de fruto..."
                className="flex-1 bg-emerald-950/90 text-white placeholder:text-emerald-400/60 border border-emerald-600/70 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#acf847] outline-none"
              />
              <select
                onChange={(e) => {
                  if (e.target.value) handleActualizarEtapaYObjetivo(undefined, e.target.value);
                }}
                value=""
                className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs border border-emerald-600 rounded-xl px-2 py-2 cursor-pointer outline-none"
                title="Seleccionar objetivo predefinido"
              >
                <option value="" disabled>Sugerencias...</option>
                {OBJETIVOS_FERTILIZACION.map((ob, i) => (
                  <option key={i} value={ob}>{ob}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL DE ASISTENTE I.A. NUTRICIONAL Y BALANCE ESTEQUIOMÉTRICO */}
      {resultadoAuditoriaNutricional && mostrarPanelAuditoria && (
        <div className="bg-white rounded-2xl border-2 border-[#00652c] p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[#acf847] text-[#416900] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h4 className="font-headline font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span>Asistente I.A. Nutricional: Balance Elemental y Curvas Fenológicas</span>
                  <span className="text-[9.5px] font-mono font-bold bg-[#d3ffd5] text-[#005323] px-2 py-0.5 rounded-full border border-[#79db8d]">
                    Semana {semanaActiva}
                  </span>
                </h4>
                <p className="text-[10.5px] text-slate-500 font-mono">
                  {resultadoAuditoriaNutricional.origen} • Evaluado a las {resultadoAuditoriaNutricional.fechaAuditoria}
                </p>
              </div>
            </div>
            <button
              onClick={() => setMostrarPanelAuditoria(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              title="Cerrar panel de auditoría"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tarjetas de Aporte Elemental Acumulado */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-headline font-bold text-slate-700 uppercase tracking-wider block">
              📊 Aporte Estequiométrico de Nutrientes en la Semana {semanaActiva}:
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center font-mono">
              <div className="bg-blue-50/70 p-2 rounded-xl border border-blue-200">
                <span className="text-[10px] text-blue-800 font-bold block font-body">N Total</span>
                <strong className="text-xs text-blue-950 font-black">{resultadoAuditoriaNutricional.metricas.nTotalKg.toFixed(2)} kg</strong>
                <span className="text-[8.5px] text-slate-500 block font-sans">
                  NO3: {resultadoAuditoriaNutricional.metricas.formasNitrogeno.pctNitrico}%
                </span>
              </div>
              <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-800 font-bold block font-body">P2O5</span>
                <strong className="text-xs text-emerald-950 font-black">{resultadoAuditoriaNutricional.metricas.p2o5Kg.toFixed(2)} kg</strong>
                <span className="text-[8.5px] text-slate-500 block font-sans">
                  P: {resultadoAuditoriaNutricional.metricas.pElementalKg.toFixed(2)} kg
                </span>
              </div>
              <div className="bg-purple-50/70 p-2 rounded-xl border border-purple-200">
                <span className="text-[10px] text-purple-800 font-bold block font-body">K2O</span>
                <strong className="text-xs text-purple-950 font-black">{resultadoAuditoriaNutricional.metricas.k2oKg.toFixed(2)} kg</strong>
                <span className="text-[8.5px] text-purple-700 font-bold block font-sans">
                  K:N = {resultadoAuditoriaNutricional.metricas.relacionKN}
                </span>
              </div>
              <div className="bg-cyan-50/70 p-2 rounded-xl border border-cyan-200">
                <span className="text-[10px] text-cyan-800 font-bold block font-body">CaO</span>
                <strong className="text-xs text-cyan-950 font-black">{resultadoAuditoriaNutricional.metricas.caoKg.toFixed(2)} kg</strong>
                <span className="text-[8.5px] text-slate-500 block font-sans">
                  Ca: {resultadoAuditoriaNutricional.metricas.caElementalKg.toFixed(2)} kg
                </span>
              </div>
              <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-200">
                <span className="text-[10px] text-amber-800 font-bold block font-body">MgO</span>
                <strong className="text-xs text-amber-950 font-black">{resultadoAuditoriaNutricional.metricas.mgoKg.toFixed(2)} kg</strong>
                <span className="text-[8.5px] text-slate-500 block font-sans">
                  Mg: {resultadoAuditoriaNutricional.metricas.mgElementalKg.toFixed(2)} kg
                </span>
              </div>
              <div className="bg-yellow-50/70 p-2 rounded-xl border border-yellow-200">
                <span className="text-[10px] text-yellow-800 font-bold block font-body">Azufre (S)</span>
                <strong className="text-xs text-yellow-950 font-black">{resultadoAuditoriaNutricional.metricas.sKg.toFixed(2)} kg</strong>
                <span className="text-[8.5px] text-slate-500 block font-sans">
                  Sulfatos
                </span>
              </div>
            </div>

            {/* Microelementos */}
            {(resultadoAuditoriaNutricional.metricas.feGramos > 0 || resultadoAuditoriaNutricional.metricas.bGramos > 0 || resultadoAuditoriaNutricional.metricas.znGramos > 0) && (
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-700">
                <span className="font-bold text-slate-900 font-body">🔬 Microelementos:</span>
                {resultadoAuditoriaNutricional.metricas.feGramos > 0 && <span>Fe: <strong>{resultadoAuditoriaNutricional.metricas.feGramos.toFixed(1)} g</strong></span>}
                {resultadoAuditoriaNutricional.metricas.znGramos > 0 && <span>Zn: <strong>{resultadoAuditoriaNutricional.metricas.znGramos.toFixed(1)} g</strong></span>}
                {resultadoAuditoriaNutricional.metricas.mnGramos > 0 && <span>Mn: <strong>{resultadoAuditoriaNutricional.metricas.mnGramos.toFixed(1)} g</strong></span>}
                {resultadoAuditoriaNutricional.metricas.bGramos > 0 && <span>B: <strong>{resultadoAuditoriaNutricional.metricas.bGramos.toFixed(1)} g</strong></span>}
              </div>
            )}
          </div>

          {/* Alertas de Incompatibilidad Química */}
          {resultadoAuditoriaNutricional.compatibilidad.alertas.length > 0 && (
            <div className="space-y-1">
              {resultadoAuditoriaNutricional.compatibilidad.alertas.map((alt, aIdx) => (
                <div key={aIdx} className="bg-red-50 p-2.5 rounded-xl border border-red-200 text-xs text-red-950 font-bold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{alt}</span>
                </div>
              ))}
            </div>
          )}

          {/* Advertencias de solubilidad */}
          {resultadoAuditoriaNutricional.compatibilidad.advertencias.length > 0 && (
            <div className="space-y-1">
              {resultadoAuditoriaNutricional.compatibilidad.advertencias.map((adv, aIdx) => (
                <div key={aIdx} className="bg-amber-50 p-2 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                  <span className="shrink-0 text-amber-600 text-sm">⚠️</span>
                  <span>{adv}</span>
                </div>
              ))}
            </div>
          )}

          {/* Diagnóstico Fenológico y Sugerencias de Ajuste */}
          <div className="bg-[#f2f3ff] p-3 rounded-xl border border-[#dae2fd] text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-[#dae2fd] pb-1">
              <span className="font-headline font-bold text-[#00652c] flex items-center gap-1.5">
                <span className="shrink-0 text-sm">🧠</span>
                <span>Evaluación de la Curva de Absorción ({recomendacionSemana.etapaFenologica || 'Etapa Actual'} • {recomendacionSemana.objetivoFertilizacion || 'Objetivo'}):</span>
              </span>
            </div>

            {resultadoAuditoriaNutricional.fenologia.sugerencias.length > 0 && (
              <div className="space-y-1">
                {resultadoAuditoriaNutricional.fenologia.sugerencias.map((sug, sIdx) => (
                  <p key={sIdx} className="text-slate-800 text-[11.5px] leading-relaxed bg-white p-2 rounded-lg border border-amber-200/70">
                    {sug}
                  </p>
                ))}
              </div>
            )}

            {resultadoAuditoriaNutricional.fenologia.observaciones.length > 0 && (
              <div className="space-y-1">
                {resultadoAuditoriaNutricional.fenologia.observaciones.map((obs, oIdx) => (
                  <p key={oIdx} className="text-[#005323] text-[11.5px] leading-relaxed bg-[#d3ffd5]/40 p-2 rounded-lg border border-[#79db8d]">
                    {obs}
                  </p>
                ))}
              </div>
            )}

            {/* Comentario en vivo de Gemini si existe */}
            {resultadoAuditoriaNutricional.comentarioIa && (
              <div className="mt-2 pt-2 border-t border-[#dae2fd] text-slate-800 text-xs space-y-1">
                <strong className="text-[#005b8c] font-headline font-bold block">
                  🌐 Dictamen Especializado de Gemini AI:
                </strong>
                <div className="whitespace-pre-line leading-relaxed text-[11.5px] bg-white p-2.5 rounded-lg border border-slate-200">
                  {resultadoAuditoriaNutricional.comentarioIa}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PROGRAMA OFICIAL DE FERTIRRIEGO PARA FRESA (F1, F2, F3, F4) */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-4 rounded-3xl shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-2 bg-emerald-500/20 text-[#acf847] rounded-2xl border border-emerald-500/30">
              🍓
            </span>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                <span>Programa de Fertirriego para Fresa (F1 a F4)</span>
                <span className="text-[10px] bg-[#acf847] text-[#131b2e] px-2 py-0.5 rounded-full font-black uppercase">
                  Llano Grande, Cartago
                </span>
              </h3>
              <p className="text-xs text-emerald-200/80">
                Fórmulas estequiométricas para tanque directo / 1000 L. Se ajustan automáticamente a la capacidad del tanque de la finca.
              </p>
            </div>
          </div>
          <span className="text-[11px] text-emerald-300 font-mono">
            Pulsos: 2x por semana
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {formulasDisponibles.filter(f => f.esOficial).map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => handleCargarFormulaDirectaDesdeBoton(f.id)}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-left transition group active:scale-95 flex flex-col justify-between space-y-2 hover:border-[#acf847]/60"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-[#acf847] text-[#131b2e]">
                    {f.codigo}
                  </span>
                  <span className="text-[10px] text-emerald-300 font-mono">
                    {f.ceEstimada ? `CE ~${f.ceEstimada}` : ''}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-white mt-1.5 group-hover:text-[#acf847] transition">
                  {f.nombre.replace(/ \(Llano Grande\)/i, '')}
                </h4>
                <p className="text-[10.5px] text-emerald-200/70 line-clamp-2 mt-0.5">
                  {f.objetivoFertilizacion}
                </p>
              </div>

              <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-emerald-300">
                <span>{f.duracionTipica || '2-4 sem'}</span>
                <span className="font-bold group-hover:translate-x-0.5 transition">+ Cargar Cuadro →</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Botones de Modalidades */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Generar Cuadro Nutricional (Semana {semanaActiva}):</span>
          </h3>
          <span className="text-[11px] text-slate-400">Toque una modalidad</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {MODALIDADES.map(m => (
            <button
              key={m.id}
              onClick={() => handleAbrirModalConModalidad(m.id)}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/60 bg-slate-50 flex flex-col items-center text-center transition group active:scale-95"
            >
              <span className="text-2xl mb-1 group-hover:scale-110 transition">{m.icono}</span>
              <span className="font-bold text-xs text-slate-800 group-hover:text-blue-900 leading-tight">
                {m.nombre}
              </span>
              <span className="text-[9px] text-slate-400 mt-1 line-clamp-1">
                + Crear Cuadro
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Cuadros Programados */}
      <div className="space-y-4">
        {(recomendacionSemana.eventos && recomendacionSemana.eventos.length > 0) ? (
          recomendacionSemana.eventos.map((ev, index) => (
            <div key={ev.id || index} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl p-2 rounded-xl bg-blue-50 border border-blue-100">
                    {ev.modalidadIcono || '💧'}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">{ev.nombreEvento}</h4>
                      {ev.dia && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                          📅 {ev.dia}
                        </span>
                      )}
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        {ev.modalidadNombre || ev.modalidad}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        {ev.alcance || 'Toda la Finca'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <p className="text-xs text-slate-500">{ev.sistema}</p>
                      {ev.objetivo && (
                        <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          🎯 Objetivo: {ev.objetivo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {ev.conductividadObjetivo && (
                    <span className="hidden sm:inline-block text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      CE: {ev.conductividadObjetivo}
                    </span>
                  )}
                  {ev.phObjetivo && (
                    <span className="hidden sm:inline-block text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                      pH: {ev.phObjetivo}
                    </span>
                  )}
                  <button
                    onClick={() => handleEditarEvento(ev)}
                    className="px-2.5 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition flex items-center gap-1 text-xs font-bold border border-blue-200"
                    title="Editar cuadro de recomendación"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => handleEliminarEvento(ev.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Eliminar este cuadro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Cuadro de Fertilización y Pesaje para el Productor (Formato clásico: Sal, Dosis, Unidades) */}
              {(() => {
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

                return (
                  <div className="space-y-3">
                    {/* CUADRO / TABLA ESTRUCTURADA DE FERTILIZACIÓN (3 COLUMNAS: SAL, DOSIS, UNIDADES) */}
                    {!esDual && (
                      <div className="border-2 border-emerald-300 rounded-2xl overflow-hidden bg-white shadow-sm">
                        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-3.5 py-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base">📋</span>
                            <span className="font-extrabold text-xs sm:text-sm">
                              CUADRO DE FERTILIZACIÓN ({ev.nombreEvento || ev.nombre || 'Fórmula Nutricional'})
                            </span>
                          </div>
                          <span className="bg-white/20 border border-white/40 text-white px-2.5 py-0.5 rounded-full font-mono font-bold text-xs">
                            🛢️ Cantidad de Agua: {volTanque.toLocaleString()} Litros
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700 font-extrabold text-[11px] uppercase border-b-2 border-slate-200">
                                <th className="p-2.5">Sal / Fertilizante</th>
                                <th className="p-2.5 text-center w-28">Dosis</th>
                                <th className="p-2.5 text-center w-36">Unidades</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono">
                              {prodsDirectos.length > 0 ? (
                                prodsDirectos.map((it, idx) => (
                                  <tr key={idx} className="hover:bg-emerald-50/50 transition">
                                    <td className="p-2.5 font-bold font-sans text-slate-900">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <span>{it.producto}</span>
                                        {it.esSuplemento && (
                                          <span className="text-[9px] font-sans font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full border border-emerald-300">
                                            🌿 Suplemento / Biológico
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="p-2.5 text-center">
                                      <span className="font-mono font-black text-emerald-900 bg-emerald-100/90 px-3 py-1 rounded-xl border border-emerald-300 inline-block text-sm">
                                        {it.dosis}
                                      </span>
                                    </td>
                                    <td className="p-2.5 text-center font-mono text-slate-600 font-bold">
                                      {it.unidad}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="3" className="p-3 text-center text-slate-500 italic font-body">
                                    Sin sales especificadas todavía en esta aplicación.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                            {prodsDirectos.length > 0 && (
                              <tfoot>
                                <tr className="bg-emerald-50 font-bold text-emerald-950 border-t-2 border-emerald-500 text-xs">
                                  <td className="p-3 font-extrabold font-sans">TOTAL DE SALES A DISOLVER</td>
                                  <td className="p-3 text-center font-mono font-black text-emerald-900 text-sm">
                                    {totalDosisDirecto.toLocaleString()}
                                  </td>
                                  <td className="p-3 text-center font-mono font-bold text-emerald-800">
                                    g / {volTanque} L
                                  </td>
                                </tr>
                              </tfoot>
                            )}
                          </table>
                        </div>

                        {/* AL PIE DEL CUADRO SE DEJAN LAS INSTRUCCIONES */}
                        <div className="bg-slate-50 p-3.5 border-t border-slate-200 space-y-2.5 text-xs">
                          <div className="font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
                            <span>📝</span> Instrucciones al Pie del Cuadro:
                          </div>

                          <div className="bg-blue-50/90 border-l-4 border-blue-600 p-2.5 rounded-r-xl text-blue-950 space-y-1">
                            <strong className="block text-xs font-bold">🔄 Orden Estricto de Disolución en Tanque ({volTanque.toLocaleString()} L de agua):</strong>
                            <ol className="list-decimal list-inside space-y-1 text-[11.5px] text-blue-900 pl-1 leading-relaxed">
                              <li><strong>1. Llenado previo:</strong> Llenar el tanque con el 60% – 70% de agua limpia (aprox. {Math.round(volTanque * 0.65).toLocaleString()} L) antes de incorporar las sales. Nunca verter fertilizantes en seco al fondo del tanque.</li>
                              <li><strong>2. Fosfatos y Sulfatos primero:</strong> Disolver primero las fuentes de fósforo (MAP / MKP) y luego los sulfatos (Sulfato de Potasio SoluSOP y Sulfato de Magnesio Epsom). Agitar enérgicamente hasta disolución total.</li>
                              <li><strong>3. Nitrato de Calcio de último:</strong> Con el retorno o agitación activa, incorporar el Calcinit (Nitrato de Calcio) de último para evitar precipitación de yeso. Completar con agua limpia hasta la marca de los {volTanque.toLocaleString()} Litros.</li>
                              {tieneSuplementos && (
                                <li><strong>4. Suplementos / Biológicos:</strong> Agregar los productos biológicos (ej. <em>Trichoderma</em>, nematicidas o bioestimulantes) al final con el tanque a volumen completo y aplicar en las primeras horas de la mañana.</li>
                              )}
                            </ol>
                          </div>

                          {obsTexto && (
                            <div className="bg-amber-50 border-l-4 border-amber-500 p-2.5 rounded-r-xl text-amber-950 text-[11.5px] leading-relaxed">
                              <strong>👨‍🌾 Indicación Agronómica para el Productor:</strong> {obsTexto}
                            </div>
                          )}

                          {ev.analisisIa && (
                            <div className="bg-emerald-50 border-l-4 border-emerald-600 p-2.5 rounded-r-xl text-emerald-950 text-[11.5px] leading-relaxed">
                              <strong>✨ Dictamen Técnico y Compatibilidad IA:</strong> {ev.analisisIa}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* CASO DOSATRON (TANQUE A Y TANQUE B) */}
                    {esDual && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {prodsA.length > 0 && (
                            <div className="border border-blue-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                              <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white px-3 py-1.5 flex items-center justify-between text-xs">
                                <strong className="font-extrabold">🔵 TANQUE A (Calcio, Nitratos y Quelatos Fe)</strong>
                                <span className="bg-white/20 px-2 py-0.5 rounded-full font-mono text-[10px]">
                                  {volMadre} L
                                </span>
                              </div>
                              <table className="w-full text-xs text-left border-collapse font-mono">
                                <thead>
                                  <tr className="bg-blue-50/80 text-blue-900 font-extrabold text-[10.5px] uppercase border-b border-blue-100">
                                    <th className="p-2 font-sans">Sal / Fertilizante</th>
                                    <th className="p-2 text-center w-24">Dosis</th>
                                    <th className="p-2 text-center w-28">Unidades</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-blue-50">
                                  {prodsA.map((it, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50/40">
                                      <td className="p-2 font-sans font-bold text-slate-800">{it.producto}</td>
                                      <td className="p-2 text-center font-bold text-blue-900">{it.dosis}</td>
                                      <td className="p-2 text-center text-slate-600 text-[11px]">{it.unidad}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-blue-100/60 font-bold text-blue-950 border-t border-blue-200 text-xs">
                                    <td className="p-2 font-sans">TOTAL TANQUE A</td>
                                    <td className="p-2 text-center font-mono">{totalDosisA.toLocaleString()}</td>
                                    <td className="p-2 text-center font-mono">g / {volMadre} L</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          )}

                          {prodsB.length > 0 && (
                            <div className="border border-amber-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                              <div className="bg-gradient-to-r from-amber-900 to-amber-800 text-white px-3 py-1.5 flex items-center justify-between text-xs">
                                <strong className="font-extrabold">🟡 TANQUE B (Fósforo, Sulfatos y Magnesio)</strong>
                                <span className="bg-white/20 px-2 py-0.5 rounded-full font-mono text-[10px]">
                                  {volMadre} L
                                </span>
                              </div>
                              <table className="w-full text-xs text-left border-collapse font-mono">
                                <thead>
                                  <tr className="bg-amber-50/80 text-amber-950 font-extrabold text-[10.5px] uppercase border-b border-amber-100">
                                    <th className="p-2 font-sans">Sal / Fertilizante</th>
                                    <th className="p-2 text-center w-24">Dosis</th>
                                    <th className="p-2 text-center w-28">Unidades</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-50">
                                  {prodsB.map((it, idx) => (
                                    <tr key={idx} className="hover:bg-amber-50/40">
                                      <td className="p-2 font-sans font-bold text-slate-800">{it.producto}</td>
                                      <td className="p-2 text-center font-bold text-amber-950">{it.dosis}</td>
                                      <td className="p-2 text-center text-slate-600 text-[11px]">{it.unidad}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-amber-100/60 font-bold text-amber-950 border-t border-amber-200 text-xs">
                                    <td className="p-2 font-sans">TOTAL TANQUE B</td>
                                    <td className="p-2 text-center font-mono">{totalDosisB.toLocaleString()}</td>
                                    <td className="p-2 text-center font-mono">g / {volMadre} L</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* OBSERVACIONES ABAJO DE LOS CUADROS EN DOSATRON */}
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                          <div className="font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
                            <span>📝</span> Instrucciones de Inyección y Observaciones para el Productor
                          </div>
                          <div className="bg-blue-50 border-l-4 border-blue-600 p-2 rounded-r-xl text-blue-950">
                            <strong>💉 Inyección Proporcional Dual Dosatron ({ev.relacionInyeccion || '1:100'}):</strong>
                            <p className="mt-0.5">Calibrar inyectores al {ev.relacionInyeccion === '1:100' ? '1.0% (1:100)' : ev.relacionInyeccion}. Mantener estricta segregación química: nunca mezclar concentrados A y B en el mismo recipiente antes de inyectar.</p>
                          </div>
                          {ev.observacionesPie && (
                            <div className="bg-amber-50 border-l-4 border-amber-500 p-2 rounded-r-xl text-amber-950">
                              <strong>👨‍🌾 Indicación del Agrónomo:</strong> {ev.observacionesPie}
                            </div>
                          )}
                          {ev.analisisIa && (
                            <div className="bg-emerald-50 border-l-4 border-emerald-600 p-2 rounded-r-xl text-emerald-950">
                              <strong>✨ Dictamen Técnico IA:</strong> {ev.analisisIa}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-xl font-bold">
              💧
            </div>
            <h3 className="font-bold text-slate-800 text-sm">No hay cuadros programados para la Semana {semanaActiva}</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Seleccione una modalidad arriba para generar una recomendación nutricional con lista desplegable en cada celda.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL PARA AGREGAR CUADRO / EVENTO SEGÚN MODALIDAD */}
      {/* ========================================================= */}
      {mostrarModalEvento && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            
            {/* Cabecera del Modal */}
            <div className="bg-blue-800 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{modalidadActualConfig.icono}</span>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                    {eventoEditandoId ? `Editar Cuadro: ${nombreEvento || modalidadActualConfig.nombre}` : `Nuevo Cuadro: ${modalidadActualConfig.nombre}`}
                  </h3>
                  <p className="text-[11px] text-blue-200">Semana {semanaActiva} • {modalidadActualConfig.subtitulo}</p>
                </div>
              </div>
              <button 
                onClick={() => setMostrarModalEvento(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleGuardarEvento} className="p-4 space-y-4 overflow-y-auto flex-1">
              
              {/* SELECTOR DE PROGRAMAS / FÓRMULAS PREDEFINIDAS (F1, F2, F3, F4 Y PERSONALIZADAS) */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 p-3.5 rounded-2xl border-2 border-emerald-300 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🍓</span>
                    <div>
                      <label className="block text-xs font-black text-emerald-950">
                        Cargar Fórmula Predefinida / Programa de Fresa:
                      </label>
                      <span className="text-[10.5px] text-emerald-700 font-sans block">
                        Jala automáticamente productos, dosis calculadas para el tanque, etapa fenológica y objetivo técnico.
                      </span>
                    </div>
                  </div>
                  {formulaSeleccionadaId && (
                    <button
                      type="button"
                      onClick={() => setFormulaSeleccionadaId('')}
                      className="text-[10.5px] text-slate-500 hover:text-slate-800 underline font-semibold"
                    >
                      Limpiar selección
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={formulaSeleccionadaId}
                    onChange={(e) => handleSeleccionarFormulaPredefinida(e.target.value)}
                    className="flex-1 text-xs font-bold text-slate-900 border-2 border-emerald-400 rounded-xl p-2.5 bg-white outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                  >
                    <option value="">-- 📋 Toque aquí para seleccionar fórmula (F1, F2, F3, F4 o guardadas) --</option>
                    <optgroup label="🍓 Programa Oficial de Fresa (Llano Grande de Cartago)">
                      {formulasDisponibles.filter(f => f.esOficial).map(f => (
                        <option key={f.id} value={f.id}>
                          {f.codigo}: {f.nombre} ({f.etapaFenologica})
                        </option>
                      ))}
                    </optgroup>
                    {formulasDisponibles.some(f => f.esPersonalizada) && (
                      <optgroup label="⭐ Fórmulas Personalizadas Guardadas por el Agrónomo">
                        {formulasDisponibles.filter(f => f.esPersonalizada).map(f => (
                          <option key={f.id} value={f.id}>
                            ⭐ {f.nombre} ({f.etapaFenologica || 'Personalizada'})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>

                  {formulasDisponibles.find(f => f.id === formulaSeleccionadaId)?.esPersonalizada && (
                    <button
                      type="button"
                      onClick={(e) => handleEliminarFormulaPersonalizada(formulaSeleccionadaId, e)}
                      title="Eliminar esta fórmula personalizada del catálogo"
                      className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Borrar</span>
                    </button>
                  )}
                </div>

                {/* Feedback dinámico al cargar fórmula */}
                {mensajeFormulaFeedback && (
                  <div className={`p-2 rounded-xl text-xs flex items-center justify-between gap-2 animate-fadeIn ${
                    mensajeFormulaFeedback.tipo === 'exito' ? 'bg-emerald-100/90 text-emerald-950 border border-emerald-300 font-semibold' :
                    mensajeFormulaFeedback.tipo === 'suplemento' ? 'bg-indigo-50 text-indigo-950 border border-indigo-200 font-medium' :
                    'bg-blue-50 text-blue-950 border border-blue-200'
                  }`}>
                    <span>{mensajeFormulaFeedback.texto}</span>
                    <button type="button" onClick={() => setMensajeFormulaFeedback(null)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Título y Alcance (Finca vs Lote) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre o Identificador del Cuadro</label>
                  <input
                    type="text"
                    value={nombreEvento}
                    onChange={(e) => setNombreEvento(e.target.value)}
                    placeholder={`Ej: ${modalidadActualConfig.nombre} - ${diaAplicacion}`}
                    className="w-full text-xs font-medium border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alcance / Destino de la Recomendación</label>
                  <select
                    value={alcanceEvento}
                    onChange={(e) => setAlcanceEvento(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 bg-slate-50 outline-none"
                  >
                    <option value="Toda la Finca">🌱 Toda la Finca ({visita.finca?.nombre || 'Finca'})</option>
                    <option value="Solo Lotes en Producción">🍓 Solo Lotes en Producción / Cosecha</option>
                    <option value="Solo Lotes en Crecimiento">🌿 Solo Lotes en Crecimiento / Vegetativo</option>
                    {lotesDeFinca.map(l => (
                      <option key={l.id} value={`Lote: ${l.nombre}`}>
                        📍 Lote específico: {l.nombre} ({l.cultivoNombre || ''})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CONTROL DE CAPACIDAD DEL TANQUE DIRECTO Y ESCALADO AUTOMÁTICO */}
              {modalidadSeleccionada === 'tanque_directo' && (
                <div className="bg-blue-50/80 p-3 rounded-2xl border border-blue-200 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl p-1.5 bg-blue-100 text-blue-800 rounded-xl">💧</span>
                    <div>
                      <label className="block text-xs font-extrabold text-blue-950">
                        Capacidad del Tanque Directo de Riego:
                      </label>
                      <p className="text-[10.5px] text-blue-800">
                        Las dosis de sales se ajustan automáticamente si el tanque cambia de volumen.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-blue-300 shadow-xs">
                      <input
                        type="number"
                        min="10"
                        step="10"
                        value={volumenTanqueDirecto}
                        onChange={(e) => handleCambiarVolumenTanqueDirecto(e.target.value)}
                        className="w-20 text-xs font-black text-center text-blue-950 outline-none"
                      />
                      <span className="text-xs font-bold text-slate-600">Litros</span>
                    </div>

                    {/* Botones de capacidades estándar */}
                    <div className="flex items-center gap-1">
                      {[200, 500, 1000, 2000].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => handleCambiarVolumenTanqueDirecto(v.toString())}
                          className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition ${
                            Number(volumenTanqueDirecto) === v
                              ? 'bg-blue-700 text-white shadow-xs'
                              : 'bg-white text-blue-800 border border-blue-200 hover:bg-blue-100'
                          }`}
                        >
                          {v >= 1000 ? `${v/1000}k L` : `${v} L`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* DÍA Y OBJETIVO DE LA APLICACIÓN (COMBOBOX) */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      📅 Día Programado
                    </label>
                    <select
                      value={diaAplicacion}
                      onChange={(e) => setDiaAplicacion(e.target.value)}
                      className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Lunes">Lunes</option>
                      <option value="Martes">Martes</option>
                      <option value="Miércoles">Miércoles</option>
                      <option value="Jueves">Jueves</option>
                      <option value="Viernes">Viernes</option>
                      <option value="Sábado">Sábado</option>
                      <option value="Domingo">Domingo</option>
                      <option value="Lunes y Jueves">Lunes y Jueves (Frecuencia 2x)</option>
                      <option value="Martes y Viernes">Martes y Viernes (Frecuencia 2x)</option>
                      <option value="Riego Diario">Riego Diario Continuo</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      💡 Las aplicaciones en días distintos no se mezclan en el sistema.
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-800">
                        🎯 Objetivo de esta Aplicación
                      </label>
                      <button
                        type="button"
                        onClick={() => setEsObjetivoManual(!esObjetivoManual)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                      >
                        {esObjetivoManual ? 'Seleccionar de lista' : '✏️ Escribir objetivo manual'}
                      </button>
                    </div>

                    {!esObjetivoManual ? (
                      <select
                        value={objetivoAplicacion}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setEsObjetivoManual(true);
                            setObjetivoAplicacion('');
                          } else {
                            setObjetivoAplicacion(e.target.value);
                          }
                        }}
                        className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Llenado y engrose de fruto">Llenado, engrose y calibre de fruto comercial</option>
                        <option value="Inducción floral y cuaje de botón">Inducción floral, viabilidad de polen y cuaje</option>
                        <option value="Desarrollo radicular y pelos absorbentes">Desarrollo radicular y emisión de pelos absorbentes</option>
                        <option value="Crecimiento vegetativo y área foliar">Crecimiento vegetativo, macollamiento y biomasa</option>
                        <option value="Firmeza de pulpa y vida postcosecha">Firmeza de tejido celular, vida de anaquel y consistencia</option>
                        <option value="Corrección de microelementos y balance">Corrección de clorosis y balance de micronutrientes</option>
                        <option value="Sanidad del bulbo radicular">Sanidad del bulbo húmedo y choque bioestimulante</option>
                        <option value="__custom__">✏️ [+ Escribir otro objetivo manual...]</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={objetivoAplicacion}
                        onChange={(e) => setObjetivoAplicacion(e.target.value)}
                        placeholder="Escriba el objetivo agronómico específico para esta aplicación..."
                        className="w-full text-xs font-semibold border border-blue-400 rounded-xl p-2 outline-none bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                </div>

                {/* PARÁMETROS ESPECÍFICOS PARA DOSATRON */}
                {modalidadSeleccionada === 'dosatron' && (
                  <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="block text-[11px] font-bold text-slate-700">Capacidad Tanque Madre:</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={volumenTanqueMadre}
                            onChange={(e) => setVolumenTanqueMadre(e.target.value)}
                            className="w-20 text-xs font-bold text-center border border-slate-300 rounded-lg p-1.5 bg-white"
                          />
                          <span className="text-xs text-slate-600 font-semibold">Litros</span>
                        </div>
                      </div>

                      <div>
                        <span className="block text-[11px] font-bold text-slate-700">Relación Inyección:</span>
                        <select
                          value={relacionInyeccion}
                          onChange={(e) => setRelacionInyeccion(e.target.value)}
                          className="text-xs font-bold border border-slate-300 rounded-lg p-1.5 bg-white outline-none"
                        >
                          <option value="1:100">1:100 (1.0%)</option>
                          <option value="1:50">1:50 (2.0%)</option>
                          <option value="1:25">1:25 (4.0%)</option>
                          <option value="1:200">1:200 (0.5%)</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleProponerFormulaDosatronIa}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold hover:from-blue-700 hover:to-indigo-700 shadow-sm flex items-center gap-1.5 transition active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>✨ Proponer Fórmula IA para Dosatron</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Banner de producto investigado con IA */}
              {productoInvestigadoMsg && (
                <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                  productoInvestigadoMsg.estado === 'exito' 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                    : 'bg-blue-50 border-blue-300 text-blue-900 animate-pulse'
                }`}>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">{productoInvestigadoMsg.texto}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProductoInvestigadoMsg(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* CE y pH si aplica */}
              {modalidadSeleccionada !== 'granular' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">CE Objetivo (mS/cm)</label>
                    <input
                      type="text"
                      value={conductividad}
                      onChange={(e) => setConductividad(e.target.value)}
                      placeholder="1.5"
                      className="w-full text-xs font-bold text-center border border-slate-300 rounded-xl p-2.5 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">pH Objetivo</label>
                    <input
                      type="text"
                      value={ph}
                      onChange={(e) => setPh(e.target.value)}
                      placeholder="5.8"
                      className="w-full text-xs font-bold text-center border border-slate-300 rounded-xl p-2.5 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* ALERTA DE QUÍMICA CALCIO VS SULFATOS */}
              {alertaCalcioA && (
                <div className="bg-red-50 border-2 border-red-400 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-red-900 animate-pulse">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Incompatibilidad Química:</strong>
                    <span>{alertaCalcioA}</span>
                  </div>
                </div>
              )}

              {/* DOSATRON: TANQUE A Y TANQUE B CON LISTAS DESPLEGABLES NATIVAS */}
              {modalidadSeleccionada === 'dosatron' ? (
                <div className="space-y-4">
                  {/* TANQUE A */}
                  <div className="border border-blue-200 rounded-2xl p-3.5 bg-blue-50/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-blue-900">
                        🔵 TANQUE A: Calcio, Hierro y Nitratos
                      </span>
                      <button
                        type="button"
                        onClick={() => setLineasTanqueA([...lineasTanqueA, { producto: '', dosis: '', unidad: 'kg / tanque 1000 L', aporte: '', esManual: false }])}
                        className="px-2 py-1 bg-blue-600 text-white rounded-lg text-[11px] font-bold hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Agregar Insumo
                      </button>
                    </div>

                    <div className="space-y-2">
                      {lineasTanqueA.map((l, idx) => (
                        <div key={idx} className="bg-white p-2.5 rounded-xl border border-blue-100 flex flex-wrap sm:flex-nowrap items-center gap-2">
                          {/* CELDA DE PRODUCTO: LISTA DESPLEGABLE NATIVA */}
                          {!l.esManual ? (
                            <div className="flex-1 min-w-[180px] flex items-center gap-1">
                              <select
                                value={l.producto}
                                onChange={(e) => handleSeleccionarProductoEnLinea(e.target.value, lineasTanqueA, setLineasTanqueA, idx, productosTanqueA)}
                                className="w-full text-xs font-bold text-slate-900 border border-blue-200 rounded-lg p-2 bg-blue-50/50 outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="__manual__">✏️ [+ DIGITAR PRODUCTO MANUAL / NO ESTÁ EN LISTA...]</option>
                                <option value="">-- Toque para desplegar catálogo Tanque A ({productosTanqueA.length}) --</option>
                                {productosTanqueA.map((p, i) => (
                                  <option key={i} value={p.nombreComercial}>
                                    {p.nombreComercial} ({p.categoria || 'Soluble'})
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => {
                                  const nuevo = [...lineasTanqueA];
                                  nuevo[idx].esManual = true;
                                  nuevo[idx].producto = '';
                                  nuevo[idx].dosis = '';
                                  setLineasTanqueA(nuevo);
                                }}
                                className="p-2 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200"
                                title="Digitar producto manualmente"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex-1 min-w-[180px] flex items-center gap-1">
                              <div className="relative flex-1 flex items-center">
                                <input
                                  type="text"
                                  value={l.producto}
                                  onChange={(e) => {
                                    const nuevo = [...lineasTanqueA];
                                    nuevo[idx].producto = e.target.value;
                                    setLineasTanqueA(nuevo);
                                  }}
                                  placeholder="Escriba nombre del insumo o fórmula manual..."
                                  className="w-full text-xs font-semibold border border-blue-300 rounded-lg p-2 pr-8 outline-none"
                                />
                                {l.producto && l.producto.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => handleInvestigarProductoNuevo(l.producto)}
                                    className="absolute right-1.5 p-1 text-blue-600 hover:text-blue-800"
                                    title="Auto-buscar riqueza técnica con IA"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const nuevo = [...lineasTanqueA];
                                  nuevo[idx].esManual = false;
                                  setLineasTanqueA(nuevo);
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Volver a lista desplegable"
                              >
                                <List className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          <input
                            type="text"
                            value={l.dosis}
                            onChange={(e) => {
                              const nuevo = [...lineasTanqueA];
                              nuevo[idx].dosis = e.target.value;
                              setLineasTanqueA(nuevo);
                            }}
                            placeholder="Dosis"
                            className="w-20 text-xs font-bold text-center border border-slate-200 rounded-lg p-2 outline-none"
                          />

                          <select
                            value={l.unidad}
                            onChange={(e) => {
                              const nuevo = [...lineasTanqueA];
                              nuevo[idx].unidad = e.target.value;
                              setLineasTanqueA(nuevo);
                            }}
                            className="text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 outline-none"
                          >
                            {modalidadActualConfig.unidades.map(u => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => setLineasTanqueA(lineasTanqueA.filter((_, i) => i !== idx))}
                            className="p-1 text-slate-400 hover:text-red-500 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* TANQUE B */}
                  <div className="border border-amber-200 rounded-2xl p-3.5 bg-amber-50/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-amber-900">
                        🟡 TANQUE B: Fósforo, Sulfatos, Magnesio, Micro y Ácido
                      </span>
                      <button
                        type="button"
                        onClick={() => setLineasTanqueB([...lineasTanqueB, { producto: '', dosis: '', unidad: 'kg / tanque 1000 L', aporte: '', esManual: false }])}
                        className="px-2 py-1 bg-amber-600 text-white rounded-lg text-[11px] font-bold hover:bg-amber-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Agregar Insumo
                      </button>
                    </div>

                    <div className="space-y-2">
                      {lineasTanqueB.map((l, idx) => (
                        <div key={idx} className="bg-white p-2.5 rounded-xl border border-amber-100 flex flex-wrap sm:flex-nowrap items-center gap-2">
                          {/* CELDA DE PRODUCTO: LISTA DESPLEGABLE NATIVA */}
                          {!l.esManual ? (
                            <div className="flex-1 min-w-[180px] flex items-center gap-1">
                              <select
                                value={l.producto}
                                onChange={(e) => handleSeleccionarProductoEnLinea(e.target.value, lineasTanqueB, setLineasTanqueB, idx, productosTanqueB)}
                                className="w-full text-xs font-bold text-slate-900 border border-amber-200 rounded-lg p-2 bg-amber-50/50 outline-none focus:ring-2 focus:ring-amber-500"
                              >
                                <option value="__manual__">✏️ [+ DIGITAR PRODUCTO MANUAL / NO ESTÁ EN LISTA...]</option>
                                <option value="">-- Toque para desplegar catálogo Tanque B ({productosTanqueB.length}) --</option>
                                {productosTanqueB.map((p, i) => (
                                  <option key={i} value={p.nombreComercial}>
                                    {p.nombreComercial} ({p.categoria || 'Soluble'})
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => {
                                  const nuevo = [...lineasTanqueB];
                                  nuevo[idx].esManual = true;
                                  nuevo[idx].producto = '';
                                  nuevo[idx].dosis = '';
                                  setLineasTanqueB(nuevo);
                                }}
                                className="p-2 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200"
                                title="Digitar producto manualmente"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex-1 min-w-[180px] flex items-center gap-1">
                              <div className="relative flex-1 flex items-center">
                                <input
                                  type="text"
                                  value={l.producto}
                                  onChange={(e) => {
                                    const nuevo = [...lineasTanqueB];
                                    nuevo[idx].producto = e.target.value;
                                    setLineasTanqueB(nuevo);
                                  }}
                                  placeholder="Escriba nombre del insumo o fórmula manual..."
                                  className="w-full text-xs font-semibold border border-amber-300 rounded-lg p-2 pr-8 outline-none"
                                />
                                {l.producto && l.producto.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => handleInvestigarProductoNuevo(l.producto)}
                                    className="absolute right-1.5 p-1 text-amber-600 hover:text-amber-800"
                                    title="Auto-buscar riqueza técnica con IA"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const nuevo = [...lineasTanqueB];
                                  nuevo[idx].esManual = false;
                                  setLineasTanqueB(nuevo);
                                }}
                                className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                                title="Volver a lista desplegable"
                              >
                                <List className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          <input
                            type="text"
                            value={l.dosis}
                            onChange={(e) => {
                              const nuevo = [...lineasTanqueB];
                              nuevo[idx].dosis = e.target.value;
                              setLineasTanqueB(nuevo);
                            }}
                            placeholder="Dosis"
                            className="w-20 text-xs font-bold text-center border border-slate-200 rounded-lg p-2 outline-none"
                          />

                          <select
                            value={l.unidad}
                            onChange={(e) => {
                              const nuevo = [...lineasTanqueB];
                              nuevo[idx].unidad = e.target.value;
                              setLineasTanqueB(nuevo);
                            }}
                            className="text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 outline-none"
                          >
                            {modalidadActualConfig.unidades.map(u => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => setLineasTanqueB(lineasTanqueB.filter((_, i) => i !== idx))}
                            className="p-1 text-slate-400 hover:text-red-500 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* LISTA ÚNICA PARA LAS DEMÁS MODALIDADES CON DROPDOWN NATIVO */
                <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/40 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                    <div>
                      <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                        <span>Insumos y Sales ({modalidadActualConfig.nombre})</span>
                        {modalidadSeleccionada === 'tanque_directo' && (
                          <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full border border-blue-200">
                            Tanque: {volumenTanqueDirecto} L
                          </span>
                        )}
                      </span>
                      <p className="text-[10.5px] text-slate-500">
                        Modifique dosis libremente o incorpore Trichoderma, nematicidas o suplementos.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setLineasProductos([...lineasProductos, { producto: '', dosis: '', unidad: modalidadSeleccionada === 'tanque_directo' ? `g / tanque ${volumenTanqueDirecto} L` : modalidadActualConfig.unidades[0], aporte: '', esManual: false }])}
                        className="px-2.5 py-1.5 bg-emerald-700 text-white rounded-xl text-[11px] font-bold hover:bg-emerald-800 flex items-center gap-1 transition active:scale-95 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Agregar Sal / Insumo
                      </button>

                      <button
                        type="button"
                        onClick={() => setMostrarSelectorSuplementos(!mostrarSelectorSuplementos)}
                        className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-xl text-[11px] font-bold hover:bg-indigo-700 flex items-center gap-1 transition active:scale-95 shadow-xs"
                        title="Agregar Trichoderma, Nematicida o Suplemento"
                      >
                        <span>🦠 + Suplemento / Nematicida</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleAbrirModalGuardarFormula}
                        disabled={lineasProductos.length === 0}
                        className="px-2.5 py-1.5 bg-slate-800 text-white rounded-xl text-[11px] font-bold hover:bg-slate-900 flex items-center gap-1 transition active:scale-95 disabled:opacity-40 shadow-xs"
                        title="Guardar esta tabla como nueva fórmula reutilizable en el catálogo"
                      >
                        <Save className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Guardar como Fórmula</span>
                      </button>
                    </div>
                  </div>

                  {/* SUB-SELECTOR DE SUPLEMENTOS RÁPIDOS */}
                  {mostrarSelectorSuplementos && (
                    <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-3 space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-indigo-950 flex items-center gap-1">
                          <span>🧪 Suplementos, Biocontroladores y Nematicidas Comunes:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setMostrarSelectorSuplementos(false)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {suplementosDisponibles.map(sup => (
                          <button
                            key={sup.id}
                            type="button"
                            onClick={() => handleAgregarSuplemento(sup)}
                            className="p-2 rounded-xl bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-100/50 text-left transition flex items-start gap-2"
                          >
                            <span className="text-base mt-0.5">{sup.icono}</span>
                            <div className="flex-1 min-w-0">
                              <strong className="block text-[11.5px] text-indigo-950 font-bold leading-tight">
                                {sup.nombre}
                              </strong>
                              <span className="text-[10px] text-slate-500 block truncate">
                                {sup.categoria} • Ref: {sup.dosisSugerida1000L} {sup.unidad}
                              </span>
                            </div>
                            <span className="text-[11px] font-black text-indigo-600 self-center">+</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {lineasProductos.map((l, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-wrap sm:flex-nowrap items-center gap-2">
                        {/* CELDA DE PRODUCTO: LISTA DESPLEGABLE NATIVA */}
                        {!l.esManual ? (
                          <div className="flex-1 min-w-[200px] flex items-center gap-1">
                            <select
                              value={l.producto}
                              onChange={(e) => handleSeleccionarProductoEnLinea(e.target.value, lineasProductos, setLineasProductos, idx)}
                              className="w-full text-xs font-bold text-slate-900 border border-slate-300 rounded-lg p-2 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="__manual__">✏️ [+ Escribir otro producto manual...]</option>
                              <option value="">-- Toque para desplegar catálogo ({todosFertilizantes.length} insumos) --</option>
                              {todosFertilizantes.map((p, i) => (
                                <option key={i} value={p.nombreComercial}>
                                  {p.nombreComercial} ({p.categoria || ''})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="flex-1 min-w-[200px] flex items-center gap-1">
                            <div className="relative flex-1 flex items-center">
                              <input
                                type="text"
                                value={l.producto}
                                onChange={(e) => {
                                  const nuevo = [...lineasProductos];
                                  nuevo[idx].producto = e.target.value;
                                  setLineasProductos(nuevo);
                                }}
                                placeholder="Escriba nombre del producto o fórmula manual..."
                                className="w-full text-xs font-semibold border border-emerald-400 rounded-lg p-2 pr-8 outline-none"
                              />
                              {l.producto && l.producto.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => handleInvestigarProductoNuevo(l.producto)}
                                  className="absolute right-1.5 p-1 text-emerald-700 hover:text-emerald-900"
                                  title="Auto-buscar riqueza técnica con IA"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const nuevo = [...lineasProductos];
                                nuevo[idx].esManual = false;
                                setLineasProductos(nuevo);
                              }}
                              className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                              title="Volver a lista desplegable"
                            >
                              <List className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        <input
                          type="text"
                          value={l.dosis}
                          onChange={(e) => {
                            const nuevo = [...lineasProductos];
                            nuevo[idx].dosis = e.target.value;
                            setLineasProductos(nuevo);
                          }}
                          placeholder="Dosis"
                          className="w-24 text-xs font-bold text-center border border-slate-200 rounded-lg p-2 outline-none"
                        />

                        <select
                          value={l.unidad}
                          onChange={(e) => {
                            const nuevo = [...lineasProductos];
                            nuevo[idx].unidad = e.target.value;
                            setLineasProductos(nuevo);
                          }}
                          className="text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 outline-none"
                        >
                          {modalidadActualConfig.unidades.map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => setLineasProductos(lineasProductos.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-400 hover:text-red-500 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* TOTALIZADOR EN VIVO DEL PESAJE PARA EL TANQUE SELECCIONADO */}
                  {modalidadSeleccionada === 'tanque_directo' && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">⚖️</span>
                        <div>
                          <strong className="text-emerald-950 block">Pesaje Total para Tanque de {volumenTanqueDirecto} L de Agua:</strong>
                          <span className="text-[11px] text-emerald-800 font-mono font-bold">
                            Total de Sales: {lineasProductos.reduce((acc, l) => acc + (parseFloat(String(l.dosis).replace(',', '.')) || 0), 0).toLocaleString()} g ({((lineasProductos.reduce((acc, l) => acc + (parseFloat(String(l.dosis).replace(',', '.')) || 0), 0)) / 1000).toFixed(2)} kg)
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] bg-white border border-emerald-300 text-emerald-900 px-2.5 py-1 rounded-xl font-bold font-mono">
                        Concentración: {volumenTanqueDirecto > 0 ? ((lineasProductos.reduce((acc, l) => acc + (parseFloat(String(l.dosis).replace(',', '.')) || 0), 0)) / Number(volumenTanqueDirecto)).toFixed(2) : 0} g/L
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Instrucciones y Observaciones Abajo del Cuadro */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Instrucciones y Observaciones de Preparación para el Productor
                  </label>
                  {modalidadSeleccionada === 'tanque_directo' && (
                    <button
                      type="button"
                      onClick={() => setObservaciones(`1. Llenar el tanque con el 65% de agua (${Math.round(volumenTanqueDirecto * 0.65)} L). 2. Disolver primero fosfatos (MAP/MKP) y sulfatos (SOP y Epsom). 3. Agregar Calcinit de último con agitación activa y completar con agua a ${volumenTanqueDirecto} L. 4. Inyectar en el pulso correspondiente.`)}
                      className="text-[10.5px] font-bold text-blue-700 hover:text-blue-900 underline flex items-center gap-1"
                    >
                      🔄 Insertar Orden de Mezcla Técnico
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej: Mezclar primero en balde antes de verter al tanque. No aplicar bajo sol directo."
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* SECCIÓN DE AUDITORÍA IA DE ESTA APLICACIÓN ESPECÍFICA */}
              <div className="pt-2 border-t border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Auditoría y Dictamen IA de esta Aplicación</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAnalizarAplicacionIndividual}
                    disabled={analizandoEventoIa}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 flex items-center gap-1.5 transition active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>{analizandoEventoIa ? 'Analizando con IA...' : '✨ Analizar esta Aplicación'}</span>
                  </button>
                </div>

                {resultadoAnalisisEventoIa && (
                  <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/70 p-3 rounded-2xl border border-blue-200 text-xs text-slate-800 space-y-2">
                    <div className="flex items-center justify-between font-bold text-blue-900 border-b border-blue-200/60 pb-1">
                      <span>Dictamen Técnico ({resultadoAnalisisEventoIa.origen || 'IA Agronómica'})</span>
                      <span className="text-[10px] text-blue-600 font-semibold">Criterio: Ing. Barquero (Colegiado 5896)</span>
                    </div>

                    {resultadoAnalisisEventoIa.analisisIa ? (
                      <p className="text-xs whitespace-pre-line leading-relaxed text-slate-700">
                        {resultadoAnalisisEventoIa.analisisIa}
                      </p>
                    ) : (
                      <div className="space-y-1.5 text-xs">
                        <p><strong>🎯 Objetivo:</strong> {resultadoAnalisisEventoIa.objetivo}</p>
                        <p><strong>⚖️ Estado:</strong> {resultadoAnalisisEventoIa.justificacion}</p>
                        {resultadoAnalisisEventoIa.sugerencias?.length > 0 && (
                          <div>
                            <strong>💡 Sugerencias:</strong>
                            <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                              {resultadoAnalisisEventoIa.sugerencias.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMostrarModalEvento(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={alertaCalcioA !== null}
                  className={`px-5 py-2 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition ${
                    alertaCalcioA !== null
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-700 hover:bg-blue-800 text-white active:scale-95'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{eventoEditandoId ? 'Actualizar Cuadro' : `Guardar Cuadro de ${modalidadActualConfig.nombre}`}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA GUARDAR NUEVA FÓRMULA EN EL CATÁLOGO */}
      {mostrarModalGuardarFormula && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-500 text-white rounded-xl font-bold">💾</span>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base leading-tight">
                    Guardar como Nueva Fórmula en Catálogo
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Quedará disponible en el desplegable para cualquier visita y finca
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalGuardarFormula(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarGuardarFormula} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre de la Fórmula *
                </label>
                <input
                  type="text"
                  required
                  value={nombreNuevaFormula}
                  onChange={(e) => setNombreNuevaFormula(e.target.value)}
                  placeholder="Ej: F5 - Fresa Floración Alta San Rafael + Trichoderma"
                  className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Etapa Fenológica
                  </label>
                  <select
                    value={etapaNuevaFormula}
                    onChange={(e) => setEtapaNuevaFormula(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2 outline-none bg-white font-medium"
                  >
                    {ETAPAS_FENOLOGICAS.map((et, i) => (
                      <option key={i} value={et}>{et}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Objetivo Agronómico
                  </label>
                  <input
                    type="text"
                    value={objetivoNuevaFormula}
                    onChange={(e) => setObjetivoNuevaFormula(e.target.value)}
                    placeholder="Ej: Llenado de fruto y calibre"
                    className="w-full text-xs border border-slate-300 rounded-xl p-2 outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instrucciones u Observaciones Técnicas
                </label>
                <textarea
                  rows={2}
                  value={notasNuevaFormula}
                  onChange={(e) => setNotasNuevaFormula(e.target.value)}
                  placeholder="Orden de mezcla, precauciones de solubilidad..."
                  className="w-full text-xs border border-slate-300 rounded-xl p-2 outline-none"
                />
              </div>

              {/* Resumen de insumos que se guardarán (normalizados a base 1000 L) */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-800 text-[11px] block">
                  📋 Resumen de insumos incluidos (Base 1000 L):
                </span>
                <ul className="text-[11px] text-slate-600 space-y-0.5 max-h-32 overflow-y-auto">
                  {lineasProductos.filter(l => l.producto && l.dosis).map((l, i) => {
                    const dNum = parseFloat(String(l.dosis).replace(',', '.')) || 0;
                    const d1000 = Math.round(((dNum * 1000) / (Number(volumenTanqueDirecto) || 1000)) * 10) / 10;
                    return (
                      <li key={i} className="flex justify-between border-b border-slate-100 py-0.5">
                        <span className="font-semibold text-slate-800">{l.producto}</span>
                        <span className="font-mono font-bold text-emerald-800">{d1000} g / 1000 L</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMostrarModalGuardarFormula(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Confirmar y Guardar en Catálogo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
