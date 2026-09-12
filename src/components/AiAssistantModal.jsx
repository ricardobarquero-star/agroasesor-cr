import React, { useState } from 'react';
import { Sparkles, Bot, X, Send, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { geminiService } from '../services/geminiService';

export default function AiAssistantModal({ isOpen, onClose, modulo, contexto }) {
  const [consulta, setConsulta] = useState('');
  const [cargando, setCargando] = useState(false);
  const [respuesta, setRespuesta] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const ejecutarConsulta = async (promptPersonalizado = '') => {
    setCargando(true);
    setErrorMsg(null);
    try {
      const res = await geminiService.consultarAsistente({
        modulo,
        contexto,
        promptUsuario: promptPersonalizado || consulta
      });

      if (res.exito) {
        setRespuesta(res.texto);
      } else {
        if (res.error) setErrorMsg(res.error);
        if (res.sugerencias) setRespuesta(res.sugerencias);
      }
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setCargando(false);
    }
  };

  const getPillsRapidos = () => {
    if (modulo === 'clima' || modulo === 'general') {
      return [
        'Evaluar riesgo de Botrytis y Tizón según lluvia acumulada',
        'Medidas preventivas inmediatas para invernadero / túnel',
        '¿Ajustar el riego ante 50+ mm de precipitación?'
      ];
    }
    if (modulo === 'hallazgos') {
      return [
        'Diagnóstico diferencial de la foto y síntomas',
        '¿Qué hongo o bacteria cuadra con estos daños en fresa/flores?',
        'Opciones de choque con marcas disponibles en Costa Rica'
      ];
    }
    if (modulo === 'fertirriego') {
      return [
        'Auditar separación Tanque A y Tanque B (incompatibilidad Ca)',
        'Calcular CE objetivo y balance K/Ca para floración',
        'Sugerir receta drench para estimular raíces nuevas'
      ];
    }
    if (modulo === 'plaguicidas') {
      return [
        'Verificar rotación FRAC para evitar resistencia',
        'Auditar rotación IRAC en trips y mosca blanca',
        'Revisar orden de mezcla para no causar fitotoxicidad'
      ];
    }
    return [
      'Revisar coherencia general del informe',
      'Traducir recomendaciones a lenguaje claro para el productor',
      'Verificar tiempos de carencia antes de cosecha'
    ];
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Cabecera del Copiloto */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur">
              <Bot className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm sm:text-base leading-tight">Asistente Virtual Agronómico</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  {geminiService.getModel()}
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/90">
                Contextualizado: {modulo.toUpperCase()} • Cultivo: {contexto?.cultivoNombre || 'General'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recordatorio Inquebrantable de Autoridad Profesional */}
        <div className="bg-amber-50 px-3.5 py-2 border-b border-amber-200 flex items-center gap-2 text-amber-900 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="font-medium leading-snug">
            <strong className="font-bold">Regla Profesional:</strong> La sugerencia de la IA es de apoyo técnico. <strong>LA ÚLTIMA DECISIÓN LA TOMA EL ING. RICARDO BARQUERO</strong>.
          </p>
        </div>

        {/* Cuerpo de Respuestas y Conversación */}
        <div className="p-4 overflow-y-auto flex-1 text-sm space-y-3">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs">
              <p className="font-bold mb-0.5">Nota de conexión:</p>
              <p>{errorMsg}</p>
            </div>
          )}

          {/* Sugerencias predeterminadas si no hay respuesta aún */}
          {!respuesta && !cargando && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Consultas rápidas para este módulo:
              </p>
              <div className="flex flex-col gap-1.5">
                {getPillsRapidos().map((pill, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setConsulta(pill);
                      ejecutarConsulta(pill);
                    }}
                    className="text-left text-xs p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-700 transition flex items-center justify-between group"
                  >
                    <span>{pill}</span>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 opacity-0 group-hover:opacity-100 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {cargando && (
            <div className="py-8 text-center text-slate-500 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
              <p className="text-xs font-medium">Analizando datos de la visita y catálogo de Costa Rica...</p>
            </div>
          )}

          {respuesta && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-slate-800 leading-relaxed text-xs sm:text-sm whitespace-pre-line shadow-inner">
              {respuesta}
            </div>
          )}
        </div>

        {/* Input de consulta personalizada */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 safe-bottom">
          <div className="flex items-center gap-2">
            <input 
              type="text"
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && ejecutarConsulta()}
              placeholder="Escribir consulta agronómica específica..."
              className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={() => ejecutarConsulta()}
              disabled={cargando}
              className="p-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white disabled:opacity-50 shadow"
              title="Consultar"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
