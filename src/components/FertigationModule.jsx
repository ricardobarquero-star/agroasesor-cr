import React, { useState } from 'react';
import { 
  Droplet, Plus, Trash2, AlertTriangle, Sparkles, Check, 
  Layers, FlaskConical, HelpCircle, ChevronDown, Calendar,
  Sliders, Gauge, Sprout, ArrowRight, BookOpen, Search, X
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
  const [conductividad, setConductividad] = useState('1.5');
  const [ph, setPh] = useState('5.8');
  const [observaciones, setObservaciones] = useState('');

  // Filas para modalidades de lista única (Tanque directo, Venturi, Inyección, Drench, Granular)
  const [lineasProductos, setLineasProductos] = useState([
    { producto: 'YaraMila Hidrocomplex', dosis: '150', unidad: 'kg / ha', aporte: 'N-P-K balanceado + micro' }
  ]);

  // Filas para Dosatron (Tanque A y Tanque B)
  const [lineasTanqueA, setLineasTanqueA] = useState([
    { producto: 'YaraTera Calcinit (Nitrato de Calcio)', dosis: '60', unidad: 'kg / tanque 1000 L', aporte: 'Calcio y Nitrógeno Nítrico' },
    { producto: 'Haifa Multi-K 13-0-46', dosis: '35', unidad: 'kg / tanque 1000 L', aporte: 'Potasio y Nitratos' },
    { producto: 'Librel Fe-DP (Hierro Quelatado DTPA)', dosis: '2.5', unidad: 'kg / tanque 1000 L', aporte: 'Hierro quelatado estable' }
  ]);

  const [lineasTanqueB, setLineasTanqueB] = useState([
    { producto: 'Haifa MKP 0-52-34', dosis: '30', unidad: 'kg / tanque 1000 L', aporte: 'Fósforo y Potasio' },
    { producto: 'Sulfato de Magnesio Soluble', dosis: '25', unidad: 'kg / tanque 1000 L', aporte: 'Magnesio y Azufre' },
    { producto: 'Ácido Fosfórico 85%', dosis: '8', unidad: 'L / tanque 1000 L', aporte: 'Acidificación y P' }
  ]);

  // Buscador y auto-incorporación
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [customGuardadoMsg, setCustomGuardadoMsg] = useState('');

  const recomendaciones = visita.recomendacionesFertirriego || [];
  const recomendacionSemana = recomendaciones.find(r => r.semana === semanaActiva) || {
    semana: semanaActiva,
    titulo: `Semana ${semanaActiva} - Programa de Fertirriego y Nutrición`,
    alcance: 'Toda la Finca',
    eventos: []
  };

  const modalidadActualConfig = MODALIDADES.find(m => m.id === modalidadSeleccionada) || MODALIDADES[0];
  const fertilizantesDisponibles = storageService.getTodosLosFertilizantes(modalidadSeleccionada);

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

  // Abrir modal configurando valores iniciales según la modalidad
  const handleAbrirModalConModalidad = (modId) => {
    setModalidadSeleccionada(modId);
    setNombreEvento('');
    setObservaciones('');
    
    if (modId === 'granular') {
      setLineasProductos([
        { producto: 'YaraMila Hidrocomplex', dosis: '150', unidad: 'kg / ha', aporte: 'Fórmula completa con micronutrientes' }
      ]);
    } else if (modId === 'drench') {
      setLineasProductos([
        { producto: 'Rootex WP (Cosmocel)', dosis: '350', unidad: 'g / estañón (200 L)', aporte: 'Enraizamiento y bioestimulación' },
        { producto: 'Kelpak Alga Marina', dosis: '400', unidad: 'cc / estañón (200 L)', aporte: 'Auxinas naturales y citoquininas' },
        { producto: 'TrikoEco (Trichoderma)', dosis: '250', unidad: 'g / estañón (200 L)', aporte: 'Protección fúngica radicular' }
      ]);
    } else if (modId === 'tanque_directo' || modId === 'venturi' || modId === 'inyeccion') {
      setLineasProductos([
        { producto: 'Haifa Multi-K 13-0-46', dosis: '25', unidad: modId === 'venturi' ? 'kg / estañón (200 L)' : 'kg / tanque 1000 L', aporte: 'Potasio soluble' },
        { producto: 'Cosmoquel Zinc', dosis: '500', unidad: modId === 'venturi' ? 'g / estañón (200 L)' : 'g / tanque 1000 L', aporte: 'Zinc quelatado' }
      ]);
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
      sistema: modalidadActualConfig.subtitulo,
      conductividadObjetivo: modalidadSeleccionada !== 'granular' ? `${conductividad} mS/cm` : null,
      phObjetivo: modalidadSeleccionada !== 'granular' ? ph : null,
      lineasTanqueA: modalidadSeleccionada === 'dosatron' ? lineasTanqueA : null,
      lineasTanqueB: modalidadSeleccionada === 'dosatron' ? lineasTanqueB : null,
      productos: modalidadSeleccionada !== 'dosatron' ? lineasProductos : null,
      observacionesPie: observaciones || (modalidadSeleccionada === 'granular' 
        ? 'Incorporar con humedad adecuada o aplicar antes de lluvia/riego.' 
        : 'Verificar conductividad eléctrica y pH en el gotero emisor más distante.')
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
            Estructuración semanal por cuadros según modalidad: Tanque directo, Venturi, Dosatron (A y B), Inyección, Drench o Fertilización granular al suelo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenAi('fertirriego')}
            className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition flex items-center gap-1.5 active:scale-95"
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
            <span>Agregar Cuadro a la Semana {semanaActiva} (Seleccione Modalidad):</span>
          </h3>
          <span className="text-[11px] text-slate-400">Presione una modalidad</span>
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
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">{ev.nombreEvento}</h4>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        {ev.modalidadNombre || ev.modalidad}
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
                  {/* Tanque A */}
                  <div className="border border-blue-200 rounded-xl p-3 bg-blue-50/40">
                    <div className="flex items-center justify-between font-bold text-xs text-blue-900 mb-2 border-b border-blue-200/60 pb-1">
                      <span>🔵 TANQUE A (Calcio y Nitratos)</span>
                      <span className="text-[10px] text-blue-700">1000 L</span>
                    </div>
                    <div className="space-y-1.5">
                      {ev.lineasTanqueA.map((l, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs bg-white p-2 rounded-lg border border-blue-100">
                          <div>
                            <p className="font-bold text-slate-800">{l.producto}</p>
                            {l.aporte && <p className="text-[10px] text-slate-400">{l.aporte}</p>}
                          </div>
                          <span className="font-extrabold text-blue-900 shrink-0 ml-2">
                            {l.dosis} {l.unidad}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tanque B */}
                  <div className="border border-amber-200 rounded-xl p-3 bg-amber-50/40">
                    <div className="flex items-center justify-between font-bold text-xs text-amber-900 mb-2 border-b border-amber-200/60 pb-1">
                      <span>🟡 TANQUE B (Fósforo, Sulfatos y Micro)</span>
                      <span className="text-[10px] text-amber-700">1000 L</span>
                    </div>
                    <div className="space-y-1.5">
                      {ev.lineasTanqueB.map((l, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs bg-white p-2 rounded-lg border border-amber-100">
                          <div>
                            <p className="font-bold text-slate-800">{l.producto}</p>
                            {l.aporte && <p className="text-[10px] text-slate-400">{l.aporte}</p>}
                          </div>
                          <span className="font-extrabold text-amber-900 shrink-0 ml-2">
                            {l.dosis} {l.unidad}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Para modalidades de lista única (Tanque directo, Venturi, Inyección, Drench, Granular) */
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60">
                  <div className="space-y-1.5">
                    {(ev.productos || []).map((l, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                        <div>
                          <p className="font-bold text-slate-900">{l.producto}</p>
                          {l.aporte && <p className="text-[10px] text-slate-500">{l.aporte}</p>}
                        </div>
                        <span className="font-extrabold text-emerald-800 shrink-0 ml-2 text-sm">
                          {l.dosis} {l.unidad}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Observaciones al pie del evento */}
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
              Seleccione una modalidad arriba (Tanque directo, Venturi, Dosatron, Inyección, Drench o Fertilización granular) para crear el programa nutricional de esta semana.
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

            {/* Selector rápido de modalidad dentro del modal */}
            <div className="bg-blue-900/10 px-4 py-2 border-b border-blue-100 flex items-center gap-1.5 overflow-x-auto shrink-0">
              <span className="text-[11px] font-bold text-slate-600 shrink-0 mr-1">Modalidad:</span>
              {MODALIDADES.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleAbrirModalConModalidad(m.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition flex items-center gap-1 ${
                    modalidadSeleccionada === m.id
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{m.icono}</span>
                  <span>{m.nombre.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* Contenido scrolleable del formulario */}
            <form onSubmit={handleGuardarEvento} className="p-4 space-y-4 overflow-y-auto flex-1">
              
              {/* Título opcional del evento */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre o Etiqueta del Cuadro</label>
                  <input
                    type="text"
                    value={nombreEvento}
                    onChange={(e) => setNombreEvento(e.target.value)}
                    placeholder={`Ej: ${modalidadActualConfig.nombre} - Desarrollo Vegetativo`}
                    className="w-full text-xs font-medium border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {modalidadSeleccionada !== 'granular' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">CE Obj. (mS/cm)</label>
                      <input
                        type="text"
                        value={conductividad}
                        onChange={(e) => setConductividad(e.target.value)}
                        placeholder="1.5"
                        className="w-full text-xs font-bold text-center border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">pH Obj.</label>
                      <input
                        type="text"
                        value={ph}
                        onChange={(e) => setPh(e.target.value)}
                        placeholder="5.8"
                        className="w-full text-xs font-bold text-center border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ALERTA DE QUÍMICA CALCIO VS SULFATOS */}
              {alertaCalcioA && (
                <div className="bg-red-50 border-2 border-red-400 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-red-900 animate-pulse">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Incompatibilidad Química Detectada:</strong>
                    <span>{alertaCalcioA}</span>
                  </div>
                </div>
              )}

              {/* SI ES DOSATRON: DOS TABLAS (TANQUE A Y TANQUE B) */}
              {modalidadSeleccionada === 'dosatron' ? (
                <div className="space-y-4">
                  {/* TANQUE A */}
                  <div className="border border-blue-200 rounded-2xl p-3.5 bg-blue-50/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-blue-900 flex items-center gap-1.5">
                        <span>🔵 TANQUE A: Calcio, Hierro y Nitratos</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setLineasTanqueA([...lineasTanqueA, { producto: '', dosis: '', unidad: 'kg / tanque 1000 L', aporte: '' }])}
                        className="px-2 py-1 bg-blue-600 text-white rounded-lg text-[11px] font-bold hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Agregar a Tanque A
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
                            placeholder="Producto (ej: Calcinit, Multi-K, Librel Fe)"
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
                            placeholder="Dosis (ej: 60)"
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
                      <span className="font-extrabold text-xs text-amber-900 flex items-center gap-1.5">
                        <span>🟡 TANQUE B: Fósforo, Sulfatos, Magnesio, Micro y Ácido</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setLineasTanqueB([...lineasTanqueB, { producto: '', dosis: '', unidad: 'kg / tanque 1000 L', aporte: '' }])}
                        className="px-2 py-1 bg-amber-600 text-white rounded-lg text-[11px] font-bold hover:bg-amber-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Agregar a Tanque B
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
                            placeholder="Producto (ej: MKP, Sulfato Mg, Ácido Fosfórico)"
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
                            placeholder="Dosis (ej: 30)"
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
                /* LISTA ÚNICA DE PRODUCTOS PARA LAS DEMÁS MODALIDADES */
                <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                      <span>Insumos y Fertilizantes Recomendados ({modalidadActualConfig.nombre})</span>
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
                          placeholder={modalidadSeleccionada === 'granular' ? "Fórmula (ej: 10-30-10, Hidrocomplex, Nitrofoska)" : "Producto fertilizante o enraizador"}
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

              {/* Observaciones o instrucciones para el productor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instrucciones Específicas para el Productor / Regador
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej: Mezclar primero en balde antes de verter al tanque. No aplicar bajo sol directo. Medir CE y pH en la punta del lote."
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
