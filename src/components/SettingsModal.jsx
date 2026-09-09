import React, { useState } from 'react';
import { Settings, Key, ShieldCheck, Download, Upload, User, Phone, MapPin, X, Check } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { storageService } from '../services/storageService';

export default function SettingsModal({ isOpen, onClose, onDataReload }) {
  const [apiKey, setApiKey] = useState(geminiService.getApiKey());
  const [guardadoExito, setGuardadoExito] = useState(false);

  if (!isOpen) return null;

  const handleSaveKey = () => {
    geminiService.setApiKey(apiKey);
    setGuardadoExito(true);
    setTimeout(() => setGuardadoExito(false), 2500);
  };

  const handleExportBackup = () => {
    storageService.exportarRespaldoJSON();
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const res = storageService.importarRespaldoJSON(evt.target.result);
      if (res.exito) {
        alert('Respaldo restaurado con éxito.');
        if (onDataReload) onDataReload();
      } else {
        alert('Error al leer el archivo de respaldo: ' + res.error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Cabecera */}
        <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Ajustes del Sistema y Perfil</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs sm:text-sm">
          
          {/* Perfil del Asesor */}
          <div className="bg-emerald-50 rounded-2xl p-3.5 border border-emerald-200 space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-bold">
              <User className="w-4 h-4 text-emerald-700" />
              <span>Perfil Oficial del Consultor</span>
            </div>
            <div className="text-slate-700 text-xs space-y-1 pl-6">
              <p className="font-bold text-slate-900 text-sm">Ing. Agr. Ricardo Barquero Chacón</p>
              <p className="text-emerald-800 font-semibold">Colegio de Ingenieros Agrónomos: Colegiado Ord. 5896</p>
              <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-500" /> +506 8894-5662</p>
              <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-500" /> Vázquez de Coronado, San José, Costa Rica</p>
              <p className="text-slate-500">Correo de reportes: <strong>h7coordinador@gmail.com</strong></p>
            </div>
          </div>

          {/* Configuración Gemini API Key */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Key className="w-4 h-4 text-amber-600" />
              <span>Conexión con Asistente Virtual (Gemini API Key)</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ingrese su clave de API de Google Gemini para habilitar el análisis de fotos con IA, diagnóstico de problemas y sugerencias de rotación FRAC/IRAC en tiempo real.
            </p>
            <div className="space-y-2">
              <input 
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button
                onClick={handleSaveKey}
                className="w-full py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
              >
                {guardadoExito ? <Check className="w-4 h-4 text-emerald-200" /> : <ShieldCheck className="w-4 h-4" />}
                {guardadoExito ? '¡Clave guardada exitosamente en el teléfono!' : 'Guardar Clave en el Dispositivo'}
              </button>
            </div>
          </div>

          {/* Gestión de Respaldo y Datos en el Teléfono */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Download className="w-4 h-4 text-blue-600" />
              <span>Respaldo de Visitas (Etapa Piloto en iPhone)</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Toda la información se guarda de forma segura en la memoria de su teléfono. Puede descargar un respaldo en formato JSON para guardarlo en su Google Drive o transferirlo a su computadora.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleExportBackup}
                className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <Download className="w-4 h-4" /> Exportar Respaldo
              </button>
              <label className="py-2.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer text-center">
                <Upload className="w-4 h-4" /> Importar Respaldo
                <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              </label>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 text-center safe-bottom">
          <button 
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
          >
            Cerrar Ajustes
          </button>
        </div>

      </div>
    </div>
  );
}
