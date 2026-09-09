import React, { useState } from 'react';
import { 
  ShieldCheck, Plus, Trash2, AlertTriangle, Sparkles, Check, 
  Layers, FlaskConical, Calendar, AlertOctagon, HelpCircle
} from 'lucide-react';
import { crAgroDatabase } from '../data/crAgroDatabase';

export default function PesticideModule({ visita, onUpdateVisita, onOpenAi }) {
  const [semanaActiva, setSemanaActiva] = useState(1);
  const [mostrarModalApp, setMostrarModalApp] = useState(false);
  const [nombreApp, setNombreApp] = useState('');
  const [volumenTanque, setVolumenTanque] = useState('Estañón de 200 L');
  const [observaciones, setObservaciones] = useState('');

  // Líneas de mezcla predeterminadas
  const [lineasMezcla, setLineasMezcla] = useState([
    { orden: 1, tipo: 'Acondicionador', producto: 'Carrier / Acid-Fix', dosis: '60 cc / estañón', fracIrac: 'Acondicionador', funcion: 'Bajar pH a 5.8 y ablandar dureza' },
    { orden: 2, tipo: 'Fungicida', producto: 'Bellis 38 WG', dosis: '140 g / estañón (200 L)', fracIrac: 'FRAC 7 + 11', funcion: 'Control curativo Botrytis (Boscalid + Piraclostrobina)' },
    { orden: 3, tipo: 'Acaricida', producto: 'Oberon 240 SC', dosis: '100 cc / estañón (200 L)', fracIrac: 'IRAC 23', funcion: 'Ovicida y ninficida de arañita roja' },
    { orden: 4, tipo: 'Foliar', producto: 'Metalosato Calcio (Cosmocel)', dosis: '400 cc / estañón (200 L)', fracIrac: 'Nutricional', funcion: 'Firmeza de epidermis' },
    { orden: 5, tipo: 'Coadyuvante', producto: 'Break-Thru S-240', dosis: '35 cc / estañón (200 L)', fracIrac: 'Coadyuvante', funcion: 'Super-humectación y penetración' }
  ]);

  const recomendaciones = visita.recomendacionesPlaguicidas || [];
  const recomendacionSemana = recomendaciones.find(r => r.semana === semanaActiva) || {
    semana: semanaActiva,
    titulo: `Semana ${semanaActiva} - Manejo Fitosanitario y Foliares`,
    alcance: 'Toda la Finca',
    aplicaciones: []
  };

  // Verificar rotación de resistencia FRAC / IRAC
  const auditarResistencia = (apps) => {
    const codigosUsados = [];
    const advertencias = [];

    apps.forEach(app => {
      (app.ordenMezcla || []).forEach(item => {
        if (item.fracIrac && item.fracIrac.includes('FRAC')) {
          codigosUsados.push({ tipo: 'FRAC', codigo: item.fracIrac, prod: item.producto });
        }
        if (item.fracIrac && item.fracIrac.includes('IRAC')) {
          codigosUsados.push({ tipo: 'IRAC', codigo: item.fracIrac, prod: item.producto });
        }
      });
    });

    return advertencias;
  };

  const handleAgregarAplicacion = (e) => {
    e.preventDefault();
    const nuevaApp = {
      id: 'ap-' + Date.now(),
      nombre: nombreApp || `Aplicación Foliar ${recomendacionSemana.aplicaciones.length + 1}`,
      volumenTanque,
      ordenMezcla: lineasMezcla,
      observacionesPie: observaciones || 'Aplicar temprano en la mañana con boquilla de cono hueco y presión constante de 45 PSI.'
    };

    const appsActualizadas = [...(recomendacionSemana.aplicaciones || []), nuevaApp];
    const recActualizada = { ...recomendacionSemana, aplicaciones: appsActualizadas };

    const todasRecs = recomendaciones.filter(r => r.semana !== semanaActiva);
    todasRecs.push(recActualizada);
    todasRecs.sort((a, b) => a.semana - b.semana);

    onUpdateVisita({ ...visita, recomendacionesPlaguicidas: todasRecs });
    setMostrarModalApp(false);
    setNombreApp('');
    setObservaciones('');
  };

  const handleEliminarAplicacion = (id) => {
    if (!confirm('¿Desea eliminar esta aplicación?')) return;
    const appsActualizadas = recomendacionSemana.aplicaciones.filter(a => a.id !== id);
    const recActualizada = { ...recomendacionSemana, aplicaciones: appsActualizadas };
    const todasRecs = recomendaciones.filter(r => r.semana !== semanaActiva);
    todasRecs.push(recActualizada);
    todasRecs.sort((a, b) => a.semana - b.semana);
    onUpdateVisita({ ...visita, recomendacionesPlaguicidas: todasRecs });
  };

  return (
    <div className="space-y-4">
      {/* Cabecera del módulo */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
              🛡️
            </span>
            <h2 className="font-bold text-base sm:text-lg text-slate-900">Aplicaciones de Plaguicidas y Foliares (FRAC/IRAC)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Estructuración semanal con orden de mezcla en estañón, códigos FRAC/IRAC y protección contra resistencia.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenAi('plaguicidas')}
            className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 font-semibold text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Auditoría FRAC/IRAC IA</span>
          </button>
          <button
            onClick={() => setMostrarModalApp(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Aplicación Foliar</span>
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
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${semanaActiva === num ? 'bg-purple-700 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
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
              onUpdateVisita({ ...visita, recomendacionesPlaguicidas: todasRecs });
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

      {/* Lista de Aplicaciones Semanales */}
      <div className="space-y-4">
        {(recomendacionSemana.aplicaciones || []).map((app, idx) => (
          <div key={app.id || idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Cabecera de la aplicación */}
            <div className="bg-slate-800 p-3 sm:px-4 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded">
                  Caldo de Aplicación: {app.volumenTanque}
                </span>
                <h3 className="font-bold text-sm sm:text-base mt-0.5 text-white">
                  {app.nombre}
                </h3>
              </div>
              <button
                onClick={() => handleEliminarAplicacion(app.id)}
                className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-700 transition"
                title="Eliminar esta aplicación"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Tabla con Orden de Mezcla y Códigos FRAC/IRAC */}
            <div className="p-3 sm:p-4 space-y-3">
              <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-12 text-center">Orden</th>
                      <th className="p-2.5">Insumo / Producto Comercial</th>
                      <th className="p-2.5">Código FRAC / IRAC</th>
                      <th className="p-2.5">Dosis Recomendada</th>
                      <th className="p-2.5">Objetivo / Función</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(app.ordenMezcla || []).map((item, iIdx) => (
                      <tr key={iIdx} className="hover:bg-slate-50">
                        <td className="p-2.5 text-center font-bold text-purple-700 bg-purple-50/50">
                          #{item.orden || iIdx + 1}
                        </td>
                        <td className="p-2.5 font-bold text-slate-800">
                          {item.producto}
                        </td>
                        <td className="p-2.5">
                          {item.fracIrac?.includes('FRAC') && (
                            <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[11px]">
                              {item.fracIrac}
                            </span>
                          )}
                          {item.fracIrac?.includes('IRAC') && (
                            <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[11px]">
                              {item.fracIrac}
                            </span>
                          )}
                          {!item.fracIrac?.includes('FRAC') && !item.fracIrac?.includes('IRAC') && (
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                              {item.fracIrac || item.tipo}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900">
                          {item.dosis}
                        </td>
                        <td className="p-2.5 text-slate-600 text-[11px]">
                          {item.funcion}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Observaciones al pie */}
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 text-xs text-purple-900">
                <span className="font-bold">Observaciones y Calibración de la Mezcla:</span>
                <p className="mt-0.5 leading-relaxed text-slate-700">{app.observacionesPie}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(!recomendacionSemana.aplicaciones || recomendacionSemana.aplicaciones.length === 0) && (
        <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
          <ShieldCheck className="w-10 h-10 text-purple-400 mx-auto mb-2" />
          <p className="font-bold text-slate-700 text-sm">No hay aplicaciones fitosanitarias para la Semana {semanaActiva}</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-3">
            Defina una mezcla de fungicidas, insecticidas, metalosatos y coadyuvantes cuidando la rotación FRAC/IRAC.
          </p>
          <button
            onClick={() => setMostrarModalApp(true)}
            className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4" /> Crear Aplicación Semana {semanaActiva}
          </button>
        </div>
      )}

      {/* Modal para agregar nueva aplicación foliar */}
      {mostrarModalApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-purple-900 p-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Nueva Aplicación Foliar (Semana {semanaActiva})</h3>
              <button onClick={() => setMostrarModalApp(false)} className="text-slate-300 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleAgregarAplicacion} className="p-4 overflow-y-auto space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre de la Aplicación</label>
                <input
                  type="text"
                  value={nombreApp}
                  onChange={(e) => setNombreApp(e.target.value)}
                  placeholder="Ej. Aplicación Foliar 1 (Choque Botrytis y Ácaros)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Volumen de Preparación / Envase</label>
                <select
                  value={volumenTanque}
                  onChange={(e) => setVolumenTanque(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Estañón de 200 L">Estañón de 200 L (Estándar Costa Rica)</option>
                  <option value="Tanque de 1000 L (IBC)">Tanque de 1000 L (IBC)</option>
                  <option value="Bomba de espalda (20 L)">Bomba de espalda (20 L)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Instrucciones de Calibración / Observaciones</label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Instrucciones sobre hora de aplicación, tamaño de gota y precauciones en flores."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalApp(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold shadow"
                >
                  Guardar Aplicación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
