import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, Search, Filter, X, Check, Copy, ExternalLink, 
  Sparkles, Layers, AlertCircle, Info, ChevronRight, BookmarkCheck,
  CheckCircle2
} from 'lucide-react';
import { storageService } from '../services/storageService';

export default function SfeCatalogModal({ isOpen, onClose, onSelectProduct, tipoMezclaContexto = null }) {
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('todos');
  const [vistaModo, setVistaModo] = useState('tarjetas'); // 'tarjetas' o 'tabla'
  const [productoCopiadoId, setProductoCopiadoId] = useState(null);

  const todosProductos = useMemo(() => {
    return storageService.getTodosLosPlaguicidas();
  }, []);

  const categorias = [
    { id: 'todos', label: 'Todos SFE', icon: '🏛️' },
    { id: 'fungicida', label: 'Fungicidas', icon: '🍄' },
    { id: 'insecticida', label: 'Insecticidas / Acaricidas', icon: '🐛' },
    { id: 'bactericida', label: 'Bactericidas', icon: '🧫' },
    { id: 'biologico', label: 'Biológicos / Microbianos', icon: '🌿' },
    { id: 'coadyuvante', label: 'Coadyuvantes', icon: '💧' },
    { id: 'foliar', label: 'Foliares / Nutrición', icon: '🍃' }
  ];

  // Filtrar productos
  const productosFiltrados = useMemo(() => {
    return todosProductos.filter(p => {
      const q = terminoBusqueda.toLowerCase().trim();
      const nombre = (p.nombreComercial || '').toLowerCase();
      const reg = (p.registroSfe || p.registroSFE || '').toLowerCase();
      const ia = (p.ingredienteActivo || '').toLowerCase();
      const cat = (p.categoria || '').toLowerCase();
      const sub = (p.subcategoria || '').toLowerCase();
      const codigo = (p.codigoFracIrac || '').toLowerCase();
      const blanco = (p.blancoBiologico || '').toLowerCase();
      const casa = (p.casaComercial || '').toLowerCase();

      // Filtro de texto
      const coincideTexto = !q || (
        nombre.includes(q) ||
        reg.includes(q) ||
        ia.includes(q) ||
        cat.includes(q) ||
        sub.includes(q) ||
        codigo.includes(q) ||
        blanco.includes(q) ||
        casa.includes(q)
      );

      if (!coincideTexto) return false;

      // Filtro de categoría
      if (categoriaActiva === 'todos') return true;
      if (categoriaActiva === 'fungicida') return cat.includes('fungicida');
      if (categoriaActiva === 'insecticida') return cat.includes('insecticida') || cat.includes('acaricida');
      if (categoriaActiva === 'bactericida') return cat.includes('bactericida');
      if (categoriaActiva === 'biologico') return cat.includes('biológico') || cat.includes('organico') || cat.includes('bio');
      if (categoriaActiva === 'coadyuvante') return cat.includes('coadyuvante') || cat.includes('acondicionador');
      if (categoriaActiva === 'foliar') return cat.includes('foliar') || cat.includes('nutrición') || cat.includes('bioestimulante') || cat.includes('enmienda');

      return true;
    });
  }, [todosProductos, terminoBusqueda, categoriaActiva]);

  // Manejar copia de datos al portapapeles
  const handleCopiarFicha = (p) => {
    const texto = `[${p.registroSfe || 'Registro Oficial SFE'}] ${p.nombreComercial}\n` +
      `Categoría: ${p.categoria} (${p.codigoFracIrac || 'N/A'})\n` +
      `Ingrediente Activo: ${p.ingredienteActivo || 'N/A'}\n` +
      `Dosis Oficial SFE: ${p.dosisEstandar || 'Consultar etiqueta'}\n` +
      `Casa Comercial: ${p.casaComercial || 'Costa Rica'}\n` +
      `Blanco Biológico: ${p.blancoBiologico || 'N/A'}\n` +
      `Período de Carencia: ${p.periodoCarencia || 'N/A'}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(texto);
      setProductoCopiadoId(p.id);
      setTimeout(() => setProductoCopiadoId(null), 2500);
    }
  };

  const getBadgeColor = (categoria = '') => {
    const c = categoria.toLowerCase();
    if (c.includes('fungicida')) return 'bg-amber-100 text-amber-900 border-amber-300';
    if (c.includes('insecticida') || c.includes('acaricida')) return 'bg-purple-100 text-purple-900 border-purple-300';
    if (c.includes('bactericida')) return 'bg-rose-100 text-rose-900 border-rose-300';
    if (c.includes('biológico') || c.includes('orgánico')) return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    if (c.includes('coadyuvante') || c.includes('acondicionador')) return 'bg-cyan-100 text-cyan-900 border-cyan-300';
    if (c.includes('foliar')) return 'bg-blue-100 text-blue-900 border-blue-300';
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* CABECERA OFICIAL SFE - MAG */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-emerald-700/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl shadow-inner shrink-0">
              🏛️
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-black text-base sm:text-lg tracking-tight">
                  Registro Oficial de Plaguicidas SFE - MAG Costa Rica
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] tracking-wide uppercase">
                  Ley No. 8702
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold">
                  {todosProductos.length} Productos Oficiales
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Servicio Fitosanitario del Estado • Ministerio de Agricultura y Ganadería • Registro Fitosanitario Nacional 2026
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95 shrink-0 ml-2"
            title="Cerrar catálogo SFE"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BARRA DE BÚSQUEDA Y FILTROS */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Buscador en vivo */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={terminoBusqueda}
                onChange={(e) => setTerminoBusqueda(e.target.value)}
                placeholder="Buscar por nombre comercial, No. Reg. SFE, ingrediente activo, FRAC/IRAC, plaga..."
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-xs"
              />
              {terminoBusqueda && (
                <button
                  onClick={() => setTerminoBusqueda('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Alternador de vista */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setVistaModo('tarjetas')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  vistaModo === 'tarjetas'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Fichas
              </button>
              <button
                type="button"
                onClick={() => setVistaModo('tabla')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  vistaModo === 'tabla'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Tabla
              </button>
            </div>
          </div>

          {/* Botones de Categorías */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categorias.map(cat => {
              const activa = categoriaActiva === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoriaActiva(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition active:scale-95 ${
                    activa
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1">
            <span>
              Mostrando <strong className="text-slate-800">{productosFiltrados.length}</strong> de {todosProductos.length} agroquímicos registrados en SFE
            </span>
            {onSelectProduct && (
              <span className="text-purple-700 font-extrabold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Toque [+ Usar] para transferir producto a la recomendación
              </span>
            )}
          </div>
        </div>

        {/* LISTADO DE RESULTADOS */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 bg-slate-100/60">
          {productosFiltrados.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl">
                🔍
              </div>
              <h3 className="font-bold text-slate-800 text-sm">No se encontraron productos en el registro SFE con ese criterio</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Pruebe buscando por ingrediente activo (ej. <em>Boscalid</em>, <em>Abamectina</em>, <em>Cobre</em>) o por código de registro SFE.
              </p>
              <button
                onClick={() => { setTerminoBusqueda(''); setCategoriaActiva('todos'); }}
                className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                Limpiar Búsqueda y Ver Todos
              </button>
            </div>
          ) : vistaModo === 'tarjetas' ? (
            // VISTA TARJETAS COMPLETAS
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {productosFiltrados.map((p) => (
                <div 
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {/* Encabezado de la tarjeta */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black tracking-wider flex items-center gap-1">
                            <span>🏛️</span>
                            <span>{p.registroSfe || p.registroSFE || 'Reg. SFE - MAG'}</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${getBadgeColor(p.categoria)}`}>
                            {p.categoria}
                          </span>
                          {p.codigoFracIrac && (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 border border-indigo-300 text-[10px] font-extrabold">
                              {p.codigoFracIrac}
                            </span>
                          )}
                        </div>
                        <h3 className="font-black text-slate-900 text-sm sm:text-base mt-1.5 leading-tight">
                          {p.nombreComercial}
                        </h3>
                        <p className="text-xs text-slate-600 font-semibold mt-0.5">
                          {p.ingredienteActivo || 'Ingrediente activo no especificado'}
                        </p>
                      </div>

                      <span className="text-[11px] font-bold text-slate-400 shrink-0 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                        {p.casaComercial || 'Distribuidor CR'}
                      </span>
                    </div>

                    {/* Dosis y Modo de Acción */}
                    <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800">
                          Dosis Autorizada SFE:
                        </span>
                        <strong className="text-slate-900 font-black text-xs">
                          {p.dosisEstandar || 'Consultar etiqueta aprobada'}
                        </strong>
                      </div>
                      {p.modoAccion && (
                        <p className="text-[11px] text-slate-600 leading-snug border-t border-emerald-200/60 pt-1 mt-1">
                          <strong className="text-emerald-950 font-bold">Mecanismo:</strong> {p.modoAccion}
                        </p>
                      )}
                    </div>

                    {/* Blanco biológico y cultivos */}
                    <div className="text-xs space-y-1 text-slate-600">
                      {p.blancoBiologico && (
                        <p className="text-[11px] leading-relaxed">
                          <strong className="text-slate-800 font-bold">🎯 Blanco Biológico:</strong> {p.blancoBiologico}
                        </p>
                      )}
                      {p.cultivosRecomendados && (
                        <p className="text-[11px] text-slate-500">
                          <strong className="text-slate-700 font-semibold">🌱 Cultivos Registrados:</strong> {p.cultivosRecomendados}
                        </p>
                      )}
                    </div>

                    {/* Intervalos de seguridad */}
                    {(p.periodoCarencia || p.periodoReingreso) && (
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        {p.periodoCarencia && (
                          <span>⏱️ Carencia: <strong className="text-slate-700 font-bold">{p.periodoCarencia}</strong></span>
                        )}
                        {p.periodoReingreso && (
                          <span>🚪 Reingreso: <strong className="text-slate-700 font-bold">{p.periodoReingreso}</strong></span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopiarFicha(p)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition active:scale-95"
                      title="Copiar datos del producto"
                    >
                      {productoCopiadoId === p.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copiar Ficha</span>
                        </>
                      )}
                    </button>

                    {onSelectProduct && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProduct(p);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition active:scale-95"
                      >
                        <span>+ Usar en Mezcla</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // VISTA TABLA OFICIAL SFE
            <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-emerald-950 text-white font-bold border-b border-emerald-900">
                    <th className="py-2.5 px-3">No. Registro SFE</th>
                    <th className="py-2.5 px-3">Nombre Comercial</th>
                    <th className="py-2.5 px-3">Categoría</th>
                    <th className="py-2.5 px-3">FRAC / IRAC</th>
                    <th className="py-2.5 px-3">Ingrediente Activo</th>
                    <th className="py-2.5 px-3">Dosis Oficial SFE</th>
                    <th className="py-2.5 px-3">Casa Comercial</th>
                    {onSelectProduct && <th className="py-2.5 px-3 text-right">Acción</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {productosFiltrados.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-extrabold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                          {p.registroSfe || p.registroSFE || 'Reg. SFE'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-black text-slate-900 whitespace-nowrap">
                        {p.nombreComercial}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getBadgeColor(p.categoria)}`}>
                          {p.categoria}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-extrabold text-indigo-700 whitespace-nowrap">
                        {p.codigoFracIrac || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={p.ingredienteActivo}>
                        {p.ingredienteActivo || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 font-extrabold text-slate-900 whitespace-nowrap bg-emerald-50/50">
                        {p.dosisEstandar || 'Etiqueta'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                        {p.casaComercial || 'CR'}
                      </td>
                      {onSelectProduct && (
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectProduct(p);
                              onClose();
                            }}
                            className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-[11px] font-bold transition active:scale-95"
                          >
                            + Usar
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PIE DEL MODAL CON AVISO LEGAL MAG */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Catálogo oficial conforme a las directrices del <strong>Servicio Fitosanitario del Estado (SFE - MAG Costa Rica)</strong>.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
