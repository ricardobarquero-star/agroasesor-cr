import React, { useState } from 'react';
import { 
  Users, Plus, MapPin, Phone, Mail, Calendar, CheckCircle2, 
  Search, ArrowRight, Trash2, Edit2, Play, ChevronRight, 
  CloudSun, Sparkles, Building2, Layers, AlertCircle, FileText
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { weatherService } from '../services/weatherService';
import { crAgroDatabase } from '../data/crAgroDatabase';

export default function ClientVisitModule({ 
  visitaActiva, 
  onSelectVisita, 
  onVisitaIniciada, 
  onOpenAi 
}) {
  const [subTab, setSubTab] = useState('visitas'); // 'visitas' o 'clientes'
  const [busqueda, setBusqueda] = useState('');
  const [showModalNuevaVisita, setShowModalNuevaVisita] = useState(false);
  const [showModalNuevoCliente, setShowModalNuevoCliente] = useState(false);
  const [cargandoGps, setCargandoGps] = useState(false);

  // Estados del listado
  const [clientes, setClientes] = useState(storageService.getClientes());
  const [visitas, setVisitas] = useState(storageService.getHistorialVisitas());

  // Formulario Nueva Visita
  const [selClienteId, setSelClienteId] = useState(clientes[0]?.id || '');
  const [selFincaId, setSelFincaId] = useState('');
  const [selLoteId, setSelLoteId] = useState('');
  const [selCultivoId, setSelCultivoId] = useState('fresa');
  const [variedadLote, setVariedadLote] = useState('');

  // Formulario Nuevo Cliente
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevaUbicacion, setNuevaUbicacion] = useState('');
  const [nuevaFincaNombre, setNuevaFincaNombre] = useState('');
  const [nuevoLoteNombre, setNuevoLoteNombre] = useState('Lote 1');
  const [nuevoLoteArea, setNuevoLoteArea] = useState('5,000 m2');

  const clienteSeleccionado = clientes.find(c => c.id === selClienteId) || clientes[0];
  const fincasDisponibles = clienteSeleccionado?.fincas || [];
  const fincaSeleccionada = fincasDisponibles.find(f => f.id === selFincaId) || fincasDisponibles[0];
  const lotesDisponibles = fincaSeleccionada?.lotes || [];
  const loteSeleccionado = lotesDisponibles.find(l => l.id === selLoteId) || lotesDisponibles[0];

  const refrescarDatos = () => {
    setClientes(storageService.getClientes());
    setVisitas(storageService.getHistorialVisitas());
  };

  // Iniciar una nueva visita técnica
  const handleIniciarVisita = async (e) => {
    e.preventDefault();
    setCargandoGps(true);
    try {
      // 1. Obtener GPS en vivo
      const gps = await weatherService.obtenerPosicionGPS();
      // 2. Obtener Clima de los últimos 7 días
      const clima = await weatherService.consultarClimaYAcumulado(gps.lat, gps.lon);
      
      const cultivoObj = crAgroDatabase.cultivos.find(c => c.id === selCultivoId) || crAgroDatabase.cultivos[0];

      // 3. Crear registro formal
      const nueva = storageService.crearNuevaVisita({
        cliente: clienteSeleccionado,
        finca: fincaSeleccionada || { id: 'finca-nueva', nombre: 'Finca Principal', ubicacion: clienteSeleccionado.ubicacion },
        lote: {
          id: loteSeleccionado?.id || 'lote-1',
          nombre: loteSeleccionado?.nombre || 'Lote 1',
          area: loteSeleccionado?.area || '1 Ha',
          variedad: variedadLote || loteSeleccionado?.variedad || cultivoObj.variedades[0],
          sustrato: loteSeleccionado?.sustrato || 'Suelo'
        },
        cultivo: cultivoObj,
        clima,
        gps
      });

      refrescarDatos();
      setShowModalNuevaVisita(false);
      onVisitaIniciada(nueva);
    } catch (err) {
      alert('Error iniciando visita: ' + err.message);
    } finally {
      setCargandoGps(false);
    }
  };

  // Guardar nuevo cliente con su finca y lote
  const handleGuardarNuevoCliente = (e) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    const cultivoObj = crAgroDatabase.cultivos.find(c => c.id === selCultivoId) || crAgroDatabase.cultivos[0];

    const nuevoCliente = {
      id: 'cli-' + Date.now(),
      nombre: nuevoNombre.trim(),
      telefono: nuevoTelefono.trim() || '+506 8888-0000',
      email: nuevoEmail.trim(),
      ubicacion: nuevaUbicacion.trim() || 'Costa Rica',
      fincas: [
        {
          id: 'finca-' + Date.now(),
          nombre: nuevaFincaNombre.trim() || `Finca de ${nuevoNombre.split(' ')[0]}`,
          ubicacion: nuevaUbicacion.trim() || 'Costa Rica',
          gps: { lat: 9.9760, lon: -83.9920, altitud: 1414 },
          lotes: [
            {
              id: 'lote-' + Date.now(),
              nombre: nuevoLoteNombre.trim() || 'Lote 1',
              cultivoId: cultivoObj.id,
              cultivoNombre: cultivoObj.nombre,
              variedad: cultivoObj.variedades[0],
              area: nuevoLoteArea.trim() || '5,000 m2',
              sustrato: 'Suelo'
            }
          ]
        }
      ]
    };

    storageService.guardarCliente(nuevoCliente);
    refrescarDatos();
    setSelClienteId(nuevoCliente.id);
    setShowModalNuevoCliente(false);

    // Reset
    setNuevoNombre('');
    setNuevoTelefono('');
    setNuevoEmail('');
    setNuevaUbicacion('');
    setNuevaFincaNombre('');
  };

  const handleEliminarVisita = (id, e) => {
    e.stopPropagation();
    if (!confirm('¿Desea eliminar esta visita del historial?')) return;
    storageService.eliminarVisita(id);
    refrescarDatos();
  };

  const clientesFiltrados = clientes.filter(c => 
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.ubicacion.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fadeIn">
      
      {/* BANNER PRINCIPAL: BOTÓN PARA INICIAR NUEVA VISITA */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-4 sm:p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-emerald-600/30">
        <div className="space-y-1 text-center sm:text-left">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
            Cuaderno Agronómico de Campo
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Control de Visitas Técnicas y Productores
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-lg">
            Inicie una nueva visita, capture el GPS y clima en vivo de la finca y organice su cartera de clientes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => setShowModalNuevaVisita(true)}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30 active:scale-95 transition"
          >
            <Play className="w-4 h-4 fill-slate-900" />
            <span>+ INICIAR NUEVA VISITA</span>
          </button>
          <button
            onClick={() => setShowModalNuevoCliente(true)}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 backdrop-blur transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Cliente / Finca</span>
          </button>
        </div>
      </div>

      {/* SELECTOR DE SUB-PESTAÑA (Visitas vs Clientes) */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1">
        <button
          onClick={() => setSubTab('visitas')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${subTab === 'visitas' ? 'bg-emerald-700 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Calendar className="w-4 h-4" />
          <span>Historial de Visitas ({visitas.length})</span>
        </button>
        <button
          onClick={() => setSubTab('clientes')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${subTab === 'clientes' ? 'bg-emerald-700 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Users className="w-4 h-4" />
          <span>Directorio de Clientes ({clientes.length})</span>
        </button>
      </div>

      {/* ========================================================
          SUB-PESTAÑA 1: HISTORIAL DE VISITAS
         ======================================================== */}
      {subTab === 'visitas' && (
        <div className="space-y-3">
          {/* Tarjeta de Visita Activa en curso */}
          {visitaActiva && (
            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200 mb-3">
                <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  VISITA TÉCNICA ACTIVA EN CURSO
                </span>
                <span className="text-xs font-bold text-emerald-900">{visitaActiva.fecha}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs mb-3">
                <div>
                  <span className="text-slate-500 block">Productor:</span>
                  <strong className="text-slate-900 font-bold">{visitaActiva.productor?.nombre}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Finca y Lote:</span>
                  <strong className="text-slate-900 font-bold">{visitaActiva.finca?.nombre} — {visitaActiva.lote?.nombre}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Cultivo:</span>
                  <strong className="text-emerald-800 font-bold">{visitaActiva.lote?.cultivoNombre} ({visitaActiva.lote?.variedad || 'Estándar'})</strong>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-slate-500">
                  📸 {visitaActiva.hallazgos?.length || 0} hallazgos • 💧 {visitaActiva.recomendacionesFertirriego?.length || 0} fertirriegos • 🛡️ {visitaActiva.recomendacionesPlaguicidas?.length || 0} foliares
                </span>
                <button
                  onClick={() => onSelectVisita(visitaActiva)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-1 shadow"
                >
                  <span>Continuar Visita</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Listado de todas las visitas */}
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pt-2">
            Todas las Visitas Realizadas
          </h3>

          <div className="space-y-2.5">
            {visitas.map((v) => {
              const esActiva = v.id === visitaActiva?.id;
              return (
                <div
                  key={v.id}
                  onClick={() => onSelectVisita(v)}
                  className={`bg-white rounded-2xl border p-3.5 sm:p-4 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${esActiva ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-200'}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">{v.fecha}</span>
                      <span className="text-emerald-800 font-extrabold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {v.lote?.cultivoNombre || 'Cultivo'}
                      </span>
                      {esActiva && (
                        <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                          Activa
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">
                      {v.productor?.nombre || 'Productor'} — {v.finca?.nombre || 'Finca'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Lote: <strong>{v.lote?.nombre}</strong> ({v.lote?.variedad || 'Variedad estándar'}) • {v.finca?.ubicacion || 'Costa Rica'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 text-xs">
                    <div className="text-left sm:text-right text-[11px] text-slate-500">
                      <p>📸 {v.hallazgos?.length || 0} fotos</p>
                      <p>🌧️ {v.clima?.lluviaAcumulada7Dias || 0} mm lluvia</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleEliminarVisita(v.id, e)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                        title="Eliminar visita"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onSelectVisita(v)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white rounded-xl text-slate-700 font-bold transition flex items-center gap-1"
                      >
                        <span>Abrir</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-PESTAÑA 2: DIRECTORIO DE CLIENTES Y FINCAS
         ======================================================== */}
      {subTab === 'clientes' && (
        <div className="space-y-3">
          {/* Barra de Búsqueda */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar cliente por nombre o ubicación (ej. Coronado, Cartago, Poás)..."
              className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {clientesFiltrados.map((cli) => (
              <div key={cli.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      Productor Registrado
                    </span>
                    <span className="text-xs text-slate-400">{cli.fincas?.length || 1} Finca(s)</span>
                  </div>

                  <h4 className="font-bold text-base text-slate-900 mt-1">{cli.nombre}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {cli.ubicacion}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                    <a 
                      href={`tel:${cli.telefono}`} 
                      className="flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5" /> {cli.telefono}
                    </a>
                    {cli.email && (
                      <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                        <Mail className="w-3.5 h-3.5" /> {cli.email}
                      </span>
                    )}
                  </div>

                  {/* Fincas y Lotes del cliente */}
                  <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                    {(cli.fincas || []).map(f => (
                      <div key={f.id}>
                        <strong className="text-slate-800 block text-xs">{f.nombre}</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(f.lotes || []).map(l => (
                            <span key={l.id} className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded font-medium text-slate-700">
                              {l.nombre} ({l.cultivoNombre})
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelClienteId(cli.id);
                      setShowModalNuevaVisita(true);
                    }}
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Iniciar Visita a este Cliente</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: INICIAR NUEVA VISITA TÉCNICA
         ======================================================== */}
      {showModalNuevaVisita && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-slideUp">
            
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-4 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest">Nueva Asesoría</span>
                <h3 className="font-bold text-base">Configurar Visita Técnica en Campo</h3>
              </div>
              <button 
                onClick={() => setShowModalNuevaVisita(false)}
                className="text-slate-300 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIniciarVisita} className="p-4 overflow-y-auto space-y-3.5 text-xs">
              
              {/* Seleccionar Cliente */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">1. Seleccionar Productor / Cliente</label>
                <select
                  value={selClienteId}
                  onChange={(e) => {
                    setSelClienteId(e.target.value);
                    const cli = clientes.find(c => c.id === e.target.value);
                    if (cli?.fincas?.[0]) {
                      setSelFincaId(cli.fincas[0].id);
                      if (cli.fincas[0].lotes?.[0]) {
                        setSelLoteId(cli.fincas[0].lotes[0].id);
                        setSelCultivoId(cli.fincas[0].lotes[0].cultivoId || 'fresa');
                      }
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} ({c.ubicacion})</option>
                  ))}
                </select>
              </div>

              {/* Seleccionar Finca y Lote */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">2. Finca</label>
                  <select
                    value={selFincaId}
                    onChange={(e) => setSelFincaId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                  >
                    {fincasDisponibles.map(f => (
                      <option key={f.id} value={f.id}>{f.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">3. Lote / Sección</label>
                  <select
                    value={selLoteId}
                    onChange={(e) => setSelLoteId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                  >
                    {lotesDisponibles.map(l => (
                      <option key={l.id} value={l.id}>{l.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cultivo y Variedad */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">4. Cultivo Evaluado</label>
                  <select
                    value={selCultivoId}
                    onChange={(e) => setSelCultivoId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-emerald-800 outline-none"
                  >
                    {crAgroDatabase.cultivos.map(c => (
                      <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Variedad</label>
                  <input
                    type="text"
                    value={variedadLote}
                    onChange={(e) => setVariedadLote(e.target.value)}
                    placeholder="Ej. San Andreas / Spider"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Nota de captura automática de GPS y Clima */}
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-blue-900 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CloudSun className="w-4 h-4 text-blue-700" /> Captura Geoclimática Automática
                </p>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Al iniciar la visita, el sistema tomará la posición GPS exacta de la finca y consultará la lluvia acumulada de los últimos 7 días con la API de Open-Meteo.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalNuevaVisita(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargandoGps}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs flex items-center gap-2 shadow-lg"
                >
                  {cargandoGps ? (
                    <span>Obteniendo GPS y Clima...</span>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>¡COMENZAR VISITA AHORA!</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: REGISTRAR NUEVO CLIENTE / FINCA
         ======================================================== */}
      {showModalNuevoCliente && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-slideUp">
            
            <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Cartera de Productores</span>
                <h3 className="font-bold text-base">Registrar Nuevo Cliente y Finca</h3>
              </div>
              <button 
                onClick={() => setShowModalNuevoCliente(false)}
                className="text-slate-300 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarNuevoCliente} className="p-4 overflow-y-auto space-y-3.5 text-xs">
              
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo del Productor / Empresa</label>
                <input
                  type="text"
                  required
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej. Don Minor Fonseca Abarca"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={nuevoTelefono}
                    onChange={(e) => setNuevoTelefono(e.target.value)}
                    placeholder="+506 8888-9999"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={nuevoEmail}
                    onChange={(e) => setNuevoEmail(e.target.value)}
                    placeholder="productor@finca.cr"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ubicación Geográfica / Cantón</label>
                <input
                  type="text"
                  value={nuevaUbicacion}
                  onChange={(e) => setNuevaUbicacion(e.target.value)}
                  placeholder="Ej. Llano Grande de Cartago / Coronado / Poás"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                <span className="font-bold text-emerald-950 block">Datos de la Finca Inicial:</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-600 text-[11px] mb-0.5">Nombre de la Finca</label>
                    <input
                      type="text"
                      value={nuevaFincaNombre}
                      onChange={(e) => setNuevaFincaNombre(e.target.value)}
                      placeholder="Ej. Finca El Ciprés"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 text-[11px] mb-0.5">Nombre del Lote 1</label>
                    <input
                      type="text"
                      value={nuevoLoteNombre}
                      onChange={(e) => setNuevoLoteNombre(e.target.value)}
                      placeholder="Ej. Lote Macrotúnel 1"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalNuevoCliente(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow"
                >
                  Guardar Productor
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
