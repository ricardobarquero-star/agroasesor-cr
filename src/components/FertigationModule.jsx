import React, { useState } from 'react';
import { 
  Droplet, Plus, Trash2, AlertTriangle, Sparkles, Check, 
  Layers, FlaskConical, HelpCircle, ChevronDown, Calendar,
  Sliders, Gauge, Sprout, ArrowRight, BookOpen, Search, X,
  MapPin, CheckCircle2
} from 'lucide-react';
import { crAgroDatabase } from '../data/crAgroDatabase';
import { storageService } from '../services/storageService';

// Modalidades oficiales solicitadas por el Ing. Agr. Ricardo Barquero
const MODALIDADES = [
  { 
    id: 'dosatron', 
    nombre: 'Dosatron (Tanque A y B)', 
    icono: '🧪', 
    subtitulo: 'Inyección proporcional dual (A: Calcio/Nitratos, B: Fosfatos/Sulfatos)',
    unidades: ['kg / tanque 1000 L', 'g / tanque 1000 L', 'L / tanque 1000 L', 'cc / tanque 1000 L', '% inyección (ej: 1:100)']
  },
  { 
    id: 'tanque_directo', 
    nombre: 'Tanque Directo', 
    icono: '💧', 
    subtitulo: 'Mezcla en un solo tanque listo para riego o goteo directo',
    unidades: ['kg / tanque 1000 L', 'g / tanque 1000 L', 'kg / estañón (200 L)', 'g / estañón (200 L)', 'g / L', 'cc / L']
  },
  { 
    id: 'venturi', 
    nombre: 'Mezclas con Venturi', 
    icono: '🔄', 
    subtitulo: 'Succión por depresión Venturi desde estañón o tanque nodriza',
    unidades: ['kg / estañón (200 L)', 'g / estañón (200 L)', 'L / estañón (200 L)', 'cc / estañón (200 L)', 'kg / tanque 1000 L', 'g / L']
  },
  { 
    id: 'inyeccion', 
    nombre: 'Inyección de Fertirriego', 
    icono: '⚡', 
    subtitulo: 'Cabezal de inyección automatizada o bombas dosificadoras',
    unidades: ['L / m3 de agua', 'cc / m3 de agua', 'g / m3 de agua', 'kg / m3 de agua', 'kg / ha']
  },
  { 
    id: 'drench', 
    nombre: 'Drench por Estañón / Planta', 
    icono: '🪴', 
    subtitulo: 'Aplicación localizada al cuello o raíz con bomba o lanza',
    unidades: ['g / estañón (200 L)', 'cc / estañón (200 L)', 'kg / estañón (200 L)', 'g / planta', 'cc / planta (ej: 150-200 cc)', 'L / estañón (200 L)']
  },
  { 
    id: 'granular', 
    nombre: 'Fertilización Granular al Suelo', 
    icono: '🌾', 
    subtitulo: 'Abonamiento edáfico sólido (Pre-siembra, aporque o desarrollo)',
    unidades: ['kg / ha', 'sacos (46 kg) / ha', 'g / planta', 'kg / cama (100 m)', 'quintales / mz']
  }
];

export default function FertigationModule({ visita, onUpdateVisita, onOpenAi }) {
  const [semanaActiva, setSemanaActiva] = useState(1);
  const [mostrarModalEvento, setMostrarModalEvento] = useState(false);
  const [modalidadSeleccionada, setModalidadSeleccionada] = useState('dosatron');
  
  // Campos del nuevo evento
  const [nombreEvento, setNombreEvento] = useState('');
  const [alcanceEvento, setAlcanceEvento] = useState('Toda la Finca');
  const [conductividad, setConductividad] = useState('1.5');
  const [ph, setPh] = useState('5.8');
  const [observaciones, setObservaciones] = useState('');

  // Filas limpias (Sin recomendaciones impuestas por la aplicación)
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
  const fertilizantesDisponibles = storageService.getTodosLosFertilizantes(modalidadSeleccionada);

  // Obtener lista de lotes de la finca actual para el selector de alcance
  const clientes = storageService.getClientes();
  const clienteActual = clientes.find(c => c.id === visita.clienteId);
  const fincaActual = clienteActual?.fincas?.find(f => f.id === visita.finca?.id);
  const lotesDeFinca = fincaActual?.lotes || [visita.lote].filter(Boolean);

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

  // Abrir modal configurando un lienzo limpio para que el agrónomo redacte su recomendación
  const handleAbrirModalConModalidad = (modId) => {
    setModalidadSeleccionada(modId);
    setNombreEvento('');
    setAlcanceEvento('Toda la Finca');
    setObservaciones('');
    
    // Iniciar con 1 fila limpia y vacía lista para llenarse
    if (modId === 'dosatron') {
      setLineasTanqueA([{ producto: '', dosis: '', unidad: 'kg / tanque 1000 L', aporte: '' }]);
      setLineasTanqueB([{ producto: '', dosis: '', unidad: 'kg / tanque 1000 L', aporte: '' }]);
      setLineasProductos([]);
    } else {
      const config = MODALIDADES.find(m => m.id === modId) || MODALIDADES[0];
      setLineasProductos([{ producto: '', dosis: '', unidad: config.unidades[0], aporte: '' }]);
      setLineasTanqueA([]);
      setLineasTanqueB([]);
    }
    setMostrarModalEvento(true);
  };

  // Guardar nuevo evento / cuadro en la semana activa
  const handleGuardarEvento = (e) => {
    e.preventDefault();

    // Auto-aprender insumos nuevos que el usuario haya escrito manualmente
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

    const nuevoEvento = {
      id: 'ev-' + Date.now(),
      modalidad: modalidadSeleccionada,
      modalidadNombre: modalidadActualConfig.nombre,
      modalidadIcono: modalidadActualConfig.icono,
      nombreEvento: nombreEvento || `${modalidadActualConfig.nombre} (${recomendacionSemana.eventos.length + 1})`,
      alcance: alcanceEvento,
      sistema: modalidadActualConfig.subtitulo,
      conductividadObjetivo: modalidadSeleccionada !== 'granular' && conductividad ? `${conductividad} mS/cm` : null,
      phObjetivo: modalidadSeleccionada !== 'granular' && ph ? ph : null,
      lineasTanqueA: modalidadSeleccionada === 'dosatron' ? lineasTanqueA.filter(l => l.producto.trim()) : null,
      lineasTanqueB: modalidadSeleccionada === 'dosatron' ? lineasTanqueB.filter(l => l.producto.trim()) : null,
      productos: modalidadSeleccionada !== 'dosatron' ? lineasProductos.filter(l => l.producto.trim()) : null,
      observacionesPie: observaciones || ''
    };

    const eventosActualizados = [...(recomendacionSemana.eventos || []), nuevoEvento];
    const recActualizada = { ...recomendacionSemana, eventos: eventosActualizados };

    const todasRecs = recomendaciones.filter(r => r.semana !== semanaActiva);
    todasRecs.push(recActualizada);
    todasRecs.sort((a, b) => a.semana - b.semana);

    onUpdateVisita({ ...visita, recomendacionesFertirriego: todasRecs });
    setMostrarModalEvento(false);
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
            El agrónomo formula cada cuadro según la modalidad requerida y determina el alcance (por finca completa o por lote específico).
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

      {/* Barra de Modalidades Disponibles para Agregar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Generar Cuadro Nutricional (Semana {semanaActiva}):</span>
          </h3>
          <span className="text-[11px] text-slate-400">Seleccione la modalidad</span>
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

      {/* Lista de Cuadros/Eventos Programados para la Semana Activa */}
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
                    onClick={() => handleEliminarEvento(ev.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Eliminar este cuadro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Si es Dosatron (Tanque A y Tanque B) */}
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
              Seleccione una modalidad arriba para generar una recomendación nutricional a su criterio técnico profesional.
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
                    Nuevo Cuadro: {modalidadActualConfig.nombre}
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
                    <option value="Toda la Finca">Toda la Finca ({visita.finca?.nombre || 'Finca'})</option>
                    {lotesDeFinca.map(l => (
                      <option key={l.id} value={`Lote: ${l.nombre}`}>
                        Lote específico: {l.nombre} ({l.cultivoNombre || ''})
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

              {/* DOSATRON: TANQUE A Y TANQUE B */}
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
                        onClick={() => setLineasTanqueA([...lineasTanqueA, { producto: '', dosis: '', unidad: 'kg / tanque 1000 L', aporte: '' }])}
                        className="px-2 py-1 bg-blue-600 text-white rounded-lg text-[11px] font-bold hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Agregar Insumo
                      </button>
                    </div>

                    <div className="space-y-2">
                      {lineasTanqueA.map((l, idx) => (
                        <div key={idx} className="bg-white p-2.5 rounded-xl border border-blue-100 flex flex-wrap sm:flex-nowrap items-center gap-2">
                          <input
                            type="text"
                            list="fertilizantes-list"
                            value={l.producto}
                            onChange={(e) => {
                              const nuevo = [...lineasTanqueA];
                              nuevo[idx].producto = e.target.value;
                              setLineasTanqueA(nuevo);
                            }}
                            placeholder="Producto (ej: YaraTera Calcinit, Librel Fe)"
                            className="flex-1 min-w-[140px] text-xs font-semibold border border-slate-200 rounded-lg p-1.5 outline-none"
                          />
                          <input
                            type="text"
                            value={l.dosis}
                            onChange={(e) => {
                              const nuevo = [...lineasTanqueA];
                              nuevo[idx].dosis = e.target.value;
                              setLineasTanqueA(nuevo);
                            }}
                            placeholder="Dosis"
                            className="w-20 text-xs font-bold text-center border border-slate-200 rounded-lg p-1.5 outline-none"
                          />
                          <select
                            value={l.unidad}
                            onChange={(e) => {
                              const nuevo = [...lineasTanqueA];
                              nuevo[idx].unidad = e.target.value;
                              setLineasTanqueA(nuevo);
                            }}
                            className="text-xs border border-slate-200 rounded-lg p-1.5 bg-slate-50 outline-none"
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
                        onClick={() => setLineasTanqueB([...lineasTanqueB, { producto: '', dosis: '', unidad: 'kg / tanque 1000 L', aporte: '' }])}
                        className="px-2 py-1 bg-amber-600 text-white rounded-lg text-[11px] font-bold hover:bg-amber-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Agregar Insumo
                      </button>
                    </div>

                    <div className="space-y-2">
                      {lineasTanqueB.map((l, idx) => (
                        <div key={idx} className="bg-white p-2.5 rounded-xl border border-amber-100 flex flex-wrap sm:flex-nowrap items-center gap-2">
                          <input
                            type="text"
                            list="fertilizantes-list"
                            value={l.producto}
                            onChange={(e) => {
                              const nuevo = [...lineasTanqueB];
                              nuevo[idx].producto = e.target.value;
                              setLineasTanqueB(nuevo);
                            }}
                            placeholder="Producto (ej: Haifa MKP, Sulfato Magnesio)"
                            className="flex-1 min-w-[140px] text-xs font-semibold border border-slate-200 rounded-lg p-1.5 outline-none"
                          />
                          <input
                            type="text"
                            value={l.dosis}
                            onChange={(e) => {
                              const nuevo = [...lineasTanqueB];
                              nuevo[idx].dosis = e.target.value;
                              setLineasTanqueB(nuevo);
                            }}
                            placeholder="Dosis"
                            className="w-20 text-xs font-bold text-center border border-slate-200 rounded-lg p-1.5 outline-none"
                          />
                          <select
                            value={l.unidad}
                            onChange={(e) => {
                              const nuevo = [...lineasTanqueB];
                              nuevo[idx].unidad = e.target.value;
                              setLineasTanqueB(nuevo);
                            }}
                            className="text-xs border border-slate-200 rounded-lg p-1.5 bg-slate-50 outline-none"
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
                /* LISTA ÚNICA PARA LAS DEMÁS MODALIDADES */
                <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-800">
                      Insumos Recomendados ({modalidadActualConfig.nombre})
                    </span>
                    <button
                      type="button"
                      onClick={() => setLineasProductos([...lineasProductos, { producto: '', dosis: '', unidad: modalidadActualConfig.unidades[0], aporte: '' }])}
                      className="px-2 py-1 bg-emerald-700 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-800 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Agregar Insumo
                    </button>
                  </div>

                  <div className="space-y-2">
                    {lineasProductos.map((l, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-wrap sm:flex-nowrap items-center gap-2">
                        <input
                          type="text"
                          list="fertilizantes-list"
                          value={l.producto}
                          onChange={(e) => {
                            const nuevo = [...lineasProductos];
                            nuevo[idx].producto = e.target.value;
                            setLineasProductos(nuevo);
                          }}
                          placeholder={modalidadSeleccionada === 'granular' ? "Fórmula edáfica (ej: 10-30-10, Hidrocomplex)" : "Fertilizante o enraizador"}
                          className="flex-1 min-w-[160px] text-xs font-semibold border border-slate-200 rounded-lg p-1.5 outline-none"
                        />
                        <input
                          type="text"
                          value={l.dosis}
                          onChange={(e) => {
                            const nuevo = [...lineasProductos];
                            nuevo[idx].dosis = e.target.value;
                            setLineasProductos(nuevo);
                          }}
                          placeholder="Dosis"
                          className="w-24 text-xs font-bold text-center border border-slate-200 rounded-lg p-1.5 outline-none"
                        />
                        <select
                          value={l.unidad}
                          onChange={(e) => {
                            const nuevo = [...lineasProductos];
                            nuevo[idx].unidad = e.target.value;
                            setLineasProductos(nuevo);
                          }}
                          className="text-xs border border-slate-200 rounded-lg p-1.5 bg-slate-50 outline-none"
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

              {/* Datalist con productos para autocompletar */}
              <datalist id="fertilizantes-list">
                {fertilizantesDisponibles.map((f, i) => (
                  <option key={i} value={f.nombreComercial}>
                    {f.categoria} — {f.composicion || f.distribuidores || ''}
                  </option>
                ))}
              </datalist>

              {/* Instrucciones para el productor */}
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
                  <span>Guardar Cuadro de {modalidadActualConfig.nombre}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
