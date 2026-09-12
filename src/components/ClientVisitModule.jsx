import React, { useState } from 'react';
import { 
  Users, Share2, Plus, MapPin, Phone, Mail, Calendar, CheckCircle2, 
  Search, ArrowRight, Trash2, Edit2, Play, ChevronRight, 
  CloudSun, Sparkles, Building2, Layers, AlertCircle, FileText,
  FolderOpen, X, Check, Sprout, CornerDownRight
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
  
  // Modales
  const [showModalNuevaVisita, setShowModalNuevaVisita] = useState(false);
  const [showModalNuevoCliente, setShowModalNuevoCliente] = useState(false);
  const [clienteExpediente, setClienteExpediente] = useState(null); // Cliente abierto en expediente
  const [showModalEditarCliente, setShowModalEditarCliente] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCedula, setEditCedula] = useState('');
  const [editUbicacion, setEditUbicacion] = useState('');

  // Modales edición de Finca y Lote
  const [fincaEditando, setFincaEditando] = useState(null);
  const [showModalEditarFinca, setShowModalEditarFinca] = useState(false);
  const [editFincaNombre, setEditFincaNombre] = useState('');
  const [editFincaUbicacion, setEditFincaUbicacion] = useState('');
  const [editFincaAltitud, setEditFincaAltitud] = useState('1600');

  const [loteEditando, setLoteEditando] = useState(null);
  const [fincaIdLoteEditando, setFincaIdLoteEditando] = useState(null);
  const [showModalEditarLote, setShowModalEditarLote] = useState(false);
  const [editLoteNombre, setEditLoteNombre] = useState('');
  const [editLoteCultivoId, setEditLoteCultivoId] = useState('fresa');
  const [editLoteVariedad, setEditLoteVariedad] = useState('');
  const [editLoteArea, setEditLoteArea] = useState('');
  const [editLoteSustrato, setEditLoteSustrato] = useState('Suelo');
  
  // Modales dentro del expediente
  const [showModalNuevaFinca, setShowModalNuevaFinca] = useState(false);
  const [fincaParaNuevoLote, setFincaParaNuevoLote] = useState(null); // Finca a la que se le agrega lote
  
  const [cargandoGps, setCargandoGps] = useState(false);

  // Estados de datos
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

  // Formulario Nueva Finca (dentro de expediente)
  const [nombreNuevaFinca, setNombreNuevaFinca] = useState('');
  const [ubicacionNuevaFinca, setUbicacionNuevaFinca] = useState('');
  const [altitudNuevaFinca, setAltitudNuevaFinca] = useState('1600');

  // Formulario Nuevo Lote (dentro de expediente)
  const [nombreNuevoLote, setNombreNuevoLote] = useState('');
  const [cultivoNuevoLoteId, setCultivoNuevoLoteId] = useState('fresa');
  const [variedadNuevoLote, setVariedadNuevoLote] = useState('');
  const [areaNuevoLote, setAreaNuevoLote] = useState('3,000 m2');
  const [sustratoNuevoLote, setSustratoNuevoLote] = useState('Suelo');

  const refrescarDatos = () => {
    const cls = storageService.getClientes();
    setClientes(cls);
    setVisitas(storageService.getHistorialVisitas());
    if (clienteExpediente) {
      const actualizado = cls.find(c => c.id === clienteExpediente.id);
      setClienteExpediente(actualizado || null);
    }
  };

  const clienteSeleccionado = clientes.find(c => c.id === selClienteId) || clientes[0];
  const fincasDisponibles = clienteSeleccionado?.fincas || [];
  const fincaSeleccionada = fincasDisponibles.find(f => f.id === selFincaId) || fincasDisponibles[0];
  const lotesDisponibles = fincaSeleccionada?.lotes || [];
  const loteSeleccionado = lotesDisponibles.find(l => l.id === selLoteId) || lotesDisponibles[0];

  // Iniciar una nueva visita técnica
  const handleIniciarVisita = async (e) => {
    e.preventDefault();
    setCargandoGps(true);
    try {
      const gps = await weatherService.obtenerPosicionGPS();
      const clima = await weatherService.consultarClimaYAcumulado(gps.lat, gps.lon);
      const cultivoObj = crAgroDatabase.cultivos.find(c => c.id === selCultivoId) || crAgroDatabase.cultivos[0];

      const nueva = storageService.crearNuevaVisita({
        cliente: clienteSeleccionado,
        finca: fincaSeleccionada || { id: 'finca-1', nombre: 'Finca Principal', ubicacion: clienteSeleccionado?.ubicacion },
        lote: {
          id: loteSeleccionado?.id || 'lote-1',
          nombre: loteSeleccionado?.nombre || 'Lote 1',
          area: loteSeleccionado?.area || '1 Ha',
          variedad: variedadLote || loteSeleccionado?.variedad || (cultivoObj.variedades ? cultivoObj.variedades[0] : ''),
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

  // Guardar nuevo cliente con su primera finca y lote
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

    // Reset campos
    setNuevoNombre('');
    setNuevoTelefono('');
    setNuevoEmail('');
    setNuevaUbicacion('');
    setNuevaFincaNombre('');
  };

  // Agregar Finca al expediente del cliente actual
  const handleAgregarFincaAExpediente = (e) => {
    e.preventDefault();
    if (!nombreNuevaFinca.trim() || !clienteExpediente) return;

    const nuevaFinca = {
      id: 'finca-' + Date.now(),
      nombre: nombreNuevaFinca.trim(),
      ubicacion: ubicacionNuevaFinca.trim() || clienteExpediente.ubicacion,
      gps: { lat: 9.9760, lon: -83.9920, altitud: parseInt(altitudNuevaFinca) || 1600 },
      lotes: []
    };

    storageService.agregarFincaACliente(clienteExpediente.id, nuevaFinca);
    refrescarDatos();
    setShowModalNuevaFinca(false);
    setNombreNuevaFinca('');
    setUbicacionNuevaFinca('');
  };

  // Eliminar Finca del cliente
  const handleEliminarFinca = (fincaId) => {
    if (!confirm('¿Desea eliminar esta finca y todos sus lotes registrados?')) return;
    storageService.eliminarFinca(clienteExpediente.id, fincaId);
    refrescarDatos();
  };

  // Agregar Lote a una finca específica
  const handleAgregarLoteAFinca = (e) => {
    e.preventDefault();
    if (!nombreNuevoLote.trim() || !clienteExpediente || !fincaParaNuevoLote) return;

    const cultivoObj = crAgroDatabase.cultivos.find(c => c.id === cultivoNuevoLoteId) || crAgroDatabase.cultivos[0];

    const nuevoLote = {
      id: 'lote-' + Date.now(),
      nombre: nombreNuevoLote.trim(),
      cultivoId: cultivoObj.id,
      cultivoNombre: cultivoObj.nombre,
      variedad: variedadNuevoLote.trim() || cultivoObj.variedades[0],
      area: areaNuevoLote.trim() || '2,500 m2',
      sustrato: sustratoNuevoLote.trim() || 'Suelo'
    };

    storageService.agregarLoteAFinca(clienteExpediente.id, fincaParaNuevoLote.id, nuevoLote);
    refrescarDatos();
    setFincaParaNuevoLote(null);
    setNombreNuevoLote('');
    setVariedadNuevoLote('');
  };

  // Eliminar Lote de una finca
  const handleEliminarLote = (fincaId, loteId) => {
    if (!confirm('¿Desea eliminar este lote de la finca?')) return;
    storageService.eliminarLote(clienteExpediente.id, fincaId, loteId);
    refrescarDatos();
  };

  // Iniciar visita rápida desde el expediente
  const handleIniciarVisitaDirecta = async (cli, finca, lote) => {
    setCargandoGps(true);
    try {
      const gps = await weatherService.obtenerPosicionGPS();
      const clima = await weatherService.consultarClimaYAcumulado(gps.lat, gps.lon);
      const cultivoObj = crAgroDatabase.cultivos.find(c => c.id === lote.cultivoId) || crAgroDatabase.cultivos[0];

      const nueva = storageService.crearNuevaVisita({
        cliente: cli,
        finca: finca,
        lote: {
          id: lote.id,
          nombre: lote.nombre,
          area: lote.area,
          variedad: lote.variedad,
          sustrato: lote.sustrato
        },
        cultivo: cultivoObj,
        clima,
        gps
      });

      refrescarDatos();
      setClienteExpediente(null);
      onVisitaIniciada(nueva);
    } catch (err) {
      alert('Error iniciando visita: ' + err.message);
    } finally {
      setCargandoGps(false);
    }
  };

  const handleEliminarVisita = (id, e) => {
    if (e) e.stopPropagation();
    if (!confirm('¿Desea eliminar esta visita del historial de campo? Esta acción no se puede deshacer.')) return;
    storageService.eliminarVisita(id);
    const nuevas = storageService.getHistorialVisitas();
    setVisitas(nuevas);
    if (visitaActiva?.id === id && nuevas.length > 0) {
      onSelectVisita(nuevas[0]);
    }
    refrescarDatos();
  };

  // Gestión de edición y borrado de Productores
  const handleAbrirEditarCliente = (cli, e) => {
    if (e) e.stopPropagation();
    setClienteEditando(cli);
    setEditNombre(cli.nombre || '');
    setEditTelefono(cli.telefono || '');
    setEditEmail(cli.email || '');
    setEditCedula(cli.cedula || '');
    setEditUbicacion(cli.ubicacion || '');
    setShowModalEditarCliente(true);
  };

  const handleGuardarEdicionCliente = (e) => {
    e.preventDefault();
    if (!clienteEditando || !editNombre.trim()) return;
    storageService.editarCliente(clienteEditando.id, {
      nombre: editNombre.trim(),
      telefono: editTelefono.trim(),
      email: editEmail.trim(),
      cedula: editCedula.trim(),
      ubicacion: editUbicacion.trim()
    });
    setShowModalEditarCliente(false);
    setClienteEditando(null);
    refrescarDatos();
  };

  const handleEliminarCliente = (cliId, e) => {
    if (e) e.stopPropagation();
    const cli = clientes.find(c => c.id === cliId);
    const nombre = cli ? cli.nombre : 'este productor';
    if (!confirm(`¿Está seguro de eliminar a "${nombre}" y todo su expediente agrícola (fincas y lotes)? Esta acción es permanente.`)) return;
    storageService.eliminarCliente(cliId);
    if (clienteExpediente?.id === cliId) {
      setClienteExpediente(null);
    }
    refrescarDatos();
  };

  // Edición de Finca
  const handleAbrirEditarFinca = (finca) => {
    setFincaEditando(finca);
    setEditFincaNombre(finca.nombre || '');
    setEditFincaUbicacion(finca.ubicacion || '');
    setEditFincaAltitud(finca.gps?.altitud?.toString() || '1600');
    setShowModalEditarFinca(true);
  };

  const handleGuardarEdicionFinca = (e) => {
    e.preventDefault();
    if (!clienteExpediente || !fincaEditando || !editFincaNombre.trim()) return;
    storageService.editarFinca(clienteExpediente.id, fincaEditando.id, {
      nombre: editFincaNombre.trim(),
      ubicacion: editFincaUbicacion.trim(),
      gps: {
        ...fincaEditando.gps,
        altitud: parseInt(editFincaAltitud) || 1600
      }
    });
    setShowModalEditarFinca(false);
    setFincaEditando(null);
    refrescarDatos();
  };

  // Edición de Lote
  const handleAbrirEditarLote = (fincaId, lote) => {
    setFincaIdLoteEditando(fincaId);
    setLoteEditando(lote);
    setEditLoteNombre(lote.nombre || '');
    setEditLoteCultivoId(lote.cultivoId || 'fresa');
    setEditLoteVariedad(lote.variedad || '');
    setEditLoteArea(lote.area || '');
    setEditLoteSustrato(lote.sustrato || 'Suelo');
    setShowModalEditarLote(true);
  };

  const handleGuardarEdicionLote = (e) => {
    e.preventDefault();
    if (!clienteExpediente || !fincaIdLoteEditando || !loteEditando || !editLoteNombre.trim()) return;
    const cultivoObj = crAgroDatabase.cultivos.find(c => c.id === editLoteCultivoId) || crAgroDatabase.cultivos[0];
    storageService.editarLote(clienteExpediente.id, fincaIdLoteEditando, loteEditando.id, {
      nombre: editLoteNombre.trim(),
      cultivoId: cultivoObj.id,
      cultivoNombre: cultivoObj.nombre,
      variedad: editLoteVariedad.trim() || loteEditando.variedad,
      area: editLoteArea.trim() || loteEditando.area,
      sustrato: editLoteSustrato.trim() || loteEditando.sustrato
    });
    setShowModalEditarLote(false);
    setLoteEditando(null);
    refrescarDatos();
  };

  const clientesFiltrados = clientes.filter(c => 
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.ubicacion.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fadeIn">
      
      {/* BANNER PRINCIPAL */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-4 sm:p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-emerald-600/30">
        <div className="space-y-1 text-center sm:text-left">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
            Cuaderno Agronómico de Campo
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Control de Visitas Técnicas y Productores
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-lg">
            Expediente con múltiples fincas por cliente y lotes específicos. Inicie visitas con GPS y clima en vivo.
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
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* SELECTOR DE SUB-PESTAÑA */}
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
          <span>Expedientes de Clientes y Fincas ({clientes.length})</span>
        </button>
      </div>

      {/* ========================================================
          SUB-PESTAÑA 1: HISTORIAL DE VISITAS
         ======================================================== */}
      {subTab === 'visitas' && (
        <div className="space-y-3">
          {visitaActiva && (
            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200 mb-3">
                <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  VISITA ACTIVA EN CURSO
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
                      Lote: <strong>{v.lote?.nombre}</strong> ({v.lote?.variedad || 'Estándar'}) • {v.finca?.ubicacion || 'Costa Rica'}
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
          SUB-PESTAÑA 2: EXPEDIENTES DE CLIENTES, FINCAS Y LOTES
         ======================================================== */}
      {subTab === 'clientes' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar cliente por nombre o cantón (Coronado, Cartago, Poás, Zarcero)..."
              className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {clientesFiltrados.map((cli) => {
              const totalLotes = (cli.fincas || []).reduce((acc, f) => acc + (f.lotes?.length || 0), 0);
              return (
                <div key={cli.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        Expediente Agrícola
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {cli.fincas?.length || 0} Finca(s) • {totalLotes} Lote(s)
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-slate-900 mt-1">{cli.nombre}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {cli.ubicacion}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                      <a href={`tel:${cli.telefono}`} className="flex items-center gap-1 font-semibold text-emerald-700 hover:underline">
                        <Phone className="w-3.5 h-3.5" /> {cli.telefono}
                      </a>
                      {cli.email && (
                        <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                          <Mail className="w-3.5 h-3.5" /> {cli.email}
                        </span>
                      )}
                    </div>

                    {/* Resumen de Fincas del Cliente */}
                    <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                      {(cli.fincas || []).map(f => (
                        <div key={f.id} className="border-b border-slate-200/60 pb-1.5 last:border-b-0 last:pb-0">
                          <div className="flex items-center justify-between">
                            <strong className="text-slate-800 text-xs flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-emerald-700" />
                              {f.nombre}
                            </strong>
                            <span className="text-[10px] text-slate-500">{f.lotes?.length || 0} lotes</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1 pl-4">
                            {(f.lotes || []).map(l => (
                              <span key={l.id} className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded font-medium text-slate-700">
                                {l.nombre} ({l.cultivoNombre} - {l.variedad})
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                    <button
                      onClick={() => setClienteExpediente(cli)}
                      className="flex-1 py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5 transition"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Expediente ({cli.fincas?.length || 0} Fincas)</span>
                    </button>
                    <button
                      onClick={(e) => handleAbrirEditarCliente(cli, e)}
                      className="p-2 text-slate-500 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-xl transition"
                      title="Editar datos del productor"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleEliminarCliente(cli.id, e)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                      title="Eliminar este productor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelClienteId(cli.id);
                        setShowModalNuevaVisita(true);
                      }}
                      className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1 transition shrink-0"
                      title="Iniciar visita en este cliente"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span className="hidden sm:inline">Visita</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EXPEDIENTE COMPLETO DEL CLIENTE (FINCAS Y LOTES)
         ======================================================== */}
      {clienteExpediente && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            
            {/* Cabecera del Expediente */}
            <div className="bg-emerald-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-2xl bg-emerald-800 flex items-center justify-center text-xl font-black">
                  📁
                </span>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">
                    Expediente: {clienteExpediente.nombre}
                  </h3>
                  <p className="text-xs text-emerald-200">
                    {clienteExpediente.telefono} • {clienteExpediente.ubicacion}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleAbrirEditarCliente(clienteExpediente)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition"
                  title="Editar datos del productor"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Editar</span>
                </button>
                <button
                  onClick={() => handleEliminarCliente(clienteExpediente.id)}
                  className="p-2 rounded-xl bg-red-500/30 hover:bg-red-500/50 text-red-200 text-xs font-bold flex items-center gap-1 transition"
                  title="Eliminar este productor"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Eliminar</span>
                </button>
                <button 
                  onClick={() => setClienteExpediente(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition text-white ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido scrolleable del expediente */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
              
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-700" />
                    <span>Fincas Registradas de este Cliente ({clienteExpediente.fincas?.length || 0})</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">Agregue las diferentes propiedades y los lotes o cultivos específicos de cada una.</p>
                </div>
                <button
                  onClick={() => setShowModalNuevaFinca(true)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl flex items-center gap-1 shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Finca</span>
                </button>
              </div>

              {/* Listado de Fincas y Lotes */}
              <div className="space-y-4">
                {(clienteExpediente.fincas && clienteExpediente.fincas.length > 0) ? (
                  clienteExpediente.fincas.map((finca) => (
                    <div key={finca.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
                      
                      {/* Cabecera de la Finca */}
                      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                        <div>
                          <h5 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                            <span className="text-emerald-700 font-bold">🏡</span>
                            {finca.nombre}
                          </h5>
                          <span className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            {finca.ubicacion || 'Costa Rica'} • Alt: {finca.gps?.altitud || 1600} msnm
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setFincaParaNuevoLote(finca)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 shadow-xs transition"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Lote</span>
                          </button>
                          <button
                            onClick={() => handleAbrirEditarFinca(finca)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="Editar finca"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEliminarFinca(finca.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar finca"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {/* Dashboard de Estadística Climática Acumulada de la Finca */}
                      {(() => {
                        const stats = storageService.getEstadisticasClimaClienteFinca(clienteExpediente.id, finca.id);
                        return (
                          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-blue-950">
                            <div className="flex items-center gap-1.5 font-bold text-blue-900">
                              <CloudSun className="w-4 h-4 text-blue-700 shrink-0" />
                              <span>Historial Climático de la Finca:</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
                              <span>🌧️ Lluvia Acum: <strong>{stats.lluviaTotalAcumulada} mm</strong></span>
                              <span>💧 HR Prom: <strong>{stats.promedioHumedadRelativa}%</strong></span>
                              <span>🌡️ Temp Prom: <strong>{stats.promedioTemperatura}°C</strong></span>
                              <span className="text-slate-500 font-semibold">({stats.totalVisitas} visitas)</span>
                            </div>
                          </div>
                        );
                      })()}


                      {/* Lotes dentro de la Finca */}
                      <div className="space-y-2 pl-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Lotes y Cultivos Específicos ({finca.lotes?.length || 0}):
                        </span>

                        {(finca.lotes && finca.lotes.length > 0) ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {finca.lotes.map((lote) => (
                              <div key={lote.id} className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
                                <div>
                                  <div className="flex items-center justify-between">
                                    <strong className="text-slate-900 font-bold text-xs">{lote.nombre}</strong>
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleAbrirEditarLote(finca.id, lote)}
                                        className="text-slate-500 hover:text-emerald-700 p-0.5"
                                        title="Editar este lote"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleEliminarLote(finca.id, lote.id)}
                                        className="text-slate-400 hover:text-red-500 p-0.5"
                                        title="Eliminar lote"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="mt-1 space-y-0.5 text-[11px]">
                                    <p className="text-emerald-800 font-bold">🌱 {lote.cultivoNombre} — <span className="font-normal text-slate-600">{lote.variedad}</span></p>
                                    <p className="text-slate-500">Área: {lote.area} • {lote.sustrato || 'Suelo'}</p>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleIniciarVisitaDirecta(clienteExpediente, finca, lote)}
                                  className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-[10px] rounded-lg flex items-center justify-center gap-1 shadow-xs transition active:scale-95"
                                >
                                  <Play className="w-2.5 h-2.5 fill-white" />
                                  <span>Iniciar Visita en este Lote</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-white rounded-xl border border-dashed border-slate-300 text-center text-slate-400 text-xs">
                            No hay lotes en esta finca. Haga clic en "+ Lote" para agregar uno.
                          </div>
                        )}
                      </div>

                    </div>
                  ))
                ) : (
                  <div className="p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 text-center space-y-2">
                    <p className="font-bold text-slate-600">Este cliente aún no tiene fincas registradas</p>
                    <button
                      onClick={() => setShowModalNuevaFinca(true)}
                      className="px-4 py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                      + Agregar Primera Finca
                    </button>
                  </div>
                )}
              </div>

              {/* ========================================================
                  SECCIÓN: INFORMES TÉCNICOS GUARDADOS EN EXPEDIENTE
                 ======================================================== */}
              {(() => {
                const reportesCliente = storageService.getReportesDeCliente(clienteExpediente.id);
                return (
                  <div className="border-t border-slate-200 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-purple-700" />
                          <span>Informes Técnicos Guardados en Expediente ({reportesCliente.length})</span>
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Historial de informes técnicos generados para este productor listos para consultar, imprimir o reenviar.
                        </p>
                      </div>
                    </div>

                    {reportesCliente.length > 0 ? (
                      <div className="space-y-2">
                        {reportesCliente.map((rep) => (
                          <div key={rep.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">
                                  📄 {rep.fincaNombre || 'Finca'} — {rep.alcance || 'Toda la Finca'}
                                </span>
                                <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">
                                  {rep.fecha}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                                <span>🌱 {rep.cultivoNombre || 'Cultivo'}</span>
                                <span>📸 {rep.hallazgosCount || 0} hallazgos</span>
                                <span>💧 {rep.fertirriegoCount || 0} fertirriego</span>
                                <span>🛡️ {rep.plaguicidasCount || 0} fitosanitarios</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-center">
                              <button
                                onClick={() => {
                                  const visitaEncontrada = visitas.find(v => v.id === rep.visitaId);
                                  if (visitaEncontrada) {
                                    onSelectVisita(visitaEncontrada);
                                    setClienteExpediente(null);
                                  } else {
                                    alert('La visita original se encuentra archivada en el historial.');
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
                                title="Abrir visita / informe técnico"
                              >
                                <FolderOpen className="w-3.5 h-3.5" />
                                <span>Abrir</span>
                              </button>

                              <button
                                onClick={() => {
                                  const telefono = (clienteExpediente.telefono || '').replace(/[^0-9]/g, '');
                                  const texto = encodeURIComponent(rep.resumenWhatsApp || `Informe técnico de visita: ${rep.fecha}`);
                                  const url = telefono 
                                    ? `https://api.whatsapp.com/send?phone=${telefono}&text=${texto}`
                                    : `https://api.whatsapp.com/send?text=${texto}`;
                                  window.open(url, '_blank');
                                }}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-300 transition"
                                title="Compartir por WhatsApp al productor"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm('¿Desea eliminar este informe del expediente?')) {
                                    storageService.eliminarReporteDeCliente(clienteExpediente.id, rep.id);
                                    refrescarDatos();
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                                title="Eliminar informe"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-slate-500 text-xs">
                        No hay informes guardados aún para este productor. Al generar un informe en la pestaña <strong>Reportes</strong>, utilice el botón <strong>"💾 Guardar en Expediente"</strong>.
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>

            {/* Pie del Expediente */}
            <div className="p-3 bg-slate-100 border-t flex justify-end shrink-0">
              <button
                onClick={() => setClienteExpediente(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Cerrar Expediente
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          SUB-MODAL: AGREGAR FINCA AL EXPEDIENTE
         ======================================================== */}
      {showModalNuevaFinca && clienteExpediente && (
        <div className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-4 space-y-3 animate-slideUp">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-extrabold text-slate-900 text-sm">Agregar Nueva Finca a {clienteExpediente.nombre}</h4>
              <button onClick={() => setShowModalNuevaFinca(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleAgregarFincaAExpediente} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre de la Finca</label>
                <input
                  type="text"
                  required
                  value={nombreNuevaFinca}
                  onChange={(e) => setNombreNuevaFinca(e.target.value)}
                  placeholder="Ej. Finca La Colina / El Prado"
                  className="w-full border border-slate-300 rounded-xl p-2 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ubicación / Cantón</label>
                <input
                  type="text"
                  value={ubicacionNuevaFinca}
                  onChange={(e) => setUbicacionNuevaFinca(e.target.value)}
                  placeholder="Ej. Cascajal de Coronado / Llano Grande"
                  className="w-full border border-slate-300 rounded-xl p-2 font-medium outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Altitud Aproximada (msnm)</label>
                <input
                  type="number"
                  value={altitudNuevaFinca}
                  onChange={(e) => setAltitudNuevaFinca(e.target.value)}
                  placeholder="1680"
                  className="w-full border border-slate-300 rounded-xl p-2 font-medium outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalNuevaFinca(false)}
                  className="px-3 py-1.5 text-slate-600 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Guardar Finca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-MODAL: AGREGAR LOTE A UNA FINCA
         ======================================================== */}
      {fincaParaNuevoLote && (
        <div className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-4 space-y-3 animate-slideUp">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">Agregar Lote a {fincaParaNuevoLote.nombre}</h4>
                <p className="text-[11px] text-slate-500">Cliente: {clienteExpediente?.nombre}</p>
              </div>
              <button onClick={() => setFincaParaNuevoLote(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleAgregarLoteAFinca} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre o Identificador del Lote</label>
                <input
                  type="text"
                  required
                  value={nombreNuevoLote}
                  onChange={(e) => setNombreNuevoLote(e.target.value)}
                  placeholder="Ej. Macrotúnel 3 / Invernadero C / Bloque 2"
                  className="w-full border border-slate-300 rounded-xl p-2 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cultivo</label>
                  <select
                    value={cultivoNuevoLoteId}
                    onChange={(e) => {
                      setCultivoNuevoLoteId(e.target.value);
                      const c = crAgroDatabase.cultivos.find(x => x.id === e.target.value);
                      if (c) setVariedadNuevoLote(c.variedades[0]);
                    }}
                    className="w-full border border-slate-300 rounded-xl p-2 font-bold text-emerald-800 outline-none"
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
                    value={variedadNuevoLote}
                    onChange={(e) => setVariedadNuevoLote(e.target.value)}
                    placeholder="Ej. San Andreas / Spider"
                    className="w-full border border-slate-300 rounded-xl p-2 font-medium outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Área</label>
                  <input
                    type="text"
                    value={areaNuevoLote}
                    onChange={(e) => setAreaNuevoLote(e.target.value)}
                    placeholder="3,000 m2 / 1 Ha"
                    className="w-full border border-slate-300 rounded-xl p-2 font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sustrato / Sistema</label>
                  <input
                    type="text"
                    value={sustratoNuevoLote}
                    onChange={(e) => setSustratoNuevoLote(e.target.value)}
                    placeholder="Suelo / Coco / Macetas"
                    className="w-full border border-slate-300 rounded-xl p-2 font-medium outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFincaParaNuevoLote(null)}
                  className="px-3 py-1.5 text-slate-600 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Guardar Lote
                </button>
              </div>
            </form>
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
                        setVariedadLote(cli.fincas[0].lotes[0].variedad || '');
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

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">2. Finca</label>
                  <select
                    value={selFincaId}
                    onChange={(e) => {
                      setSelFincaId(e.target.value);
                      const f = fincasDisponibles.find(x => x.id === e.target.value);
                      if (f?.lotes?.[0]) {
                        setSelLoteId(f.lotes[0].id);
                        setSelCultivoId(f.lotes[0].cultivoId || 'fresa');
                        setVariedadLote(f.lotes[0].variedad || '');
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none"
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
                    onChange={(e) => {
                      setSelLoteId(e.target.value);
                      const l = lotesDisponibles.find(x => x.id === e.target.value);
                      if (l) {
                        setSelCultivoId(l.cultivoId || 'fresa');
                        setVariedadLote(l.variedad || '');
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none"
                  >
                    {lotesDisponibles.map(l => (
                      <option key={l.id} value={l.id}>{l.nombre} ({l.cultivoNombre})</option>
                    ))}
                  </select>
                </div>
              </div>

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

              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-blue-900 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CloudSun className="w-4 h-4 text-blue-700" /> Captura Geoclimática en Vivo
                </p>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Al iniciar la visita, el sistema tomará la posición GPS de la finca y consultará la lluvia acumulada de los últimos 7 días.
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
          MODAL: REGISTRAR NUEVO CLIENTE INICIAL
         ======================================================== */}
      {showModalNuevoCliente && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-slideUp">
            
            <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Cartera de Productores</span>
                <h3 className="font-bold text-base">Registrar Nuevo Cliente</h3>
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
                <span className="font-bold text-emerald-950 block">Primera Finca y Lote:</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-600 text-[11px] mb-0.5">Nombre de la Finca 1</label>
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
                <p className="text-[10px] text-slate-500 italic">
                  * Luego de registrar al cliente, podrá abrir su Expediente para agregar más fincas y lotes específicos.
                </p>
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


      {/* ========================================================
          MODAL: EDITAR CLIENTE / PRODUCTOR
         ======================================================== */}
      {showModalEditarCliente && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-slideUp">
            <div className="bg-emerald-800 p-4 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Expediente Agrícola</span>
                <h3 className="font-bold text-base">Editar Datos del Productor</h3>
              </div>
              <button 
                onClick={() => setShowModalEditarCliente(false)}
                className="text-emerald-200 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarEdicionCliente} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo del Productor / Empresa</label>
                <input
                  type="text"
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={editTelefono}
                    onChange={(e) => setEditTelefono(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cédula / Identificación</label>
                  <input
                    type="text"
                    value={editCedula}
                    onChange={(e) => setEditCedula(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ubicación / Cantón (CR)</label>
                <input
                  type="text"
                  value={editUbicacion}
                  onChange={(e) => setEditUbicacion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalEditarCliente(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDITAR FINCA
         ======================================================== */}
      {showModalEditarFinca && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-slideUp">
            <div className="bg-emerald-800 p-4 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Propiedad Agrícola</span>
                <h3 className="font-bold text-base">Editar Finca</h3>
              </div>
              <button 
                onClick={() => setShowModalEditarFinca(false)}
                className="text-emerald-200 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarEdicionFinca} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre de la Finca</label>
                <input
                  type="text"
                  required
                  value={editFincaNombre}
                  onChange={(e) => setEditFincaNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ubicación / Dirección</label>
                <input
                  type="text"
                  value={editFincaUbicacion}
                  onChange={(e) => setEditFincaUbicacion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Altitud Aproximada (msnm)</label>
                <input
                  type="number"
                  value={editFincaAltitud}
                  onChange={(e) => setEditFincaAltitud(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalEditarFinca(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow"
                >
                  Actualizar Finca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDITAR LOTE
         ======================================================== */}
      {showModalEditarLote && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-slideUp">
            <div className="bg-emerald-800 p-4 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Sector Productivo</span>
                <h3 className="font-bold text-base">Editar Lote</h3>
              </div>
              <button 
                onClick={() => setShowModalEditarLote(false)}
                className="text-emerald-200 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarEdicionLote} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre o Número de Lote</label>
                <input
                  type="text"
                  required
                  value={editLoteNombre}
                  onChange={(e) => setEditLoteNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cultivo</label>
                  <select
                    value={editLoteCultivoId}
                    onChange={(e) => setEditLoteCultivoId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none"
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
                    value={editLoteVariedad}
                    onChange={(e) => setEditLoteVariedad(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Área</label>
                  <input
                    type="text"
                    value={editLoteArea}
                    onChange={(e) => setEditLoteArea(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sustrato / Sistema</label>
                  <input
                    type="text"
                    value={editLoteSustrato}
                    onChange={(e) => setEditLoteSustrato(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalEditarLote(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow"
                >
                  Actualizar Lote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
