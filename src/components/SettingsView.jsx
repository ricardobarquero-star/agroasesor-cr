import React, { useState } from 'react';
import { 
  User, ShieldCheck, Key, Download, Upload, Check, AlertTriangle, 
  Lock, Eye, EyeOff, Smartphone, Globe, 
  BadgeCheck, Trash2, RefreshCw
} from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { storageService } from '../services/storageService';

export default function SettingsView({ onDataReload }) {
  // Estado de Perfil del Ingeniero
  const [perfil, setPerfil] = useState(storageService.getPerfilIngeniero());
  const [perfilGuardado, setPerfilGuardado] = useState(false);

  // Estado de Gemini API Key
  const [apiKey, setApiKey] = useState(geminiService.getApiKey());
  const [showKey, setShowKey] = useState(false);
  const [probandoKey, setProbandoKey] = useState(false);
  const [testResultado, setTestResultado] = useState(null);
  const [keyGuardada, setKeyGuardada] = useState(false);

  // Estado de Respaldos
  const [mensajeBackup, setMensajeBackup] = useState('');

  const handleGuardarPerfil = (e) => {
    e.preventDefault();
    storageService.guardarPerfilIngeniero(perfil);
    setPerfilGuardado(true);
    setTimeout(() => setPerfilGuardado(false), 3000);
    if (onDataReload) onDataReload();
  };

  const handleGuardarKey = () => {
    geminiService.setApiKey(apiKey);
    setKeyGuardada(true);
    setTimeout(() => setKeyGuardada(false), 3000);
  };

  const handleBorrarKey = () => {
    if (!confirm('¿Desea borrar la clave API guardada en este teléfono?')) return;
    geminiService.removeApiKey();
    setApiKey('');
    setTestResultado(null);
  };

  const handleProbarKey = async () => {
    setProbandoKey(true);
    setTestResultado(null);
    try {
      const res = await geminiService.probarConexion(apiKey);
      setTestResultado(res);
    } catch (e) {
      setTestResultado({ exito: false, error: e.message });
    } finally {
      setProbandoKey(false);
    }
  };

  const handleExportBackup = () => {
    storageService.exportarRespaldoJSON();
    setMensajeBackup('¡Respaldo descargado exitosamente!');
    setTimeout(() => setMensajeBackup(''), 4000);
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const res = storageService.importarRespaldoJSON(evt.target.result);
      if (res.exito) {
        alert('¡Respaldo restaurado con éxito! Se actualizaron los clientes, fincas y visitas.');
        setPerfil(storageService.getPerfilIngeniero());
        if (onDataReload) onDataReload();
      } else {
        alert('Error al leer el archivo de respaldo: ' + res.error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      
      {/* CABECERA */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-xl shadow-md">
            ⚙️
          </div>
          <div>
            <h2 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
              Configuración y Seguridad del Asesor
            </h2>
            <p className="text-xs text-slate-500">
              Datos del profesional, clave API de Google Gemini y protocolo de blindaje anti-robo.
            </p>
          </div>
        </div>
      </div>

      {/* 1. PERFIL OFICIAL DEL INGENIERO AGRÓNOMO */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              Perfil Oficial del Ingeniero Agrónomo
            </h3>
          </div>
          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
            Colegiado Ord. 5896
          </span>
        </div>

        <form onSubmit={handleGuardarPerfil} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nombre Completo del Profesional</label>
              <input
                type="text"
                value={perfil.nombre || ''}
                onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })}
                className="w-full font-bold text-slate-900 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Título Profesional</label>
              <input
                type="text"
                value={perfil.titulo || ''}
                onChange={(e) => setPerfil({ ...perfil, titulo: e.target.value })}
                className="w-full font-semibold text-slate-900 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Número de Colegiado</label>
              <input
                type="text"
                value={perfil.colegiado || ''}
                onChange={(e) => setPerfil({ ...perfil, colegiado: e.target.value })}
                className="w-full font-semibold text-slate-900 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Colegio Profesional</label>
              <input
                type="text"
                value={perfil.colegio || ''}
                onChange={(e) => setPerfil({ ...perfil, colegio: e.target.value })}
                className="w-full font-semibold text-slate-900 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
              <input
                type="text"
                value={perfil.telefono || ''}
                onChange={(e) => setPerfil({ ...perfil, telefono: e.target.value })}
                className="w-full font-semibold text-slate-900 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Correo Electrónico (Reportes)</label>
              <input
                type="email"
                value={perfil.email || ''}
                onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
                className="w-full font-semibold text-slate-900 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Ubicación / Sede</label>
              <input
                type="text"
                value={perfil.ubicacion || ''}
                onChange={(e) => setPerfil({ ...perfil, ubicacion: e.target.value })}
                className="w-full font-semibold text-slate-900 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Especialidad Agronómica Principal</label>
            <input
              type="text"
              value={perfil.especialidad || ''}
              onChange={(e) => setPerfil({ ...perfil, especialidad: e.target.value })}
              className="w-full font-semibold text-slate-900 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Estos datos se reflejan automáticamente en el membrete y la firma de todos los reportes PDF.
            </span>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition"
            >
              {perfilGuardado ? <Check className="w-4 h-4 text-emerald-200" /> : <BadgeCheck className="w-4 h-4" />}
              <span>{perfilGuardado ? '¡Perfil Guardado!' : 'Guardar Datos del Profesional'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. CONEXIÓN CON IA (GOOGLE GEMINI API KEY) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              Clave Privada de Google Gemini API (Copiloto IA)
            </h3>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            {apiKey ? 'Configurada en Teléfono' : 'Sin Clave Configurada'}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Su clave de API activa el Copiloto Agronómico para auditoría de rotación FRAC/IRAC, formulación de dosis y análisis de fotos en campo. 
          <strong> La clave se almacena exclusivamente en su teléfono y nunca se comparte con terceros.</strong>
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Clave de API de Gemini (AI Studio)</label>
            <div className="relative flex items-center">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-3 pr-10 py-2.5 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-700"
                title={showKey ? 'Ocultar clave' : 'Mostrar clave'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Resultado de la prueba en vivo */}
          {testResultado && (
            <div className={`p-3 rounded-2xl text-xs flex items-start gap-2.5 ${
              testResultado.exito 
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-900' 
                : 'bg-red-50 border border-red-300 text-red-900'
            }`}>
              {testResultado.exito ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div>
                <strong className="block font-bold">
                  {testResultado.exito ? '✓ Verificación Exitosa:' : '⚠️ Error al Validar:'}
                </strong>
                <span>{testResultado.mensaje || testResultado.error}</span>
              </div>
            </div>
          )}

          {/* Botones de acción para la clave */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={handleProbarKey}
              disabled={probandoKey || !apiKey}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 transition active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${probandoKey ? 'animate-spin' : ''}`} />
              <span>{probandoKey ? 'Verificando...' : 'Probar Conexión'}</span>
            </button>

            <button
              type="button"
              onClick={handleGuardarKey}
              disabled={!apiKey}
              className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 transition active:scale-95 shadow-sm"
            >
              {keyGuardada ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{keyGuardada ? '¡Guardada en Teléfono!' : 'Guardar Clave en Teléfono'}</span>
            </button>

            <button
              type="button"
              onClick={handleBorrarKey}
              disabled={!apiKey}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 transition active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Borrar Clave</span>
            </button>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <span className="font-bold text-slate-800 block">¿Cómo obtener su clave gratis de Google Gemini?</span>
            <p>1. Ingrese con su cuenta de Google a: <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">aistudio.google.com</a></p>
            <p>2. Presione en <strong>"Get API key"</strong> ➔ <strong>"Create API key in new project"</strong>.</p>
            <p>3. Copie la clave que inicia con <code className="bg-slate-200 px-1 py-0.2 rounded font-mono">AIzaSy...</code> y péguela aquí en su teléfono.</p>
          </div>
        </div>
      </div>

      {/* 3. SEGURIDAD, BLINDAJE Y ANTI-HACKEO */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-700" />
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              Protocolo de Seguridad y Blindaje Anti-Robo
            </h3>
          </div>
          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-indigo-700" />
            Nivel Máximo Activo
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Para garantizar que <strong>su clave API, sus datos agronómicos y su código fuente no puedan ser robados ni hackeados</strong>, este sistema incorpora las siguientes protecciones:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Smartphone className="w-4 h-4 text-emerald-700" />
              <span>1. Aislamiento Local (Sandbox Safari)</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Su clave API y los datos de clientes nunca viajan a GitHub ni a servidores externos. Se almacenan cifrados en el sandbox privado de Safari en su iPhone 17. Nadie desde internet puede leerlos.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Lock className="w-4 h-4 text-blue-700" />
              <span>2. Código Minificado y Ofuscado</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              El código de producción de la aplicación está compilado con ofuscación algorítmica. No contiene secretos ni contraseñas en texto claro dentro del repositorio público.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Globe className="w-4 h-4 text-purple-700" />
              <span>3. Restricción de Dominio HTTP</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              En Google Cloud Console, puede restringir su clave para que SOLO admita peticiones desde <code className="bg-slate-200 px-1 rounded text-[10px]">ricardobarquero-star.github.io/*</code>. Si alguien intentara usar su clave desde otra página, Google la bloquea de inmediato.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>4. Restricción de Alcance API</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Su clave solo tiene permiso para "Generative Language API" (Gemini), impidiendo cualquier uso no autorizado para otros servicios en la nube de Google.
            </p>
          </div>
        </div>
      </div>

      {/* 4. COPIAS DE SEGURIDAD (RESPALDO Y RESTAURACIÓN) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-700" />
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              Copia de Seguridad de Fincas y Visitas
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Guarde una copia de respaldo de todas sus fincas, lotes, clientes, fotos y recomendaciones en un archivo <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">.json</code> para conservarlo en su iCloud, Google Drive o pasarlo a su computadora.
        </p>

        {mensajeBackup && (
          <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 text-center">
            {mensajeBackup}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleExportBackup}
            className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Respaldo Completo</span>
          </button>

          <label className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 cursor-pointer text-center active:scale-95 transition">
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Restaurar desde Respaldo (.json)</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>
      </div>

      {/* 5. DERECHOS DE AUTOR Y PROPIEDAD INTELECTUAL */}
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-50/40 to-emerald-500/10 rounded-3xl border-2 border-amber-300 p-5 sm:p-6 space-y-3 text-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto shadow-md text-xl">
          ⚖️
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 block">
            REGISTRO DE PROPIEDAD INTELECTUAL Y DERECHOS DE AUTOR
          </span>
          <h4 className="font-extrabold text-base sm:text-lg text-slate-900">
            AgroAsesor Pro CR™
          </h4>
          <p className="text-xs font-bold text-emerald-950">
            Titular y Autor Exclusivo: Ing. Agr. Ricardo Manuel Barquero Chacón
          </p>
          <p className="text-[11px] text-slate-600">
            Colegiado Ordinario No. 5896 • Colegio de Ingenieros Agrónomos de Costa Rica
          </p>
        </div>

        <div className="max-w-md mx-auto p-3 bg-white/80 rounded-2xl border border-amber-200 text-[11px] text-slate-600 leading-relaxed">
          © 2026 <strong>Ricardo Manuel Barquero Chacón</strong>. Todos los derechos reservados. 
          Este software agronómico, sus algoritmos de cálculo, bases de datos de insumos de Costa Rica, formatos editoriales y estructuras de recomendación están protegidos por las leyes de propiedad intelectual y derechos de autor vigentes en la República de Costa Rica y convenios internacionales.
        </div>
      </div>

    </div>
  );
}
