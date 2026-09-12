import { photoStorageService } from '../services/photoStorageService';
import React, { useRef, useState, useEffect } from 'react';
import { 
  Camera, Upload, Edit3, Circle, ArrowUpRight, Type, 
  Trash2, RotateCcw, Check, X, Tag
} from 'lucide-react';

export default function PhotoAnnotator({ onSavePhoto, onCancel, initialImage = null }) {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [baseImage, setBaseImage] = useState(initialImage);
  const [tool, setTool] = useState('pen'); // 'pen', 'arrow', 'circle', 'number', 'text'
  const [color, setColor] = useState('#ef4444'); // Rojo alerta por defecto
  const [lineWidth, setLineWidth] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [nextNumber, setNextNumber] = useState(1);
  const [annotationText, setAnnotationText] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPos, setTextPos] = useState({ x: 50, y: 50 });

  const colors = [
    { name: 'Rojo Alerta', hex: '#ef4444' },
    { name: 'Amarillo Foco', hex: '#facc15' },
    { name: 'Verde Fértil', hex: '#22c55e' },
    { name: 'Blanco Contraste', hex: '#ffffff' },
    { name: 'Azul Señal', hex: '#38bdf8' }
  ];

  // Cargar imagen en el canvas
  useEffect(() => {
    if (!baseImage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = baseImage;
    img.onload = () => {
      // Ajustar dimensiones del canvas manteniendo relación de aspecto y alta resolución
      const maxWidth = 900;
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setImageLoaded(true);
      saveState();
    };
  }, [baseImage]);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
    const newHistory = history.slice(0, currentStep + 1);
    newHistory.push(dataUrl);
    setHistory(newHistory);
    setCurrentStep(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (currentStep <= 0) return;
    const prevStep = currentStep - 1;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = history[prevStep];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setCurrentStep(prevStep);
    };
  };

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    if (!imageLoaded) return;
    const coords = getCanvasCoords(e);
    setStartPos(coords);
    setIsDrawing(true);

    if (tool === 'number') {
      drawNumberTag(coords.x, coords.y, nextNumber);
      setNextNumber(prev => prev + 1);
      saveState();
      setIsDrawing(false);
      return;
    }

    if (tool === 'text') {
      setTextPos(coords);
      setShowTextInput(true);
      setIsDrawing(false);
      return;
    }

    if (tool === 'pen') {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const draw = (e) => {
    if (!isDrawing || !imageLoaded) return;
    if (tool === 'pen') {
      const coords = getCanvasCoords(e);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (tool === 'circle') {
      const coords = getCanvasCoords(e);
      drawCircle(startPos.x, startPos.y, coords.x, coords.y);
      saveState();
    } else if (tool === 'arrow') {
      const coords = getCanvasCoords(e);
      drawArrow(startPos.x, startPos.y, coords.x, coords.y);
      saveState();
    } else if (tool === 'pen') {
      saveState();
    }
  };

  const drawCircle = (x1, y1, x2, y2) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    ctx.beginPath();
    ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 4;
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const drawArrow = (fromX, fromY, toX, toY) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const headLength = 22;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 4;

    // Línea principal
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Punta de flecha
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const drawNumberTag = (x, y, num) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const radius = 18;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;

    // Círculo de fondo
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Texto del número
    ctx.fillStyle = color === '#ffffff' ? '#0f172a' : '#ffffff';
    ctx.font = 'bold 18px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(num.toString(), x, y);
    ctx.restore();
  };

  const applyText = () => {
    if (!annotationText.trim()) {
      setShowTextInput(false);
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.save();
    ctx.font = 'bold 20px -apple-system, sans-serif';
    const textWidth = ctx.measureText(annotationText).width;

    // Fondo protector semi-transparente para alta legibilidad
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.roundRect(textPos.x - 8, textPos.y - 20, textWidth + 16, 30, 6);
    ctx.fill();

    ctx.fillStyle = color === '#ef4444' ? '#fecaca' : color;
    ctx.fillText(annotationText, textPos.x, textPos.y);
    ctx.restore();

    setAnnotationText('');
    setShowTextInput(false);
    saveState();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // Compresión inmediata en el cliente para evitar agotar memoria y localStorage
      const compressed = await photoStorageService.comprimirImagen(file, 1200, 0.72);
      setBaseImage(compressed);
      setHistory([]);
      setCurrentStep(-1);
      setNextNumber(1);
    } catch (err) {
      console.warn('Compresión fallback:', err);
      const reader = new FileReader();
      reader.onload = (evt) => {
        setBaseImage(evt.target.result);
        setHistory([]);
        setCurrentStep(-1);
        setNextNumber(1);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const finalDataUrl = canvas.toDataURL('image/jpeg', 0.75);
    onSavePhoto(finalDataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col justify-between p-2 sm:p-4 text-white">
      {/* Barra superior de control */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-sm sm:text-base">Anotador Editorial de Campo</h3>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleUndo} 
            disabled={currentStep <= 0}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs flex items-center gap-1"
            title="Deshacer"
          >
            <RotateCcw className="w-4 h-4" /> Deshacer
          </button>
          <button 
            onClick={onCancel}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs"
          >
            <X className="w-4 h-4" />
          </button>
          <button 
            onClick={handleSave} 
            disabled={!imageLoaded}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-900/40"
          >
            <Check className="w-4 h-4" /> Guardar Foto
          </button>
        </div>
      </div>

      {/* Área central del Canvas */}
      <div className="flex-1 flex items-center justify-center overflow-auto my-2 relative">
        {!baseImage ? (
          <div className="text-center p-6 bg-slate-800/80 rounded-2xl border border-dashed border-slate-600 max-w-sm">
            <Camera className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="font-medium text-sm mb-1">Fotografiar o Cargar Hallazgo</p>
            <p className="text-xs text-slate-400 mb-4">Captura síntomas en hojas, flor, fruto, raíz o insectos en campo.</p>
            <div className="flex justify-center gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> Tomar / Subir Foto
              </button>
            </div>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              capture="environment"
              onChange={handleImageUpload} 
              className="hidden" 
            />
          </div>
        ) : (
          <div className="relative border border-slate-700 rounded-xl overflow-hidden shadow-2xl bg-black max-h-full max-w-full">
            <canvas 
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="touch-none cursor-crosshair block max-h-[68vh] w-auto max-w-full object-contain"
            />
          </div>
        )}

        {/* Modal flotante para ingresar texto sobre la foto */}
        {showTextInput && (
          <div className="absolute top-1/3 z-20 bg-slate-800 p-3 rounded-xl border border-slate-600 shadow-2xl w-72">
            <p className="text-xs font-bold text-slate-300 mb-1.5">Texto sobre la imagen:</p>
            <input 
              type="text" 
              value={annotationText}
              onChange={(e) => setAnnotationText(e.target.value)}
              placeholder="Ej. Foco de Botrytis"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white mb-2 focus:ring-1 focus:ring-emerald-500 outline-none"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowTextInput(false)}
                className="px-2.5 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600"
              >
                Cancelar
              </button>
              <button 
                onClick={applyText}
                className="px-3 py-1 text-xs rounded bg-emerald-600 font-bold hover:bg-emerald-500"
              >
                Insertar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Barra inferior de herramientas (Lápiz, Flecha, Círculo, Números, Colores) */}
      {baseImage && (
        <div className="bg-slate-800/90 backdrop-blur rounded-2xl p-2.5 border border-slate-700 safe-bottom">
          <div className="flex items-center justify-between gap-1 flex-wrap">
            {/* Herramientas de dibujo */}
            <div className="flex items-center gap-1 bg-slate-900/70 p-1 rounded-xl">
              <button 
                onClick={() => setTool('pen')}
                className={`p-2 rounded-lg text-xs flex items-center gap-1 ${tool === 'pen' ? 'bg-emerald-600 font-bold text-white' : 'text-slate-400 hover:text-white'}`}
                title="Lápiz libre"
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">Lápiz</span>
              </button>
              <button 
                onClick={() => setTool('arrow')}
                className={`p-2 rounded-lg text-xs flex items-center gap-1 ${tool === 'arrow' ? 'bg-emerald-600 font-bold text-white' : 'text-slate-400 hover:text-white'}`}
                title="Flecha indicadora"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span className="hidden sm:inline">Flecha</span>
              </button>
              <button 
                onClick={() => setTool('circle')}
                className={`p-2 rounded-lg text-xs flex items-center gap-1 ${tool === 'circle' ? 'bg-emerald-600 font-bold text-white' : 'text-slate-400 hover:text-white'}`}
                title="Círculo de daño"
              >
                <Circle className="w-4 h-4" />
                <span className="hidden sm:inline">Círculo</span>
              </button>
              <button 
                onClick={() => setTool('number')}
                className={`p-2 rounded-lg text-xs flex items-center gap-1 ${tool === 'number' ? 'bg-emerald-600 font-bold text-white' : 'text-slate-400 hover:text-white'}`}
                title="Etiqueta numerada [1, 2, 3]"
              >
                <Tag className="w-4 h-4" />
                <span className="hidden sm:inline">Tag #{nextNumber}</span>
              </button>
              <button 
                onClick={() => setTool('text')}
                className={`p-2 rounded-lg text-xs flex items-center gap-1 ${tool === 'text' ? 'bg-emerald-600 font-bold text-white' : 'text-slate-400 hover:text-white'}`}
                title="Texto explicativo"
              >
                <Type className="w-4 h-4" />
                <span className="hidden sm:inline">Texto</span>
              </button>
            </div>

            {/* Selector de color */}
            <div className="flex items-center gap-1.5 px-2">
              {colors.map(c => (
                <button
                  key={c.hex}
                  onClick={() => setColor(c.hex)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c.hex ? 'scale-125 border-white shadow-lg' : 'border-slate-600 opacity-70 hover:opacity-100'}`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>

            {/* Botón cambiar foto */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-slate-400 hover:text-slate-200 underline px-2"
            >
              Cambiar Foto
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              capture="environment"
              onChange={handleImageUpload} 
              className="hidden" 
            />
          </div>
        </div>
      )}
    </div>
  );
}
