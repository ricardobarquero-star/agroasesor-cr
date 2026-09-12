import React, { useState } from 'react';
import { 
  ShieldCheck, Plus, Trash2, AlertTriangle, Sparkles, Check, 
  Layers, FlaskConical, Calendar, AlertOctagon, HelpCircle,
  X, CheckCircle2, Sliders, Shield, Sprout, ArrowRight, MapPin,
  List, Edit3
} from 'lucide-react';
import { crAgroDatabase } from '../data/crAgroDatabase';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';

export default function PesticideModule({ visita, onUpdateVisita, onOpenAi }) {
  const [semanaActiva, setSemanaActiva] = useState(1);
  const [mostrarModalApp, setMostrarModalApp] = useState(false);
  const [appEditandoId, setAppEditandoId] = useState(null); // null = nuevo, string = editando
  const [tipoMezcla, setTipoMezcla] = useState('fungicida_foliar'); // 'fungicida_foliar' o 'insecticida_acaricida'
  
  // Campos del modal de aplicación
  const [nombreApp, setNombreApp] = useState('');
  const [alcanceApp, setAlcanceApp] = useState('Toda la Finca');
  const [volumenTanque, setVolumenTanque] = useState('Estañón de 200 L');
  const [boquilla, setBoquilla] = useState('Cono hueco TX-4 (45 PSI)');
  const [observaciones, setObservaciones] = useState('');

  // Filas dinámicas limpias
  const [lineasMezcla, setLineasMezcla] = useState([]);
  const [filtroCategoriaInsumo, setFiltroCategoriaInsumo] = useState('todos');
  const [investigandoIdx, setInvestigandoIdx] = useState(null);

  const recomendaciones = visita.recomendacionesPlaguicidas || [];
  const recomendacionSemana = recomendaciones.find(r => r.semana === semanaActiva) || {
    semana: semanaActiva,
    titulo: `Semana ${semanaActiva} - Manejo Fitosanitario y Foliares`,
    alcance: 'Toda la Finca',
    sinAplicacion: false,
    motivoSinAplicacion: '',
    aplicaciones: []
  };

  const todosPlaguicidas = storageService.getTodosLosPlaguicidas();

  // Filtrar productos según tipo de mezcla y filtros por categoría (Fungicidas, Insecticidas, Foliares, Coadyuvantes, Todos)
  const productosFiltradosMezcla = todosPlaguicidas.filter(p => {
    const cat = (p.categoria || '').toLowerCase();
    const nombre = (p.nombreComercial || '').toLowerCase();

    // Filtros activos por pestaña/botón de categoría
    if (filtroCategoriaInsumo === 'fungicida') {
      return cat.includes('fungicida') || (!cat.includes('insecticida') && !cat.includes('acaricida') && (cat.includes('biol') || p.esPersonalizado));
    }
    if (filtroCategoriaInsumo === 'insecticida') {
      return cat.includes('insecticida') || cat.includes('acaricida');
    }
    if (filtroCategoriaInsumo === 'foliar') {
      return cat.includes('foliar') || cat.includes('nutricional') || nombre.includes('metalosato') || nombre.includes('cosmoquel') || nombre.includes('quel') || cat.includes('boro') || cat.includes('zinc');
    }
    if (filtroCategoriaInsumo === 'coadyuvante') {
      return cat.includes('acondicionador') || cat.includes('coadyuvante') || nombre.includes('carrier') || nombre.includes('break') || nombre.includes('silwet');
    }

    // Modo 'todos': aplicar segregación según tipo de mezcla
    if (tipoMezcla === 'fungicida_foliar') {
      return cat.includes('fungicida') || cat.includes('foliar') || cat.includes('nutricional') || 
             cat.includes('biológico') || cat.includes('acondicionador') || cat.includes('coadyuvante') ||
             nombre.includes('carrier') || nombre.includes('break-thru') || p.esPersonalizado;
    } else {
      return cat.includes('insecticida') || cat.includes('acaricida') || cat.includes('biológico') || 
             cat.includes('acondicionador') || cat.includes('coadyuvante') || p.esPersonalizado;
    }
  });

  // Auto-investigar insumo nuevo digitado manualmente con Asistente IA
  const handleAutoInvestigarConIA = async (idx, nombre) => {
    if (!nombre || !nombre.trim()) return;
    setInvestigandoIdx(idx);
    try {
      const res = await geminiService.investigarInsumo(nombre.trim());
      if (res) {
        const nuevas = [...lineasMezcla];
        nuevas[idx].tipo = res.categoria || nuevas[idx].tipo;
        nuevas[idx].fracIrac = res.codigoFracIrac || nuevas[idx].fracIrac;
        nuevas[idx].dosis = res.dosisEstandar || nuevas[idx].dosis;
        nuevas[idx].funcion = res.blancoBiologico || res.ingredienteActivo || nuevas[idx].funcion;
        setLineasMezcla(nuevas);
      }
    } catch (err) {
      console.warn('Error investigando insumo con IA:', err);
    } finally {
      setInvestigandoIdx(null);
    }
  };

  // Obtener lista de lotes de la finca actual para el selector de alcance
  const clientes = storageService.getClientes();
  const clienteActual = clientes.find(c => c.id === visita.clienteId);
  const fincaActual = clienteActual?.fincas?.find(f => f.id === visita.finca?.id);
  const lotesDeFinca = fincaActual?.lotes || [visita.lote].filter(Boolean);

  // Abrir modal configurando un lienzo limpio para nueva aplicación
  const handleAbrirModalMezcla = (tipo) => {
    setAppEditandoId(null);
    setTipoMezcla(tipo);
    setObservaciones('');
    setAlcanceApp('Toda la Finca');

    if (tipo === 'fungicida_foliar') {
      setNombreApp(`Aplicación Foliar 1: Fungicida + Nutrición`);
      setLineasMezcla([
        { orden: 1, tipo: 'Acondicionador', producto: '', dosis: '', fracIrac: 'Acondicionador', funcion: 'Regulación de pH y dureza', esManual: false },
        { orden: 2, tipo: 'Fungicida', producto: '', dosis: '', fracIrac: '', funcion: '', esManual: false }
      ]);
    } else {
      setNombreApp(`Aplicación Foliar 2: Insecticida / Acaricida`);
      setLineasMezcla([
        { orden: 1, tipo: 'Acondicionador', producto: '', dosis: '', fracIrac: 'Acondicionador', funcion: 'Regulación de pH y dureza', esManual: false },
        { orden: 2, tipo: 'Insecticida', producto: '', dosis: '', fracIrac: '', funcion: '', esManual: false }
      ]);
    }
    setMostrarModalApp(true);
  };

  // Abrir modal para editar una aplicación fitosanitaria existente
  const handleEditarAplicacion = (app) => {
    setAppEditandoId(app.id);
    setTipoMezcla(app.tipoMezcla || 'fungicida_foliar');
    setNombreApp(app.nombre || '');
    setAlcanceApp(app.alcance || 'Toda la Finca');
    setVolumenTanque(app.volumenTanque || 'Estañón de 200 L');
    setBoquilla(app.boquilla || 'Cono hueco TX-4 (45 PSI)');
    setObservaciones(app.observacionesPie || '');

    const lineas = (app.ordenMezcla || []).map((l, idx) => ({
      ...l,
      orden: l.orden || (idx + 1),
      esManual: l.esManual !== undefined ? l.esManual : !todosPlaguicidas.some(p => p.nombreComercial.toLowerCase() === (l.producto || '').toLowerCase())
    }));
    setLineasMezcla(lineas.length > 0 ? lineas : [
      { orden: 1, tipo: 'Acondicionador', producto: '', dosis: '', fracIrac: '', funcion: '', esManual: false }
    ]);
    setMostrarModalApp(true);
  };

  // Manejar selección de producto en el dropdown de plaguicidas (con limpieza estricta al digitar)
  const handleSeleccionarPlaguicida = (valor, idx) => {
    const nuevas = [...lineasMezcla];
    if (valor === '__manual__') {
      // Al cambiar a digitación manual: LIMPIAR ABSOLUTAMENTE TODO el registro anterior
      nuevas[idx].esManual = true;
      nuevas[idx].producto = '';
      nuevas[idx].fracIrac = ''; // OBLIGATORIO: Queda en limpio sin heredar datos
      nuevas[idx].dosis = '';    // Queda en limpio
      nuevas[idx].funcion = '';  // Queda en limpio
      nuevas[idx].tipo = tipoMezcla === 'fungicida_foliar' ? 'Fungicida' : 'Insecticida';
    } else {
      nuevas[idx].esManual = false;
      nuevas[idx].producto = valor;

      // Autocompletar categoría, FRAC/IRAC, dosis y función desde la base de datos
      const encontrado = todosPlaguicidas.find(p => p.nombreComercial === valor);
      if (encontrado) {
        nuevas[idx].tipo = encontrado.categoria || nuevas[idx].tipo;
        nuevas[idx].fracIrac = encontrado.codigoFracIrac || '';
        nuevas[idx].dosis = encontrado.dosisEstandar || nuevas[idx].dosis;
        nuevas[idx].funcion = encontrado.blancoBiologico || encontrado.ingredienteActivo || nuevas[idx].funcion;
      }
    }
    setLineasMezcla(nuevas);
  };

  // Alerta de segregación agronómica
  const verificarSegregacion = (lineas, tipo) => {
    const textos = lineas.map(l => `${l.producto} ${l.tipo} ${l.funcion}`).join(' ').toLowerCase();
    
    if (tipo === 'fungicida_foliar') {
      const tieneInsecticida = textos.includes('insecticida') || textos.includes('acaricida') || 
                               textos.includes('irac') || textos.includes('oberon') || 
                               textos.includes('proclaim') || textos.includes('vertimec') ||
                               textos.includes('danitol') || textos.includes('delegate');
      if (tieneInsecticida) {
        return '⚠️ ALERTA DE MANEJO: Ha agregado un insecticida/acaricida en el tanque de Fungicida + Foliar. Según las directrices agronómicas, los insecticidas/acaricidas deben aplicarse en una mezcla separada para evitar fitotoxicidad y antagonismos.';
      }
    }

    if (tipo === 'insecticida_acaricida') {
      const tieneFungicidaOFoliar = textos.includes('fungicida') || textos.includes('frac') || 
                                   textos.includes('metalosato') || textos.includes('bellis') || 
                                   textos.includes('serenade') || textos.includes('amistar') ||
                                   textos.includes('switch') || textos.includes('nativo');
      if (tieneFungicidaOFoliar) {
        return '⚠️ ALERTA DE MANEJO: Ha agregado un fungicida o foliar en el tanque de Insecticidas/Acaricidas. Se recomienda aplicar los insecticidas de forma exclusiva en su propia aplicación.';
      }
    }

    return null;
  };

  const advertenciaSegregacion = verificarSegregacion(lineasMezcla, tipoMezcla);

  // Marcar la semana como "Sin aplicación requerida"
  const handleMarcarSinAplicacion = () => {
    const estadoActual = recomendacionSemana.sinAplicacion;
    const nuevoEstado = !estadoActual;
    const motivo = nuevoEstado ? 'Monitoreo preventivo: Población de plagas y severidad fúngica por debajo del umbral de daño económico. No requiere aplicación de agroquímicos esta semana.' : '';

    const recActualizada = { 
      ...recomendacionSemana, 
      sinAplicacion: nuevoEstado, 
      motivoSinAplicacion: motivo 
    };

    const todasRecs = recomendaciones.filter(r => r.semana !== semanaActiva);
    todasRecs.push(recActualizada);
    todasRecs.sort((a, b) => a.semana - b.semana);
    onUpdateVisita({ ...visita, recomendacionesPlaguicidas: todasRecs });
  };

  // Guardar aplicación en la semana activa
  const handleGuardarAplicacion = (e) => {
    e.preventDefault();

    lineasMezcla.forEach(l => {
      if (l.producto && l.producto.trim()) {
        storageService.registrarInsumoSiNoExiste({
          nombreComercial: l.producto.trim(),
          esFertilizante: l.tipo === 'Foliar',
          categoria: l.tipo,
          codigoFracIrac: l.fracIrac,
          dosis: l.dosis
        });
      }
    });

    const appFinal = {
      id: appEditandoId || ('ap-' + Date.now()),
      tipoMezcla,
      nombre: nombreApp || (tipoMezcla === 'fungicida_foliar' ? 'Mezcla Fungicida + Foliar' : 'Mezcla Insecticida + Acaricida'),
      alcance: alcanceApp,
      volumenTanque,
      boquilla,
      ordenMezcla: lineasMezcla.filter(l => l.producto && l.producto.trim()),
      observacionesPie: observaciones || ''
    };

    let appsActualizadas = [];
    if (appEditandoId) {
      appsActualizadas = (recomendacionSemana.aplicaciones || []).map(a => 
        a.id === appEditandoId ? appFinal : a
      );
    } else {
      appsActualizadas = [...(recomendacionSemana.aplicaciones || []), appFinal];
    }

    const recActualizada = { 
      ...recomendacionSemana, 
      sinAplicacion: false,
      aplicaciones: appsActualizadas 
    };

    const todasRecs = recomendaciones.filter(r => r.semana !== semanaActiva);
    todasRecs.push(recActualizada);
    todasRecs.sort((a, b) => a.semana - b.semana);

    onUpdateVisita({ ...visita, recomendacionesPlaguicidas: todasRecs });
    setMostrarModalApp(false);
    setAppEditandoId(null);
  };

  const handleEliminarAplicacion = (id) => {
    if (!confirm('¿Desea eliminar esta aplicación fitosanitaria?')) return;
    const appsActualizadas = (recomendacionSemana.aplicaciones || []).filter(a => a.id !== id);
    const recActualizada = { ...recomendacionSemana, aplicaciones: appsActualizadas };
    const todasRecs = recomendaciones.filter(r => r.semana !== semanaActiva);
    todasRecs.push(recActualizada);
    todasRecs.sort((a, b) => a.semana - b.semana);
    onUpdateVisita({ ...visita, recomendacionesPlaguicidas: todasRecs });
  };

  const handleAgregarSemana = () => {
    const siguienteSemana = Math.max(...recomendaciones.map(r => r.semana), 0) + 1;
    const nuevaRec = {
      semana: siguienteSemana,
      titulo: `Semana ${siguienteSemana} - Manejo Fitosanitario y Foliares`,
      alcance: 'Toda la Finca',
      sinAplicacion: false,
      motivoSinAplicacion: '',
      aplicaciones: []
    };
    const todasRecs = [...recomendaciones, nuevaRec].sort((a, b) => a.semana - b.semana);
    onUpdateVisita({ ...visita, recomendacionesPlaguicidas: todasRecs });
    setSemanaActiva(siguienteSemana);
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
            <h2 className="font-bold text-base sm:text-lg text-slate-900">Aplicaciones Fitosanitarias y Nutrición Foliar</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Selección directa de plaguicidas del catálogo de Costa Rica en listas desplegables al tocar la celda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenAi('plaguicidas')}
            className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold hover:bg-purple-100 transition flex items-center gap-1.5 active:scale-95"
            title="Consultar al Asistente IA para revisión o recomendación"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Consultar IA</span>
          </button>

          <button
            onClick={handleAgregarSemana}
            className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition flex items-center gap-1 shadow-sm active:scale-95"
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
                  ? 'bg-purple-700 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Semana {r.semana}</span>
              {r.sinAplicacion ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-white">
                  ✓ Sin apps
                </span>
              ) : (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  semanaActiva === r.semana ? 'bg-purple-800 text-purple-100' : 'bg-slate-100 text-slate-600'
                }`}>
                  {(r.aplicaciones || []).length}
                </span>
              )}
            </button>
          ))
        ) : (
          <button
            onClick={() => setSemanaActiva(1)}
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-purple-700 text-white flex items-center gap-2"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Semana 1</span>
          </button>
        )}
      </div>

      {/* Barra de Opciones Rápidas de la Semana Activa */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-purple-600" />
            <span>Opciones de Aplicación para Semana {semanaActiva}:</span>
          </h3>

          <button
            onClick={handleMarcarSinAplicacion}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              recomendacionSemana.sinAplicacion
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {recomendacionSemana.sinAplicacion ? 'Semana sin aplicaciones (Activo)' : 'No requiere aplicación esta semana'}
            </span>
          </button>
        </div>

        {/* Botones de Presets Segregados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => handleAbrirModalMezcla('fungicida_foliar')}
            className="p-3.5 rounded-xl border-2 border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 hover:border-emerald-500 flex items-center gap-3 transition text-left group active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
              M1
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-emerald-950 group-hover:text-emerald-800">
                + Redactar Mezcla 1: Fungicidas + Nutrición Foliar
              </h4>
              <p className="text-[11px] text-emerald-700 leading-tight mt-0.5">
                Fungicidas de control junto con Metalosatos y elementos menores.
              </p>
            </div>
          </button>

          <button
            onClick={() => handleAbrirModalMezcla('insecticida_acaricida')}
            className="p-3.5 rounded-xl border-2 border-purple-200 bg-purple-50/60 hover:bg-purple-100 hover:border-purple-500 flex items-center gap-3 transition text-left group active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
              M2
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-purple-950 group-hover:text-purple-800">
                + Redactar Mezcla 2: Insecticidas + Acaricidas
              </h4>
              <p className="text-[11px] text-purple-700 leading-tight mt-0.5">
                Aplicación separada para ácaros, trips o gusanos con coadyuvante.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* ESTADO SI SE MARCÓ COMO SIN APLICACIÓN */}
      {recomendacionSemana.sinAplicacion && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3 text-emerald-900 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm">Semana {semanaActiva}: No requiere aplicación fitosanitaria</h4>
            <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
              {recomendacionSemana.motivoSinAplicacion || 'Monitoreo preventivo: Las poblaciones de insectos y la incidencia fúngica se mantienen por debajo del umbral de intervención agronómica. Mantener monitoreo regular.'}
            </p>
          </div>
        </div>
      )}

      {/* LISTA DE APLICACIONES PROGRAMADAS */}
      <div className="space-y-4">
        {(recomendacionSemana.aplicaciones && recomendacionSemana.aplicaciones.length > 0) ? (
          recomendacionSemana.aplicaciones.map((app, index) => (
            <div key={app.id || index} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white ${
                    app.tipoMezcla === 'fungicida_foliar' ? 'bg-emerald-600' : 'bg-purple-700'
                  }`}>
                    {app.tipoMezcla === 'fungicida_foliar' ? 'M1' : 'M2'}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">{app.nombre}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        {app.alcance || 'Toda la Finca'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Volumen: <strong className="text-slate-700">{app.volumenTanque}</strong> • Boquilla: <span className="text-slate-700">{app.boquilla}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleEditarAplicacion(app)}
                    className="px-2.5 py-1 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition flex items-center gap-1 text-xs font-bold border border-purple-200"
                    title="Editar esta aplicación"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => handleEliminarAplicacion(app.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Eliminar esta aplicación"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tabla con Orden de Mezcla */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="py-2 px-2.5 rounded-l-lg font-bold w-12 text-center">Orden</th>
                      <th className="py-2 px-2 font-bold">Insumo / Producto Comercial</th>
                      <th className="py-2 px-2 font-bold">Categoría</th>
                      <th className="py-2 px-2 font-bold">FRAC / IRAC</th>
                      <th className="py-2 px-2 font-bold text-right">Dosis</th>
                      <th className="py-2 px-2 rounded-r-lg font-bold">Función / Blanco</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(app.ordenMezcla || []).map((l, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-2 text-center">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 inline-flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-2 px-2 font-extrabold text-slate-900">
                          {l.producto}
                        </td>
                        <td className="py-2 px-2 text-slate-500">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            l.tipo === 'Fungicida' ? 'bg-amber-100 text-amber-800' :
                            l.tipo === 'Insecticida' || l.tipo === 'Acaricida' ? 'bg-purple-100 text-purple-800' :
                            l.tipo === 'Foliar' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {l.tipo}
                          </span>
                        </td>
                        <td className="py-2 px-2 font-bold text-indigo-700 text-[11px]">
                          {l.fracIrac || 'N/A'}
                        </td>
                        <td className="py-2 px-2 font-black text-slate-900 text-right shrink-0">
                          {l.dosis}
                        </td>
                        <td className="py-2 px-2 text-slate-600 text-[11px]">
                          {l.funcion || ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {app.observacionesPie && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-1.5">
                  <span className="font-bold text-slate-700 shrink-0">Instrucciones:</span>
                  <span>{app.observacionesPie}</span>
                </div>
              )}
            </div>
          ))
        ) : !recomendacionSemana.sinAplicacion && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto text-xl font-bold">
              🛡️
            </div>
            <h3 className="font-bold text-slate-800 text-sm">No hay aplicaciones programadas para la Semana {semanaActiva}</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Utilice los botones superiores para redactar <strong>Mezcla 1</strong> o <strong>Mezcla 2</strong> con listas desplegables directas.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL PARA AGREGAR APLICACIÓN FITOSANITARIA */}
      {/* ========================================================= */}
      {mostrarModalApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            
            {/* Cabecera del modal */}
            <div className={`text-white p-4 flex items-center justify-between shrink-0 ${
              tipoMezcla === 'fungicida_foliar' ? 'bg-emerald-800' : 'bg-purple-900'
            }`}>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{tipoMezcla === 'fungicida_foliar' ? '🌿' : '🐛'}</span>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                    {appEditandoId ? `Editar Aplicación: ${nombreApp}` : (tipoMezcla === 'fungicida_foliar' ? 'Mezcla 1: Fungicida + Nutrición Foliar' : 'Mezcla 2: Insecticida + Acaricida')}
                  </h3>
                  <p className="text-[11px] text-white/80">Semana {semanaActiva} • Selección desplegable del Catálogo CR</p>
                </div>
              </div>
              <button 
                onClick={() => setMostrarModalApp(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleGuardarAplicacion} className="p-4 space-y-4 overflow-y-auto flex-1">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de la Aplicación</label>
                  <input
                    type="text"
                    value={nombreApp}
                    onChange={(e) => setNombreApp(e.target.value)}
                    placeholder="Ej: Mezcla Foliar 1 - Botrytis y Calcio"
                    className="w-full text-xs font-medium border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alcance / Destino de la Aplicación</label>
                  <select
                    value={alcanceApp}
                    onChange={(e) => setAlcanceApp(e.target.value)}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Volumen Tanque / Aplicación</label>
                  <select
                    value={volumenTanque}
                    onChange={(e) => setVolumenTanque(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 bg-slate-50 outline-none"
                  >
                    <option value="Estañón de 200 L">Estañón (200 L)</option>
                    <option value="Bomba de espalda (18 L)">Bomba espalda (18 L)</option>
                    <option value="Bomba de espalda (20 L)">Bomba espalda (20 L)</option>
                    <option value="Tanque 400 L">Tanque 400 L</option>
                    <option value="Tanque 1000 L">Tanque 1000 L</option>
                    <option value="Por Hectárea (calibrado)">Por Hectárea (ha)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Boquilla y Presión</label>
                  <input
                    type="text"
                    value={boquilla}
                    onChange={(e) => setBoquilla(e.target.value)}
                    placeholder="Cono hueco TX-4 (45 PSI)"
                    className="w-full text-xs font-medium border border-slate-300 rounded-xl p-2.5 outline-none"
                  />
                </div>
              </div>

              {/* ALERTA DE SEGREGACIÓN */}
              {advertenciaSegregacion && (
                <div className="bg-amber-50 border-2 border-amber-400 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-amber-950">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Alerta Agronómica de Manejo:</strong>
                    <span>{advertenciaSegregacion}</span>
                  </div>
                </div>
              )}

              {/* TABLA DE PRODUCTOS CON LISTAS DESPLEGABLES NATIVAS */}
              <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/50 space-y-2.5">
                {/* FILTROS POR TIPO DE INSUMO */}
                <div className="bg-white p-2 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mr-1">Filtrar Insumos:</span>
                    {[
                      { id: 'todos', label: 'Todos' },
                      { id: 'fungicida', label: '🍄 Solo Fungicidas' },
                      { id: 'insecticida', label: '🐛 Solo Insecticidas/Acaricidas' },
                      { id: 'foliar', label: '🍃 Solo Foliares' },
                      { id: 'coadyuvante', label: '💧 Coadyuvantes' }
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFiltroCategoriaInsumo(f.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                          filtroCategoriaInsumo === f.id
                            ? 'bg-purple-700 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                    {productosFiltradosMezcla.length} insumos listados
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 block">
                      Orden de Mezcla en Estañón (Toque para seleccionar producto)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      1. Acondicionador ➔ 2. Polvos/Gránulos ➔ 3. Líquidos ➔ 4. Foliares ➔ 5. Coadyuvante
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLineasMezcla([
                      ...lineasMezcla,
                      { orden: lineasMezcla.length + 1, tipo: tipoMezcla === 'fungicida_foliar' ? 'Fungicida' : 'Insecticida', producto: '', dosis: '', fracIrac: '', funcion: '', esManual: false }
                    ])}
                    className="px-2 py-1 bg-purple-700 text-white rounded-lg text-[11px] font-bold hover:bg-purple-800 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Agregar Insumo
                  </button>
                </div>

                <div className="space-y-2">
                  {lineasMezcla.map((l, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-wrap sm:flex-nowrap items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {idx + 1}
                      </span>
                      
                      {/* CELDA DE PRODUCTO: LISTA DESPLEGABLE CON DIGITAR DE PRIMERO */}
                      {!l.esManual ? (
                        <div className="flex-1 min-w-[200px] flex items-center gap-1">
                          <select
                            value={l.producto}
                            onChange={(e) => handleSeleccionarPlaguicida(e.target.value, idx)}
                            className="w-full text-xs font-bold text-slate-900 border border-slate-300 rounded-lg p-2 bg-purple-50/40 outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            {/* REQUISITO: La opción de digitar producto debe estar DE PRIMERO en la lista */}
                            <option value="__manual__">✏️ [+ DIGITAR PRODUCTO MANUAL / NO ESTÁ EN LISTA...]</option>
                            <option value="">-- Toque para desplegar catálogo ({productosFiltradosMezcla.length} insumos) --</option>
                            {productosFiltradosMezcla.map((p, i) => (
                              <option key={i} value={p.nombreComercial}>
                                {p.nombreComercial} ({p.categoria || ''} {p.codigoFracIrac ? `• ${p.codigoFracIrac}` : ''})
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const nuevo = [...lineasMezcla];
                              nuevo[idx].esManual = true;
                              nuevo[idx].producto = '';
                              nuevo[idx].fracIrac = '';
                              nuevo[idx].dosis = '';
                              nuevo[idx].funcion = '';
                              setLineasMezcla(nuevo);
                            }}
                            className="p-2 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200"
                            title="Escribir producto manual"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 min-w-[200px] flex items-center gap-1">
                          <input
                            type="text"
                            value={l.producto}
                            onChange={(e) => {
                              const nuevo = [...lineasMezcla];
                              nuevo[idx].producto = e.target.value;
                              setLineasMezcla(nuevo);
                            }}
                            onBlur={() => {
                              if (l.producto && !l.fracIrac) {
                                handleAutoInvestigarConIA(idx, l.producto);
                              }
                            }}
                            placeholder="Escriba nombre comercial del producto..."
                            className="w-full text-xs font-semibold border border-purple-400 rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleAutoInvestigarConIA(idx, l.producto)}
                            disabled={!l.producto || investigandoIdx === idx}
                            className="px-2 py-1.5 text-[11px] font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg border border-purple-300 flex items-center gap-1 shrink-0 disabled:opacity-50"
                            title="Investigar grupo FRAC/IRAC y dosis con IA"
                          >
                            <Sparkles className={`w-3.5 h-3.5 ${investigandoIdx === idx ? 'animate-spin text-purple-700' : 'text-purple-600'}`} />
                            <span className="hidden sm:inline">{investigandoIdx === idx ? 'Buscando...' : 'IA Ficha'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const nuevo = [...lineasMezcla];
                              nuevo[idx].esManual = false;
                              setLineasMezcla(nuevo);
                            }}
                            className="p-1.5 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200"
                            title="Volver a lista desplegable"
                          >
                            <List className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <select
                        value={l.tipo}
                        onChange={(e) => {
                          const nuevo = [...lineasMezcla];
                          nuevo[idx].tipo = e.target.value;
                          setLineasMezcla(nuevo);
                        }}
                        className="text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 outline-none w-24"
                      >
                        <option value="Acondicionador">Acondic.</option>
                        <option value="Fungicida">Fungicida</option>
                        <option value="Insecticida">Insectic.</option>
                        <option value="Acaricida">Acaricida</option>
                        <option value="Foliar">Foliar</option>
                        <option value="Coadyuvante">Coadyuv.</option>
                        <option value="Biológico">Biológico</option>
                      </select>

                      <input
                        type="text"
                        value={l.dosis}
                        onChange={(e) => {
                          const nuevo = [...lineasMezcla];
                          nuevo[idx].dosis = e.target.value;
                          setLineasMezcla(nuevo);
                        }}
                        placeholder="Dosis"
                        className="w-24 text-xs font-bold text-center border border-slate-200 rounded-lg p-2 outline-none"
                      />

                      <input
                        type="text"
                        value={l.fracIrac}
                        onChange={(e) => {
                          const nuevo = [...lineasMezcla];
                          nuevo[idx].fracIrac = e.target.value;
                          setLineasMezcla(nuevo);
                        }}
                        placeholder="FRAC/IRAC"
                        className="w-24 text-xs font-bold text-indigo-700 text-center border border-slate-200 rounded-lg p-2 outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => setLineasMezcla(lineasMezcla.filter((_, i) => i !== idx))}
                        className="p-1 text-slate-400 hover:text-red-500 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recomendaciones de Aplicación y Calibración
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej: Aplicar antes de las 9:00 AM o en la tarde. Asegurar cobertura en el envés de la hoja."
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMostrarModalApp(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-purple-700 hover:bg-purple-800 text-white shadow-md flex items-center gap-1.5 transition active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>{appEditandoId ? 'Actualizar Aplicación' : 'Guardar Aplicación'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
