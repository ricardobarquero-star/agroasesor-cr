import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-3xl border-2 border-red-200 shadow-xl p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                Protección Activa de Interfaz
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                Se detectó una interrupción en este módulo
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                La aplicación protegió sus datos y evitó la pantalla en blanco. Puede reiniciar la vista actual o regresar al panel de visitas sin perder información.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="py-3 px-5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reintentar Módulo</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-200 active:scale-95 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Recargar Aplicación</span>
              </button>
            </div>

            {this.state.error && (
              <details className="text-left mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                <summary className="font-semibold text-slate-700 cursor-pointer hover:text-slate-900">
                  Ver detalle técnico del error
                </summary>
                <pre className="mt-2 text-[10px] text-red-700 font-mono whitespace-pre-wrap break-all overflow-x-auto p-2 bg-red-50/50 rounded-lg border border-red-100">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
