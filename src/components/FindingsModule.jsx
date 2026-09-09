import React, { useState } from 'react';
import { 
  AlertTriangle, Camera, Plus, Trash2, Edit2, Sparkles, 
  CheckCircle2, Info, Eye, Tag, AlertOctagon
} from 'lucide-react';
import PhotoAnnotator from './PhotoAnnotator';
import { crAgroDatabase } from '../data/crAgroDatabase';

export default function FindingsModule({ visita, onUpdateVisita, onOpenAi }) {
  const [showAnnotator, setShowAnnotator] = useState(false);
  const [editingFindingId, setEditingFindingId] = useState(null);
  const [tempPhoto, setTempPhoto] = useState(null);

  // Formulario nuevo hallazgo
  const [categoria, setCategoria] = useState('Enfermedades Fitosanitarias');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [severidad, setSeveridad] = useState('Media');
  const [organoAfectado, setOrganoAfectado] = useState('Hoja');
  const [mostrarForm, setMostrarForm] = useState(false);

  const categorias = [
    'Enfermedades Fitosanitarias',
    'Plagas / Insectos / Ácaros',
    'Problemas Fisiológicos / Nutricionales',
    'Manejo Agronómico / Riego',
    'Conducta / Daño Etológico'
  ];

  const severidades = [
    { label: 'Baja', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    { label: 'Media', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    { label: 'Alta', color: 'bg-orange-100 text-orange-800 border-orange-300' },
    { label: 'Crítica', color: 'bg-red-100 text-red-800 border-red-300' }
  ];

  const handleSavePhotoFromAnnotator = (photoDataUrl) => {
    setTempPhoto(photoDataUrl);
    setShowAnnotator(false);
  };

  const handleAddFinding = (e) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    const nuevoHallazgo = {
      id: 'h-' + Date.now(),
      categoria,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      severidad,
      organoAfectado,
      fotoAnotada: tempPhoto,
      fecha: new Date().toLocaleDateString('es-CR')
    };

    const actualizados = [...(visita.hallazgos || []), nuevoHallazgo];
    onUpdateVisita({ ...visita, hallazgos: actualizados });

    // Reset
    setTitulo('');
    setDescripcion('');
    setTempPhoto(null);
    setMostrarForm(false);
  };

  const handleDeleteFinding = (id) => {
    if (!confirm('¿Desea eliminar este hallazgo?')) return;
    const actualizados = (visita.hallazgos || []).filter(h => h.id !== id);
    onUpdateVisita({ ...visita, hallazgos: actualizados });
  };

  return (
    <div className="space-y-4">
      {/* Barra de cabecera del módulo */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
              📸
            </span>
            <h2 className="font-bold text-base sm:text-lg text-slate-900">Hallazgos y Diagnóstico en Campo</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Documente problemas con fotos editadas, flechas indicadoras y evaluación de severidad.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenAi('hallazgos')}
            className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 font-semibold text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Asistente IA (Diagnóstico)</span>
          </button>
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>{mostrarForm ? 'Cerrar' : 'Nuevo Hallazgo'}</span>
          </button>
        </div>
      </div>

      {/* Formulario para registrar nuevo hallazgo */}
      {mostrarForm && (
        <form onSubmit={handleAddFinding} className="bg-white p-4 rounded-2xl border-2 border-emerald-500 shadow-lg space-y-3.5 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-600" /> Nuevo Hallazgo de Campo
            </h3>
            <span className="text-[11px] text-slate-400">Paso obligatorio: Foto anotada</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría del Problema</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Severidad en Campo</label>
              <select
                value={severidad}
                onChange={(e) => setSeveridad(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {severidades.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Título del Hallazgo / Síntoma Principal</label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Foco de Botrytis cinerea en cáliz floral de fresa"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción Técnica Detallada</label>
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describa la distribución del daño, órganos afectados, aspecto de las lesiones, esporulación, ácaros observados..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Sección de Foto con Anotador */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-2">Fotografía de Alta Calidad Editorial (Marcada)</label>
            
            {tempPhoto ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-300 max-w-xs mx-auto">
                <img src={tempPhoto} alt="Foto anotada" className="w-full h-44 object-cover" />
                <button
                  type="button"
                  onClick={() => setShowAnnotator(true)}
                  className="absolute bottom-2 right-2 px-2.5 py-1 bg-slate-900/80 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 flex items-center gap-1 backdrop-blur"
                >
                  <Edit2 className="w-3 h-3" /> Re-editar marcas
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAnnotator(true)}
                className="w-full py-4 border-2 border-dashed border-emerald-400 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl text-emerald-800 text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition"
              >
                <Camera className="w-6 h-6 text-emerald-600" />
                <span>Abrir Anotador de Foto (Tomar, dibujar flechas y círculos)</span>
              </button>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow"
            >
              Guardar Hallazgo
            </button>
          </div>
        </form>
      )}

      {/* Lista de hallazgos registrados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {(visita.hallazgos || []).map((h, index) => {
          const sevObj = severidades.find(s => s.label === h.severidad) || severidades[1];
          return (
            <div key={h.id || index} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col">
              {/* Foto superior si existe */}
              {h.fotoAnotada ? (
                <div className="relative h-48 bg-slate-900 w-full overflow-hidden">
                  <img 
                    src={h.fotoAnotada} 
                    alt={h.titulo} 
                    className="w-full h-full object-cover" 
                  />
                  <span className="absolute top-2 left-2 bg-black/70 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Tag className="w-3 h-3 text-emerald-400" /> Foto Editorial #{index + 1}
                  </span>
                  <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-md border ${sevObj.color} shadow`}>
                    Severidad: {h.severidad}
                  </span>
                </div>
              ) : (
                <div className="h-20 bg-slate-100 flex items-center justify-between px-4 border-b border-slate-200">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-slate-400" /> Sin foto adjunta
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${sevObj.color}`}>
                    Severidad: {h.severidad}
                  </span>
                </div>
              )}

              {/* Contenido */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {h.categoria}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 mt-1 leading-snug">
                    {h.titulo}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {h.descripcion}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>{h.fecha || 'Fecha de visita'}</span>
                  <button
                    onClick={() => handleDeleteFinding(h.id)}
                    className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition"
                    title="Eliminar hallazgo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(!visita.hallazgos || visita.hallazgos.length === 0) && (
        <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
          <Camera className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="font-bold text-slate-700 text-sm">No hay hallazgos documentados aún</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-3">
            Haga clic en "Nuevo Hallazgo" para tomar fotografías en campo, marcarlas con flechas y señalar focos de plagas o deficiencias.
          </p>
          <button
            onClick={() => setMostrarForm(true)}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4" /> Agregar Primer Hallazgo
          </button>
        </div>
      )}

      {/* Modal de Anotador Fotográfico Táctil */}
      {showAnnotator && (
        <PhotoAnnotator
          onSavePhoto={handleSavePhotoFromAnnotator}
          onCancel={() => setShowAnnotator(false)}
        />
      )}
    </div>
  );
}
