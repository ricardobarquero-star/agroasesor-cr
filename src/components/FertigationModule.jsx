import React, { useState } from 'react';
import { 
  Droplet, Plus, Trash2, AlertTriangle, Sparkles, Check, 
  Layers, FlaskConical, HelpCircle, ChevronDown, Calendar,
  Sliders, Gauge, Sprout, ArrowRight, BookOpen, Search, X,
  MapPin, CheckCircle2, Edit3, List
} from 'lucide-react';
import { crAgroDatabase } from '../data/crAgroDatabase';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import { 
  ETAPAS_FENOLOGICAS, 
  OBJETIVOS_FERTILIZACION, 
  calcularNutrientesTotales, 
  auditarIncompatibilidadQuimica, 
  auditarObjetivoFenologico 
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
  const [filtroCategoriaFert, setFiltroCategoriaFert] = useState('todos');
  const [investigandoFertIdx, setInvestigandoFertIdx] = useState(null);
  const [eventoEditandoId, setEventoEditandoId] = useState(null); // null = nuevo, string = editando
  const [modalidadSeleccionada, setModalidadSeleccionada] = useState('dosatron');
  const [auditandoNutricion, setAuditandoNutricion] = useState(false);
  const [resultadoAuditoriaNutricional, setResultadoAuditoriaNutricional] = useState(null);
  const [mostrarPanelAuditoria, setMostrarPanelAuditoria] = useState(true);
  
  // Campos del evento
  const [nombreEvento, setNombreEvento] = useState('');
  const [alcanceEvento, setAlcanceEvento] = useState('Toda la Finca');
  const [conductividad, setConductividad] = useState('1.5');
  const [ph, setPh] = useState('5.8');
  const [observaciones, setObservaciones] = useState('');

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

  // Manejar selección de producto en el dropdown
  const handleSeleccionarProductoEnLinea = (valor, lineas, setLineas, idx, listaFuente) => {
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
      nombreEvento: nombreEvento || `${modalidadActualConfig.nombre} (${(recomendacionSemana.eventos || []).length + 1})`,
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

      const res = await geminiService.auditarNutricionFertirriego({
        cultivo: visita.lote?.cultivoNombre || 'Cultivo',
        etapaFenologica: recomendacionSemana.etapaFenologica || 'Planta saliendo de cosecha / Recuperación',
        objetivoFertilizacion: recomendacionSemana.objetivoFertilizacion || 'Promoción de floración y fertilidad de polen',
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
                  <span className="material-symbols-outlined text-[16px] text-amber-600 shrink-0">info</span>
                  <span>{adv}</span>
                </div>
              ))}
            </div>
          )}

          {/* Diagnóstico Fenológico y Sugerencias de Ajuste */}
          <div className="bg-[#f2f3ff] p-3 rounded-xl border border-[#dae2fd] text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-[#dae2fd] pb-1">
              <span className="font-headline font-bold text-[#00652c] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">psychology</span>
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
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        {ev.modalidadNombre || ev.modalidad}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        {ev.alcance || 'Toda la Finca'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{ev.sistema}</p>
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

              {/* Si es Dosatron */}
              {ev.lineasTanqueA && ev.lineasTanqueB ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border border-blue-200 rounded-xl p-3 bg-blue-50/40">
                    <div className="flex items-center justify-between font-bold text-xs text-blue-900 mb-2 border-b border-blue-200/60 pb-1">
                      <span>🔵 TANQUE A (Calcio y Nitratos)</span>
                      <span className="text-[10px] text-blue-700">Concentrado 1000 L</span>
                    </div>
                    <div className="space-y-1.5">
                      {ev.lineasTanqueA.map((l, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs bg-white p-2 rounded-lg border border-blue-100">
                          <p className="font-bold text-slate-800">{l.producto}</p>
                          <span className="font-extrabold text-blue-900 shrink-0 ml-2">
                            {l.dosis} {l.unidad}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-amber-200 rounded-xl p-3 bg-amber-50/40">
                    <div className="flex items-center justify-between font-bold text-xs text-amber-900 mb-2 border-b border-amber-200/60 pb-1">
                      <span>🟡 TANQUE B (Fósforo, Sulfatos y Micro)</span>
                      <span className="text-[10px] text-amber-700">Concentrado 1000 L</span>
                    </div>
                    <div className="space-y-1.5">
                      {ev.lineasTanqueB.map((l, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs bg-white p-2 rounded-lg border border-amber-100">
                          <p className="font-bold text-slate-800">{l.producto}</p>
                          <span className="font-extrabold text-amber-900 shrink-0 ml-2">
                            {l.dosis} {l.unidad}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Para modalidades de lista única */
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60">
                  <div className="space-y-1.5">
                    {(ev.productos || []).map((l, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                        <p className="font-bold text-slate-900">{l.producto}</p>
                        <span className="font-extrabold text-emerald-800 shrink-0 ml-2 text-sm">
                          {l.dosis} {l.unidad}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ev.observacionesPie && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-1.5">
                  <span className="font-bold text-slate-700 shrink-0">Instrucciones:</span>
                  <span>{ev.observacionesPie}</span>
                </div>
              )}
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
              
              {/* Título y Alcance (Finca vs Lote) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre o Identificador del Cuadro</label>
                  <input
                    type="text"
                    value={nombreEvento}
                    onChange={(e) => setNombreEvento(e.target.value)}
                    placeholder={`Ej: ${modalidadActualConfig.nombre} - Desarrollo`}
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
                              <input
                                type="text"
                                value={l.producto}
                                onChange={(e) => {
                                  const nuevo = [...lineasTanqueA];
                                  nuevo[idx].producto = e.target.value;
                                  setLineasTanqueA(nuevo);
                                }}
                                placeholder="Escriba nombre del producto"
                                className="w-full text-xs font-semibold border border-blue-300 rounded-lg p-2 outline-none"
                              />
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
                              <input
                                type="text"
                                value={l.producto}
                                onChange={(e) => {
                                  const nuevo = [...lineasTanqueB];
                                  nuevo[idx].producto = e.target.value;
                                  setLineasTanqueB(nuevo);
                                }}
                                placeholder="Escriba nombre del producto"
                                className="w-full text-xs font-semibold border border-amber-300 rounded-lg p-2 outline-none"
                              />
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
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-800">
                      Insumos Recomendados ({modalidadActualConfig.nombre})
                    </span>
                    <button
                      type="button"
                      onClick={() => setLineasProductos([...lineasProductos, { producto: '', dosis: '', unidad: modalidadActualConfig.unidades[0], aporte: '', esManual: false }])}
                      className="px-2 py-1 bg-emerald-700 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-800 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Agregar Insumo
                    </button>
                  </div>

                  <div className="space-y-2">
                    {lineasProductos.map((l, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-wrap sm:flex-nowrap items-center gap-2">
                        {/* CELDA DE PRODUCTO: LISTA DESPLEGABLE NATIVA */}
                        {!l.esManual ? (
                          <div className="flex-1 min-w-[200px] flex items-center gap-1">
                            <select
                              value={l.producto}
                              onChange={(e) => handleSeleccionarProductoEnLinea(e.target.value, lineasProductos, setLineasProductos, idx, todosFertilizantes)}
                              className="w-full text-xs font-bold text-slate-900 border border-slate-300 rounded-lg p-2 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="">-- Toque para desplegar catálogo ({todosFertilizantes.length} insumos) --</option>
                              {todosFertilizantes.map((p, i) => (
                                <option key={i} value={p.nombreComercial}>
                                  {p.nombreComercial} ({p.categoria || ''})
                                </option>
                              ))}
                              <option value="__manual__">✏️ [+ Escribir otro producto manual...]</option>
                            </select>
                          </div>
                        ) : (
                          <div className="flex-1 min-w-[200px] flex items-center gap-1">
                            <input
                              type="text"
                              value={l.producto}
                              onChange={(e) => {
                                const nuevo = [...lineasProductos];
                                nuevo[idx].producto = e.target.value;
                                setLineasProductos(nuevo);
                              }}
                              placeholder="Escriba nombre del producto o fórmula"
                              className="w-full text-xs font-semibold border border-emerald-400 rounded-lg p-2 outline-none"
                            />
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
                </div>
              )}

              {/* Instrucciones */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instrucciones Específicas para el Productor / Regador
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej: Mezclar primero en balde antes de verter al tanque. No aplicar bajo sol directo."
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                />
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

    </div>
  );
}
