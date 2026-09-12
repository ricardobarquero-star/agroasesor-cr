import { storageService } from '../services/storageService';
import { photoStorageService } from '../services/photoStorageService';
import React, { useState } from 'react';
import { 
  AlertTriangle, Camera, Plus, Trash2, Edit2, Sparkles, 
  CheckCircle2, Info, Eye, Tag, AlertOctagon, Droplets, Thermometer, Activity, Check, X, Shield
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
  const [loteAfectado, setLoteAfectado] = useState('Toda la Finca');
  const [mostrarForm, setMostrarForm] = useState(false);

  // Estados para Mediciones de Suelo en Campo (pH, CE, Temp, Humedad)
  const [mostrarFormSuelo, setMostrarFormSuelo] = useState(false);
  const [sueloEditandoId, setSueloEditandoId] = useState(null);
  const [loteMedicionSuelo, setLoteMedicionSuelo] = useState('Toda la Finca');
  const [phSuelo, setPhSuelo] = useState('5.8');
  const [ceSuelo, setCeSuelo] = useState('1.4');
  const [tempSuelo, setTempSuelo] = useState('19.0');
  const [humedadSuelo, setHumedadSuelo] = useState('70%');
  const [metodoSuelo, setMetodoSuelo] = useState('Sonda directa en rizósfera');
  const [analisisIaTexto, setAnalisisIaTexto] = useState('');
  const [ajusteTexto, setAjusteTexto] = useState('');
  const [editandoAnalisisTexto, setEditandoAnalisisTexto] = useState(false);

  const categorias = [
    'Enfermedades Fitosanitarias',
    'Plagas / Insectos / Ácaros',
    'Problemas Fisiológicos / Nutricionales',
    'Manejo Agronómico / Riego',
    'Conducta / Daño Etológico'
  ];

  // Obtener lotes de la finca actual
  const clientes = storageService.getClientes();
  const clienteActual = clientes.find(c => c.id === visita.clienteId);
  const fincaActual = clienteActual?.fincas?.find(f => f.id === visita.finca?.id);
  const lotesFinca = fincaActual?.lotes || [visita.lote].filter(Boolean);

  // Datos óptimos del cultivo actual para la tabla comparativa
  const cultivoActual = crAgroDatabase.cultivos.find(c => c.id === visita.lote?.cultivoId) || crAgroDatabase.cultivos[0];

  // Limpiar 100% el formulario de hallazgo para que no quede nada del anterior
  const limpiarFormularioHallazgo = () => {
    setEditingFindingId(null);
    setCategoria('Enfermedades Fitosanitarias');
    setTitulo('');
    setDescripcion('');
    setSeveridad('Media');
    setOrganoAfectado('Hoja');
    setTempPhoto(null);
    setLoteAfectado('Toda la Finca');
  };

  const handleAbrirNuevoHallazgo = () => {
    limpiarFormularioHallazgo();
    setMostrarForm(true);
  };
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

  const handleAddFinding = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    let actualizados = [];
    if (editingFindingId) {
      // Editando hallazgo existente
      actualizados = (visita.hallazgos || []).map(h => {
        if (h.id === editingFindingId) {
          return {
            ...h,
            categoria,
            titulo: titulo.trim(),
            descripcion: descripcion.trim(),
            severidad,
            organoAfectado,
            fotoAnotada: tempPhoto || h.fotoAnotada
          };
        }
        return h;
      });
      if (tempPhoto) {
        await photoStorageService.guardarFoto(editingFindingId, tempPhoto);
      }
    } else {
      // Nuevo hallazgo
      const nuevoId = 'h-' + Date.now();
      const nuevoHallazgo = {
        id: nuevoId,
        categoria,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        severidad,
        organoAfectado,
        loteAfectado: loteAfectado || 'Toda la Finca',
        fotoAnotada: tempPhoto,
        fecha: new Date().toLocaleDateString('es-CR')
      };
      actualizados = [...(visita.hallazgos || []), nuevoHallazgo];
      if (tempPhoto) {
        await photoStorageService.guardarFoto(nuevoId, tempPhoto);
      }
    }

    onUpdateVisita({ ...visita, hallazgos: actualizados });

    // Limpieza estricta e inmediata
    limpiarFormularioHallazgo();
    setMostrarForm(false);
  };

  const handleStartEdit = (h) => {
    setEditingFindingId(h.id);
    setCategoria(h.categoria || 'Enfermedades Fitosanitarias');
    setTitulo(h.titulo || '');
    setDescripcion(h.descripcion || '');
    setSeveridad(h.severidad || 'Media');
    setOrganoAfectado(h.organoAfectado || 'Hoja');
    setTempPhoto(h.fotoAnotada || null);
    setMostrarForm(true);
  };


  // ========================================================
  // GESTIÓN DE MEDICIONES DE SUELO (pH, CE, Temp, Humedad)
  // ========================================================
  const generarAnalisisSuelo = (ph, ce, temp, hum, cultivo) => {
    const phNum = parseFloat(ph) || 6.0;
    const ceNum = parseFloat(ce) || 1.4;
    let evalTexto = '';
    let ajuste = '';

    // Evaluación pH
    if (phNum < 5.4) {
      evalTexto += `pH ácido (${phNum}): Riesgo inminente de bloqueo de fósforo, calcio y magnesio, con posible toxicidad de aluminio o manganeso. `;
      ajuste += 'Ajuste: Aplicar enmienda de carbonato de calcio o silicato de potasio (Sili-K) y modular fertirriego hacia nitratos. ';
    } else if (phNum > 6.8) {
      evalTexto += `pH alcalino (${phNum}): Riesgo de clorosis por precipitación de microelementos (hierro, zinc, manganeso). `;
      ajuste += 'Ajuste: Inyectar ácido fosfórico en Tanque B para corregir el bulbo húmedo a 5.8 - 6.2. ';
    } else {
      evalTexto += `pH óptimo (${phNum}) para ${cultivo?.nombre || 'el cultivo'}: Excelente disponibilidad de nutrientes en rizósfera. `;
      ajuste += 'Mantener equilibrio químico actual. ';
    }

    // Evaluación CE
    if (ceNum > 2.0) {
      evalTexto += `CE elevada (${ceNum} mS/cm): Presión osmótica excesiva en raíces con riesgo de quemadura radicular y necrosis marginal foliar (tip-burn). `;
      ajuste += 'Ajuste urgente: Realizar riego de lavado con agua sola y bajar conductividad de inyección 0.3 mS/cm. ';
    } else if (ceNum < 0.9) {
      evalTexto += `CE baja (${ceNum} mS/cm): Nivel nutricional deficitario en el bulbo de goteo. `;
      ajuste += 'Ajuste: Incrementar dosis de fertilizante en fertirriego para suplir la demanda del cultivo. ';
    } else {
      evalTexto += `CE en rango fisiológico óptimo (${ceNum} mS/cm). `;
    }

    return { evalTexto, ajuste };
  };

  const handleGuardarMedicionSuelo = (e) => {
    e.preventDefault();
    const { evalTexto, ajuste } = generarAnalisisSuelo(phSuelo, ceSuelo, tempSuelo, humedadSuelo, cultivoActual);
    const listaActual = visita.medicionesSuelo || [];

    let actualizadas = [];
    if (sueloEditandoId) {
      actualizadas = listaActual.map(m => {
        if (m.id === sueloEditandoId) {
          return {
            ...m,
            loteNombre: loteMedicionSuelo,
            phSuelo,
            ceSuelo,
            tempSuelo,
            humedadSuelo,
            metodo: metodoSuelo,
            analisisIa: analisisIaTexto || evalTexto,
            ajusteRecomendado: ajusteTexto || ajuste,
            estadoAprobacion: 'aprobado'
          };
        }
        return m;
      });
    } else {
      const nuevaMed = {
        id: 'suelo-' + Date.now(),
        loteNombre: loteMedicionSuelo,
        phSuelo,
        ceSuelo,
        tempSuelo,
        humedadSuelo,
        metodo: metodoSuelo,
        analisisIa: evalTexto,
        ajusteRecomendado: ajuste,
        estadoAprobacion: 'aprobado'
      };
      actualizadas = [...listaActual, nuevaMed];
    }

    onUpdateVisita({ ...visita, medicionesSuelo: actualizadas });
    setMostrarFormSuelo(false);
    setSueloEditandoId(null);
    setAnalisisIaTexto('');
    setAjusteTexto('');
  };

  const handleCambiarEstadoSuelo = (id, nuevoEstado) => {
    const listaActual = visita.medicionesSuelo || [];
    const actualizadas = listaActual.map(m => {
      if (m.id === id) return { ...m, estadoAprobacion: nuevoEstado };
      return m;
    });
    onUpdateVisita({ ...visita, medicionesSuelo: actualizadas });
  };

  const handleEliminarMedicionSuelo = (id) => {
    if (!confirm('¿Desea eliminar esta medición de suelo?')) return;
    const actualizadas = (visita.medicionesSuelo || []).filter(m => m.id !== id);
    onUpdateVisita({ ...visita, medicionesSuelo: actualizadas });
  };

  const handleAbrirEditarSuelo = (m) => {
    setSueloEditandoId(m.id);
    setLoteMedicionSuelo(m.loteNombre || 'Toda la Finca');
    setPhSuelo(m.phSuelo || '5.8');
    setCeSuelo(m.ceSuelo || '1.4');
    setTempSuelo(m.tempSuelo || '19.0');
    setHumedadSuelo(m.humedadSuelo || '70%');
    setMetodoSuelo(m.metodo || 'Sonda directa en rizósfera');
    setAnalisisIaTexto(m.analisisIa || '');
    setAjusteTexto(m.ajusteRecomendado || '');
    setMostrarFormSuelo(true);
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
            onClick={handleAbrirNuevoHallazgo}
            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>{mostrarForm ? 'Cerrar' : 'Nuevo Hallazgo'}</span>
          </button>
        </div>
      </div>


      {/* ========================================================
          TARJETA DE MEDICIONES DE CAMPO DE SUELO (pH, CE, Temp, Humedad)
         ======================================================== */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              🌱
            </span>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                Mediciones de Suelo y Sustrato en Campo (Rizósfera)
              </h3>
              <p className="text-[11px] text-slate-500">
                Monitoreo de pH, CE, temperatura y humedad con rangos óptimos y ajuste técnico para el cliente.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSueloEditandoId(null);
              setLoteMedicionSuelo('Toda la Finca');
              setPhSuelo('5.8');
              setCeSuelo('1.4');
              setTempSuelo('19.0');
              setHumedadSuelo('70%');
              setAnalisisIaTexto('');
              setAjusteTexto('');
              setMostrarFormSuelo(!mostrarFormSuelo);
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{mostrarFormSuelo ? 'Cerrar Medición' : '+ Medición de Suelo'}</span>
          </button>
        </div>

        {/* Formulario de Medición de Suelo */}
        {mostrarFormSuelo && (
          <form onSubmit={handleGuardarMedicionSuelo} className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-300 space-y-3 animate-fadeIn">
            <h4 className="font-bold text-xs text-emerald-950 flex items-center gap-1">
              <Activity className="w-4 h-4 text-emerald-700" />
              <span>{sueloEditandoId ? 'Editar Medición de Suelo' : 'Registrar Lectura de Sonda en Rizósfera'}</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
              <div className="col-span-2 sm:col-span-1">
                <label className="block font-bold text-slate-700 mb-1">Lote Valorado</label>
                <select
                  value={loteMedicionSuelo}
                  onChange={(e) => setLoteMedicionSuelo(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 outline-none"
                >
                  <option value="Toda la Finca">Toda la Finca</option>
                  {lotesFinca.map(l => (
                    <option key={l.id} value={`Lote: ${l.nombre}`}>{l.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">pH Suelo</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={phSuelo}
                  onChange={(e) => setPhSuelo(e.target.value)}
                  placeholder="5.8"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-center font-black text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">CE Suelo (mS/cm)</label>
                <input
                  type="number"
                  step="0.05"
                  required
                  value={ceSuelo}
                  onChange={(e) => setCeSuelo(e.target.value)}
                  placeholder="1.4"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-center font-black text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Temp. Suelo (°C)</label>
                <input
                  type="number"
                  step="0.5"
                  value={tempSuelo}
                  onChange={(e) => setTempSuelo(e.target.value)}
                  placeholder="19.0"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-center font-black text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Humedad Suelo</label>
                <input
                  type="text"
                  value={humedadSuelo}
                  onChange={(e) => setHumedadSuelo(e.target.value)}
                  placeholder="70%"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-center font-black text-slate-900 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Observaciones / Ajuste Agronómico Propuesto (Opcional):</label>
              <input
                type="text"
                value={ajusteTexto}
                onChange={(e) => setAjusteTexto(e.target.value)}
                placeholder="Ej. Realizar riego de lavado o aplicar enmienda cálcica para desbloquear fósforo..."
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMostrarFormSuelo(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs"
              >
                {sueloEditandoId ? 'Actualizar Medición' : 'Guardar y Evaluar'}
              </button>
            </div>
          </form>
        )}

        {/* Tabla Comparativa de Mediciones con Rangos Óptimos */}
        {(visita.medicionesSuelo && visita.medicionesSuelo.length > 0) ? (
          <div className="space-y-3">
            {visita.medicionesSuelo.map((m, idx) => (
              <div key={m.id || idx} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{m.loteNombre || 'Toda la Finca'}</span>
                    <span className="text-[10px] text-slate-500 font-medium">• {m.metodo || 'Sonda en campo'}</span>
                  </div>

                  {/* BOTONES DE DECISIÓN DEL INGENIERO: [Aprobado, Editar, Eliminar] */}
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => handleCambiarEstadoSuelo(m.id, m.estadoAprobacion === 'aprobado' ? 'omitido' : 'aprobado')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 transition ${
                        m.estadoAprobacion === 'aprobado'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                      title="Aprobar para incluir en el reporte final"
                    >
                      <Check className="w-3 h-3" />
                      <span>{m.estadoAprobacion === 'aprobado' ? 'Aprobado p/ Reporte' : 'Omitido de Reporte'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAbrirEditarSuelo(m)}
                      className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                      title="Editar medición y texto"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarMedicionSuelo(m.id)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Eliminar medición"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Tabla de Parámetros vs Rangos Óptimos del Cultivo */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead>
                      <tr className="bg-slate-200/70 text-slate-700 text-[11px]">
                        <th className="p-1.5 text-left font-bold rounded-l">Parámetro Rizosférico</th>
                        <th className="p-1.5 font-bold">Valor Medido</th>
                        <th className="p-1.5 font-bold">Rango Óptimo ({cultivoActual.nombre?.split(' ')[0]})</th>
                        <th className="p-1.5 font-bold rounded-r">Estado Fisiológico</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      <tr>
                        <td className="p-1.5 text-left font-semibold text-slate-800">pH del Suelo / Sustrato</td>
                        <td className="p-1.5 font-black text-slate-900">{m.phSuelo}</td>
                        <td className="p-1.5 text-slate-500 font-medium">{cultivoActual.rangoPh || '5.5 - 6.5'}</td>
                        <td className="p-1.5 font-bold">
                          {parseFloat(m.phSuelo) < 5.5 ? (
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px]">⚠️ Ácido (Bloqueo P/Ca)</span>
                          ) : parseFloat(m.phSuelo) > 6.8 ? (
                            <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[10px]">⚠️ Alcalino (Clorosis Fe)</span>
                          ) : (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">✅ Óptimo</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-1.5 text-left font-semibold text-slate-800">Conductividad Eléctrica (CE)</td>
                        <td className="p-1.5 font-black text-slate-900">{m.ceSuelo} mS/cm</td>
                        <td className="p-1.5 text-slate-500 font-medium">{cultivoActual.rangoCe || '1.2 - 1.8 mS/cm'}</td>
                        <td className="p-1.5 font-bold">
                          {parseFloat(m.ceSuelo) > 2.0 ? (
                            <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded text-[10px]">🚨 Salinidad / Estrés</span>
                          ) : parseFloat(m.ceSuelo) < 0.9 ? (
                            <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[10px]">⚠️ Bajo en Nutrientes</span>
                          ) : (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">✅ Óptimo</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-1.5 text-left font-semibold text-slate-800">Temperatura de Suelo</td>
                        <td className="p-1.5 font-black text-slate-900">{m.tempSuelo} °C</td>
                        <td className="p-1.5 text-slate-500 font-medium">{cultivoActual.rangoTempSuelo || '16 - 22 °C'}</td>
                        <td className="p-1.5 font-bold text-slate-700 text-[10px]">
                          {parseFloat(m.tempSuelo) > 24 ? '⚠️ Elevada' : (parseFloat(m.tempSuelo) < 14 ? '⚠️ Fría' : '✅ Favorable')}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-1.5 text-left font-semibold text-slate-800">Humedad de Rizósfera</td>
                        <td className="p-1.5 font-black text-slate-900">{m.humedadSuelo}</td>
                        <td className="p-1.5 text-slate-500 font-medium">{cultivoActual.rangoHumedadSuelo || '60 - 75%'}</td>
                        <td className="p-1.5 font-bold text-slate-700 text-[10px]">
                          {m.humedadSuelo?.includes('8') || m.humedadSuelo?.includes('9') ? '⚠️ Saturación (Riesgo Pythium)' : '✅ Capacidad de Campo'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Dictamen del Análisis y Ajuste Técnico */}
                <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200 text-xs space-y-1">
                  <p className="text-emerald-950 leading-relaxed">
                    <strong className="font-extrabold text-emerald-900">Valoración Agronómica:</strong> {m.analisisIa}
                  </p>
                  <p className="text-slate-800 leading-relaxed">
                    <strong className="font-extrabold text-slate-900">Ajuste para tratar con el Productor:</strong> {m.ajusteRecomendado}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic text-center py-2">
            No hay mediciones de suelo registradas para esta visita. Presione "+ Medición de Suelo" para documentar lecturas de pH y CE.
          </p>
        )}
      </div>


      {/* Formulario para registrar nuevo hallazgo */}
      {mostrarForm && (
        <form onSubmit={handleAddFinding} className="bg-white p-4 rounded-2xl border-2 border-emerald-500 shadow-lg space-y-3.5 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-600" /> {editingFindingId ? "Editar Hallazgo Diagnósticado" : "Nuevo Hallazgo de Campo"}
            </h3>
            <span className="text-[11px] text-slate-400">Paso obligatorio: Foto anotada</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Lote Específico o Alcance</label>
            <select
              value={loteAfectado}
              onChange={(e) => setLoteAfectado(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
            >
              <option value="Toda la Finca">🌱 Toda la Finca ({visita.finca?.nombre || 'Finca'})</option>
              {lotesFinca.map(l => (
                <option key={l.id} value={`Lote: ${l.nombre}`}>
                  Lote específico: {l.nombre} ({l.cultivoNombre || ''})
                </option>
              ))}
            </select>
          </div>
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
              {editingFindingId ? "Actualizar Hallazgo" : "Guardar Hallazgo"}
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
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {h.categoria}
                    </span>
                    {h.loteAfectado && (
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        📍 {h.loteAfectado}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-1 leading-snug">
                    {h.titulo}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {h.descripcion}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>{h.fecha || 'Fecha de visita'}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStartEdit(h)}
                      className="text-emerald-700 hover:text-emerald-900 p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition flex items-center gap-1 font-bold text-[11px]"
                      title="Editar hallazgo y marcas de foto"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleDeleteFinding(h.id)}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition"
                      title="Eliminar hallazgo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
