import React, { useState } from 'react';
import { 
  Droplet, Plus, Trash2, AlertTriangle, Sparkles, Check, 
  Layers, FlaskConical, HelpCircle, ChevronDown, Calendar
} from 'lucide-react';
import { crAgroDatabase } from '../data/crAgroDatabase';

export default function FertigationModule({ visita, onUpdateVisita, onOpenAi }) {
  const [semanaActiva, setSemanaActiva] = useState(1);
  const [mostrarModalEvento, setMostrarModalEvento] = useState(false);
  const [tipoEvento, setTipoEvento] = useState('ab'); // 'ab' o 'drench'
  const [alcance, setAlcance] = useState('Toda la Finca');
  const [nombreEvento, setNombreEvento] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Listas de productos del nuevo evento
  const [lineasTanqueA, setLineasTanqueA] = useState([
    { producto: 'YaraTera Calcinit (Nitrato de Calcio)', dosis: '60 kg / tanque 1000 L', unidad: 'kg/tanque 1000L' },
    { producto: 'Haifa Multi-K 13-0-46', dosis: '35 kg / tanque 1000 L', unidad: 'kg/tanque 1000L' },
    { producto: 'Librel Fe-DP (Hierro Quelatado DTPA)', dosis: '2.5 kg / tanque 1000 L', unidad: 'kg/tanque 1000L' }
  ]);

  const [lineasTanqueB, setLineasTanqueB] = useState([
    { producto: 'Haifa MKP 0-52-34', dosis: '30 kg / tanque 1000 L', unidad: 'kg/tanque 1000L' },
    { producto: 'Sulfato de Magnesio Soluble', dosis: '25 kg / tanque 1000 L', unidad: 'kg/tanque 1000L' },
    { producto: 'Ácido Fosfórico 85%', dosis: '8 L / tanque 1000 L', unidad: 'L/tanque 1000L' }
  ]);

  const [lineasDrench, setLineasDrench] = useState([
    { producto: 'Rootex WP (Cosmocel)', dosis: '350 g / estañón (200 L)', unidad: 'g/estañón (200L)' },
    { producto: 'Kelpak Alga Marina', dosis: '400 cc / estañón (200 L)', unidad: 'cc/estañón (200L)' },
    { producto: 'TrikoEco (Trichoderma)', dosis: '250 g / estañón (200 L)', unidad: 'g/estañón (200L)' }
  ]);

  const recomendaciones = visita.recomendacionesFertirriego || [];
  const recomendacionSemana = recomendaciones.find(r => r.semana === semanaActiva) || {
    semana: semanaActiva,
    titulo: `Semana ${semanaActiva} - Programa de Fertirriego`,
    alcance: 'Toda la Finca',
    eventos: []
  };

  const unidadesDisponibles = [
    'kg / tanque 1000 L',
    'g / tanque 1000 L',
    'kg / estañón (200 L)',
    'g / estañón (200 L)',
    'cc / estañón (200 L)',
    'g / L (solución final)',
    'cc / L'
  ];

  // Verificar incompatibilidad de Calcio con Sulfatos/Fosfatos en Tanque A
  const verificarIncompatibilidad = (lineasA) => {
    const nombres = lineasA.map(l => (l.producto || '').toLowerCase()).join(' ');
    const tieneCalcio = nombres.includes('calcinit') || nombres.includes('calcio');
    const tieneFosfato = nombres.includes('mkp') || nombres.includes('fosfato') || nombres.includes('ácido fosfórico');
    const tieneSulfato = nombres.includes('sulfato');

    if (tieneCalcio && (tieneFosfato || tieneSulfato)) {
      return '⚠️ ALERTA QUÍMICA CRÍTICA: Se detectó Calcio mezclado con Sulfatos o Fosfatos en Tanque A. Esto provocará precipitación de Yeso (Sulfato de Calcio) y taponamiento irreversible de goteros. Mueva los fosfatos y sulfatos al Tanque B.';
    }
    return null;
  };

  const alertaA = verificarIncompatibilidad(lineasTanqueA);

  const handleAgregarEvento = (e) => {
    e.preventDefault();
    const nuevoEvento = {
      id: 'ev-' + Date.now(),
      tipo: tipoEvento === 'ab' ? 'Fertirriego Tanque A y B (Inyección Dosatron/Venturi)' : 'Drench por Estañón (200 L)',
      nombreEvento: nombreEvento || (tipoEvento === 'ab' ? `Fertirriego ${recomendacionSemana.eventos.length + 1}` : `Drench ${recomendacionSemana.eventos.length + 1}`),
      sistema: tipoEvento === 'ab' ? 'Tanques Concentrados A y B (1000 L)' : 'Estañón de 200 L (bomba o lanza)',
      conductividadObjetivo: '1.5 mS/cm',
      phObjetivo: '5.8',
      lineasTanqueA: tipoEvento === 'ab' ? lineasTanqueA : null,
      lineasTanqueB: tipoEvento === 'ab' ? lineasTanqueB : null,
      productos: tipoEvento === 'drench' ? lineasDrench : null,
      observacionesPie: observaciones || 'Monitorear CE y pH en el gotero emisor más alejado de la nave.'
    };

    const eventosActualizados = [...(recomendacionSemana.eventos || []), nuevoEvento];
    const recActualizada = { ...recomendacionSemana, eventos: eventosActualizados };

    const todasRecs = recomendaciones.filter(r => r.semana !== semanaActiva);
    todasRecs.push(recActualizada);
    todasRecs.sort((a, b) => a.semana - b.semana);

    onUpdateVisita({ ...visita, recomendacionesFertirriego: todasRecs });
    setMostrarModalEvento(false);
    setNombreEvento('');
    setObservaciones('');
  };

  const handleEliminarEvento = (id) => {
    if (!confirm('¿Desea eliminar este cuadro de recomendación?')) return;
    const eventosActualizados = recomendacionSemana.eventos.filter(e => e.id !== id);
    const recActualizada = { ...recomendacionSemana, eventos: eventosActualizados };
    const todasRecs = recomendaciones.filter(r => r.semana !== semanaActiva);
    todasRecs.push(recActualizada);
    todasRecs.sort((a, b) => a.semana - b.semana);
    onUpdateVisita({ ...visita, recomendacionesFertirriego: todasRecs });
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
            <h2 className="font-bold text-base sm:text-lg text-slate-900">Recomendaciones de Fertirriego y Drench</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Estructura semanal por cuadros: Tanque A, Tanque B (inyección Venturi/Dosatron) o Drench por estañón (200 L).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenAi('fertirriego')}
            className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 font-semibold text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Auditoría Nutricional IA</span>
          </button>
          <button
            onClick={() => setMostrarModalEvento(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Cuadro Fertirriego</span>
          </button>
        </div>
      </div>

      {/* Selector de Semanas y Alcance */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Semanas:
          </span>
          {[1, 2, 3, 4].map(num => (
            <button
              key={num}
              onClick={() => setSemanaActiva(num)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${semanaActiva === num ? 'bg-blue-700 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Semana {num}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Alcance:</label>
          <select
            value={recomendacionSemana.alcance || 'Toda la Finca'}
            onChange={(e) => {
              const recActualizada = { ...recomendacionSemana, alcance: e.target.value };
              const todasRecs = recomendaciones.filter(r => r.semana !== semanaActiva);
              todasRecs.push(recActualizada);
              todasRecs.sort((a, b) => a.semana - b.semana);
              onUpdateVisita({ ...visita, recomendacionesFertirriego: todasRecs });
            }}
            className="bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800"
          >
            <option value="Toda la Finca">Toda la Finca</option>
            <option value="Lote 1">Lote 1</option>
            <option value="Lote 2 - Macrotúnel B">Lote 2 - Macrotúnel B</option>
            <option value="Lote 3">Lote 3</option>
          </select>
        </div>
      </div>

      {/* Cuadros de la Semana Activa */}
      <div className="space-y-4">
        {(recomendacionSemana.eventos || []).map((evento, idx) => (
          <div key={evento.id || idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Cabecera del cuadro */}
            <div className="bg-slate-800 p-3 sm:px-4 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-900/50 px-2 py-0.5 rounded">
                  {evento.tipo}
                </span>
                <h3 className="font-bold text-sm sm:text-base mt-0.5 text-white">
                  {evento.nombreEvento}
                </h3>
              </div>
              <button
                onClick={() => handleEliminarEvento(evento.id)}
                className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-700 transition"
                title="Eliminar este cuadro"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-cabecera con metas de CE y pH */}
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
              <span className="font-medium">Sistema: <strong className="text-slate-900">{evento.sistema}</strong></span>
              <div className="flex items-center gap-4">
                <span>Conductividad Objetivo (CE): <strong className="text-blue-700">{evento.conductividadObjetivo || '1.5 mS/cm'}</strong></span>
                <span>pH sugerido: <strong className="text-emerald-700">{evento.phObjetivo || '5.8'}</strong></span>
              </div>
            </div>

            {/* Tablas de Productos */}
            <div className="p-3 sm:p-4 space-y-3">
              {evento.lineasTanqueA && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-blue-900">
                      TANQUE A (Calcio, Nitratos y Quelatos Fe DTPA/EDDHA)
                    </h4>
                  </div>
                  <div className="border border-blue-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-blue-50 text-blue-900 font-bold border-b border-blue-200">
                        <tr>
                          <th className="p-2.5">Producto Fertilizante</th>
                          <th className="p-2.5 text-right">Dosis Recomendada</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-100">
                        {evento.lineasTanqueA.map((linea, lIdx) => (
                          <tr key={lIdx} className="hover:bg-blue-50/50">
                            <td className="p-2.5 font-medium text-slate-800">{linea.producto}</td>
                            <td className="p-2.5 text-right font-bold text-blue-800">{linea.dosis}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {evento.lineasTanqueB && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900">
                      TANQUE B (Fosfatos, Sulfatos de Mg/K y Ácido Fosfórico)
                    </h4>
                  </div>
                  <div className="border border-amber-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-amber-50 text-amber-900 font-bold border-b border-amber-200">
                        <tr>
                          <th className="p-2.5">Producto Fertilizante</th>
                          <th className="p-2.5 text-right">Dosis Recomendada</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100">
                        {evento.lineasTanqueB.map((linea, lIdx) => (
                          <tr key={lIdx} className="hover:bg-amber-50/50">
                            <td className="p-2.5 font-medium text-slate-800">{linea.producto}</td>
                            <td className="p-2.5 text-right font-bold text-amber-800">{linea.dosis}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {evento.productos && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-900">
                      MEZCLA DRENCH POR ESTAÑÓN (200 Litros)
                    </h4>
                  </div>
                  <div className="border border-emerald-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-emerald-50 text-emerald-900 font-bold border-b border-emerald-200">
                        <tr>
                          <th className="p-2.5">Insumo / Bioestimulante</th>
                          <th className="p-2.5 text-right">Dosis por Estañón (200 L)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-100">
                        {evento.productos.map((linea, lIdx) => (
                          <tr key={lIdx} className="hover:bg-emerald-50/50">
                            <td className="p-2.5 font-medium text-slate-800">{linea.producto}</td>
                            <td className="p-2.5 text-right font-bold text-emerald-800">{linea.dosis}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Observaciones al pie del cuadro */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                <span className="font-bold text-slate-900">Notas / Instrucciones operativas para el regador:</span>
                <p className="mt-0.5 leading-relaxed text-slate-600">{evento.observacionesPie}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(!recomendacionSemana.eventos || recomendacionSemana.eventos.length === 0) && (
        <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
          <Droplet className="w-10 h-10 text-blue-400 mx-auto mb-2" />
          <p className="font-bold text-slate-700 text-sm">No hay cuadros de fertirriego para la Semana {semanaActiva}</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-3">
            Genere un cuadro de inyección Tanque A/B o una receta de drench por estañón de 200 L para esta semana.
          </p>
          <button
            onClick={() => setMostrarModalEvento(true)}
            className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4" /> Crear Cuadro para Semana {semanaActiva}
          </button>
        </div>
      )}

      {/* Modal para configurar nuevo cuadro de Fertirriego */}
      {mostrarModalEvento && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-blue-900 p-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Configurar Cuadro de Nutrición (Semana {semanaActiva})</h3>
              <button onClick={() => setMostrarModalEvento(false)} className="text-slate-300 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleAgregarEvento} className="p-4 overflow-y-auto space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Modalidad de Aplicación</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoEvento('ab')}
                    className={`py-2 px-3 rounded-xl border font-bold text-center transition ${tipoEvento === 'ab' ? 'bg-blue-50 border-blue-600 text-blue-900' : 'border-slate-300 text-slate-600'}`}
                  >
                    Tanque A y B (Fertirriego)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoEvento('drench')}
                    className={`py-2 px-3 rounded-xl border font-bold text-center transition ${tipoEvento === 'drench' ? 'bg-emerald-50 border-emerald-600 text-emerald-900' : 'border-slate-300 text-slate-600'}`}
                  >
                    Drench por Estañón (200 L)
                  </button>
                </div>
              </div>

              {alertaA && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-red-800 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="font-semibold">{alertaA}</p>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre o Título del Cuadro</label>
                <input
                  type="text"
                  value={nombreEvento}
                  onChange={(e) => setNombreEvento(e.target.value)}
                  placeholder="Ej. Fertirriego 1: Llenado de Fruta y Calcio Estructural"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones o Notas al Pie</label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Instrucciones para el operario de riego (pulsos, tiempo, inyección Dosatron, etc.)."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalEvento(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold shadow"
                >
                  Insertar Cuadro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
