import React, { useState, useEffect } from 'react';
import { 
  Users, Camera, Droplet, ShieldCheck, FileText, Settings, 
  MapPin, CloudSun, Sparkles, RefreshCw, Plus, Play, ChevronDown
} from 'lucide-react';
import ClientVisitModule from './components/ClientVisitModule';
import FindingsModule from './components/FindingsModule';
import FertigationModule from './components/FertigationModule';
import PesticideModule from './components/PesticideModule';
import ReportModule from './components/ReportModule';
import AiAssistantModal from './components/AiAssistantModal';
import SettingsModal from './components/SettingsModal';
import SettingsView from './components/SettingsView';
import SfeCatalogModal from './components/SfeCatalogModal';
import { weatherService } from './services/weatherService';
import { storageService } from './services/storageService';
import { crAgroDatabase } from './data/crAgroDatabase';

export default function App() {
  const [activeTab, setActiveTab] = useState('visitas'); // 'visitas', 'hallazgos', 'fertirriego', 'plaguicidas', 'reporte'
  const [visita, setVisita] = useState(() => storageService.getVisitaActiva() || { id: 'v-temp', productor: { nombre: 'Productor' }, finca: { nombre: 'Finca' }, lote: { nombre: 'Lote 1', cultivoId: 'fresa', cultivoNombre: 'Fresa' }, hallazgos: [], recomendacionesFertirriego: [], recomendacionesPlaguicidas: [] });
  const [climaCargando, setClimaCargando] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiModuleContext, setAiModuleContext] = useState('general');
  const [showSettings, setShowSettings] = useState(false);
  const [showSfeModal, setShowSfeModal] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Escuchar estado de conexión de red para modo 100% offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cargar geolocalización y clima al iniciar
  useEffect(() => {
    actualizarGeoclima();
  }, []);

  const actualizarGeoclima = async () => {
    setClimaCargando(true);
    try {
      const gps = await weatherService.obtenerPosicionGPS();
      const climaData = await weatherService.consultarClimaYAcumulado(gps.lat, gps.lon);
      const altitudCalculada = gps.altitud || climaData.altitud || visita?.finca?.gps?.altitud || 1680;
      
      const visitaActualizada = {
        ...visita,
        finca: {
          ...visita.finca,
          gps: {
            ...(visita.finca?.gps || {}),
            ...gps,
            altitud: altitudCalculada
          }
        },
        clima: {
          ...climaData,
          altitud: altitudCalculada
        }
      };
      setVisita(visitaActualizada);
      storageService.guardarVisitaActiva(visitaActualizada);
    } catch (e) {
      console.warn('Error actualizando clima:', e);
    } finally {
      setClimaCargando(false);
    }
  };

  const handleUpdateVisita = (nuevaVisita) => {
    setVisita(nuevaVisita);
    storageService.guardarVisitaActiva(nuevaVisita);
  };

  const handleSelectVisita = (v) => {
    setVisita(v);
    storageService.guardarVisitaActiva(v);
    setActiveTab('hallazgos');
  };

  const handleVisitaIniciada = (nuevaVisita) => {
    setVisita(nuevaVisita);
    setActiveTab('hallazgos'); // Redirigir de inmediato a documentar hallazgos
  };

  const handleOpenAi = (modulo) => {
    setAiModuleContext(modulo);
    setShowAiModal(true);
  };

  const handleCropChange = (cultivoId) => {
    const cultivo = crAgroDatabase.cultivos.find(c => c.id === cultivoId);
    if (!cultivo) return;
    const nueva = {
      ...visita,
      lote: {
        ...visita.lote,
        cultivoId: cultivo.id,
        cultivoNombre: cultivo.nombre,
        variedad: cultivo.variedades[0]
      }
    };
    handleUpdateVisita(nueva);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-emerald-200">
      
      {/* CABECERA PRINCIPAL (Optimizada para iPhone 17 Dynamic Island y Notch) */}
      <header className="bg-emerald-800 text-white border-b border-emerald-900/50 safe-top sticky top-0 z-40 shadow-md">
        <div className="max-w-4xl mx-auto px-3.5 py-2.5 flex items-center justify-between">
          
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setActiveTab('visitas')}
              className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner hover:bg-white/20 transition active:scale-95"
              title="Ir a Visitas y Clientes"
            >
              <span className="text-xl">🌱</span>
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-sm sm:text-base tracking-tight leading-none">AgroAsesor Pro CR</h1>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  Ord. 5896
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold flex items-center gap-1 ${
                  isOnline 
                    ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-400/30' 
                    : 'bg-amber-400 text-slate-900 border border-amber-300 shadow-xs'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-300 animate-pulse' : 'bg-amber-800'}`}></span>
                  <span>{isOnline ? 'Online' : '100% Offline'}</span>
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/90 font-medium">
                Ing. Agr. Ricardo Manuel Barquero • Coronado, CR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Botón rápido "+ Nueva Visita" siempre accesible */}
            <button
              onClick={() => setActiveTab('visitas')}
              className="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black flex items-center gap-1 shadow-sm active:scale-95 transition"
              title="Iniciar Nueva Visita o Ver Clientes"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nueva Visita</span>
            </button>

            <button
              onClick={() => setShowSfeModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 text-emerald-100"
              title="Consultar Registro y Listas Oficiales SFE - MAG"
            >
              <span className="text-amber-300">🏛️</span>
              <span className="hidden sm:inline font-bold">Listas SFE</span>
            </button>

            <button
              onClick={() => handleOpenAi('general')}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
              title="Copiloto IA con Gemini"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span className="hidden md:inline">Copiloto IA</span>
            </button>

            <button
              onClick={() => setActiveTab('configuracion')}
              className={`p-2 rounded-xl border transition active:scale-95 ${
                activeTab === 'configuracion'
                  ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
              }`}
              title="Configuración, Perfil y Seguridad"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* BARRA INFORMATIVA DE GEOCLIMA Y CULTIVO (GPS + Lluvia Acumulada 7 Días) */}
        <div className="bg-emerald-950/80 px-3.5 py-1.5 border-t border-emerald-700/50 text-[11px] text-emerald-100 flex items-center justify-between overflow-x-auto">
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="flex items-center gap-1 text-emerald-300 font-semibold">
              <MapPin className="w-3.5 h-3.5" />
              {visita?.finca?.gps?.lat ? `${visita?.finca?.gps?.lat}, ${visita?.finca?.gps?.lon}` : 'GPS: Coronado'}
            </span>
            <span className="text-emerald-400/60">•</span>
            <span className="font-bold text-amber-200 bg-amber-950/70 px-2 py-0.5 rounded border border-amber-800/50">
              🏔️ {visita?.finca?.gps?.altitud || visita?.clima?.altitud || 1680} msnm
            </span>
            <span className="text-emerald-400/60">•</span>
            <span className="flex items-center gap-1">
              <CloudSun className="w-3.5 h-3.5 text-amber-400" />
              {visita?.clima?.temperaturaActual || 18}°C (HR: {visita?.clima?.humedadActual || 85}%)
            </span>
            <span className="text-emerald-400/60">•</span>
            <span className="font-bold text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/60">
              🌧️ Lluvia 7 días: {visita?.clima?.lluviaAcumulada7Dias || 0} mm
            </span>
          </div>

          <button 
            onClick={actualizarGeoclima}
            disabled={climaCargando}
            className="text-[10px] text-emerald-300 hover:text-white flex items-center gap-1 font-semibold ml-2 shrink-0"
          >
            <RefreshCw className={`w-3 h-3 ${climaCargando ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar Clima</span>
          </button>
        </div>
      </header>

      {/* BARRA DE CLIENTE Y FINCA ACTIVA (Con acceso a cambiar de visita en 1 clic) */}
      <div className="bg-white border-b border-slate-200 px-3.5 py-2 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 overflow-x-auto">
          
          <button 
            onClick={() => setActiveTab('visitas')}
            className="flex items-center gap-1.5 text-xs text-left group hover:opacity-80 transition shrink-0"
            title="Cambiar cliente o finca activa"
          >
            <span className="font-bold text-slate-500">Visita activa:</span>
            <span className="font-extrabold text-slate-900 group-hover:text-emerald-700 underline decoration-emerald-500 underline-offset-2">
              {visita?.productor?.nombre?.split(' ')[0] || 'Cliente'} — {visita?.finca?.nombre || 'Finca'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700" />
          </button>

          <div className="flex items-center gap-2 text-xs shrink-0">
            <span className="text-xs font-bold text-slate-500">Cultivo:</span>
            <select
              value={visita?.lote?.cultivoId || 'fresa'}
              onChange={(e) => handleCropChange(e.target.value)}
              className="bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg px-2 py-0.5 text-xs font-bold text-emerald-800 outline-none"
            >
              {crAgroDatabase.cultivos.map(c => (
                <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>
              ))}
            </select>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600 font-semibold">{visita?.lote?.nombre || 'Lote 1'}</span>
          </div>

        </div>
      </div>

      {/* CONTENIDO PRINCIPAL SEGÚN PESTAÑA */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-4 pb-24">
        {activeTab === 'visitas' && (
          <ClientVisitModule
            visitaActiva={visita}
            onSelectVisita={handleSelectVisita}
            onVisitaIniciada={handleVisitaIniciada}
            onOpenAi={handleOpenAi}
          />
        )}

        {activeTab === 'hallazgos' && (
          <FindingsModule
            visita={visita}
            onUpdateVisita={handleUpdateVisita}
            onOpenAi={handleOpenAi}
          />
        )}

        {activeTab === 'fertirriego' && (
          <FertigationModule
            visita={visita}
            onUpdateVisita={handleUpdateVisita}
            onOpenAi={handleOpenAi}
          />
        )}

        {activeTab === 'plaguicidas' && (
          <PesticideModule
            visita={visita}
            onUpdateVisita={handleUpdateVisita}
            onOpenAi={handleOpenAi}
          />
        )}

        {activeTab === 'reporte' && (
          <ReportModule
            visita={visita}
            onOpenAi={handleOpenAi}
          />
        )}

        {activeTab === 'configuracion' && (
          <SettingsView
            onDataReload={() => setVisita(storageService.getVisitaActiva())}
          />
        )}

        {/* PIE DE PÁGINA CON DERECHOS DE AUTOR */}
        <footer className="mt-8 text-center text-[11px] text-slate-400 no-print pb-2">
          <p className="font-semibold text-slate-600">
            © 2026 <strong>Ricardo Manuel Barquero Chacón</strong> • AgroAsesor Pro CR™
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Colegiado Ordinario No. 5896 • Todos los derechos reservados
          </p>
        </footer>
      </main>

      {/* BARRA DE NAVEGACIÓN INFERIOR (5 Pestañas adaptadas para iPhone 17) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 safe-bottom no-print shadow-lg">
        <div className="max-w-lg mx-auto grid grid-cols-6 px-1 py-1.5">
          
          <button
            onClick={() => setActiveTab('visitas')}
            className={`flex flex-col items-center justify-center py-1 transition-transform active:scale-95 ${activeTab === 'visitas' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <div className={`p-1 rounded-xl transition ${activeTab === 'visitas' ? 'bg-emerald-100' : ''}`}>
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] sm:text-[10px] mt-0.5">Visitas</span>
          </button>

          <button
            onClick={() => setActiveTab('hallazgos')}
            className={`flex flex-col items-center justify-center py-1 transition-transform active:scale-95 ${activeTab === 'hallazgos' ? 'text-amber-700 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <div className={`p-1 rounded-xl transition ${activeTab === 'hallazgos' ? 'bg-amber-100' : ''}`}>
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] sm:text-[10px] mt-0.5">Hallazgos</span>
          </button>

          <button
            onClick={() => setActiveTab('fertirriego')}
            className={`flex flex-col items-center justify-center py-1 transition-transform active:scale-95 ${activeTab === 'fertirriego' ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <div className={`p-1 rounded-xl transition ${activeTab === 'fertirriego' ? 'bg-blue-100' : ''}`}>
              <Droplet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] sm:text-[10px] mt-0.5">Nutrición</span>
          </button>

          <button
            onClick={() => setActiveTab('plaguicidas')}
            className={`flex flex-col items-center justify-center py-1 transition-transform active:scale-95 ${activeTab === 'plaguicidas' ? 'text-purple-700 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <div className={`p-1 rounded-xl transition ${activeTab === 'plaguicidas' ? 'bg-purple-100' : ''}`}>
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] sm:text-[10px] mt-0.5">Sanidad</span>
          </button>

          <button
            onClick={() => setActiveTab('reporte')}
            className={`flex flex-col items-center justify-center py-1 transition-transform active:scale-95 ${activeTab === 'reporte' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <div className={`p-1 rounded-xl transition ${activeTab === 'reporte' ? 'bg-emerald-100' : ''}`}>
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] sm:text-[10px] mt-0.5">Informe</span>
          </button>

          <button
            onClick={() => setActiveTab('configuracion')}
            className={`flex flex-col items-center justify-center py-1 transition-transform active:scale-95 ${activeTab === 'configuracion' ? 'text-slate-900 font-black' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <div className={`p-1 rounded-xl transition ${activeTab === 'configuracion' ? 'bg-slate-200' : ''}`}>
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] sm:text-[10px] mt-0.5">Ajustes</span>
          </button>

        </div>
      </nav>

      {/* MODALES FLOTANTES */}
      <AiAssistantModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        modulo={aiModuleContext}
        contexto={{
          cultivoId: visita?.lote?.cultivoId,
          cultivoNombre: visita.lote?.cultivoNombre,
          variedad: visita.lote?.variedad,
          finca: visita?.finca?.nombre,
          lote: visita?.lote?.nombre,
          clima: visita.clima,
          totalHallazgos: (visita.hallazgos || []).length
        }}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onDataReload={() => setVisita(storageService.getVisitaActiva())}
      />

      <SfeCatalogModal
        isOpen={showSfeModal}
        onClose={() => setShowSfeModal(false)}
        onSelectProduct={(p) => {
          setActiveTab('plaguicidas');
          setShowSfeModal(false);
        }}
      />

    </div>
  );
}
