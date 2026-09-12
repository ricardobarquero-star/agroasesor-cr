/**
 * Servicio de Almacenamiento Persistente en IndexedDB para Fotos de Campo
 * Desarrollado para AgroAsesor Pro CR - Ing. Agr. Ricardo Manuel Barquero Chacón
 * 
 * Resuelve el error QuotaExceededError en Safari/Chrome al almacenar múltiples fotos
 * de alta resolución en teléfonos móviles (iPhone 17, Android) sin límite de 5MB.
 */

const DB_NAME = 'agroasesor_fotos_db';
const DB_VERSION = 1;
const STORE_NAME = 'fotos';

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        resolve(null);
        return;
      }
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => {
        console.warn('Error abriendo IndexedDB para fotos:', request.error);
        resolve(null);
      };
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }
  return dbPromise;
}

export const photoStorageService = {
  /**
   * Comprimir y reducir resolución de imagen a tamaño óptimo para teléfono móvil y reporte
   * @param {string|File|Blob} input - DataURL o Blob de imagen
   * @param {number} maxDimension - Dimensión máxima (ancho o alto) en px (por defecto 1200)
   * @param {number} quality - Calidad de compresión JPEG (0.72 ~80-120KB)
   * @returns {Promise<string>} DataURL comprimido
   */
  async comprimirImagen(input, maxDimension = 1200, quality = 0.72) {
    return new Promise((resolve, reject) => {
      let src = '';
      if (typeof input === 'string') {
        src = input;
      } else if (input instanceof Blob || input instanceof File) {
        src = URL.createObjectURL(input);
      } else {
        return resolve(input);
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (input instanceof Blob || input instanceof File) {
          URL.revokeObjectURL(src);
        }

        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.onerror = (err) => {
        if (input instanceof Blob || input instanceof File) {
          URL.revokeObjectURL(src);
        }
        reject(err);
      };

      img.src = src;
    });
  },

  /**
   * Guardar una foto en IndexedDB
   */
  async guardarFoto(id, dataUrl) {
    try {
      const db = await getDB();
      if (!db) return false;

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put({ id, dataUrl, timestamp: Date.now() });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => {
          console.warn('Error guardando foto en IndexedDB:', tx.error);
          resolve(false);
        };
      });
    } catch (e) {
      console.warn('Excepción en guardarFoto IndexedDB:', e);
      return false;
    }
  },

  /**
   * Obtener una foto de IndexedDB
   */
  async obtenerFoto(id) {
    try {
      const db = await getDB();
      if (!db) return null;

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => {
          resolve(req.result ? req.result.dataUrl : null);
        };
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      console.warn('Excepción en obtenerFoto IndexedDB:', e);
      return null;
    }
  },

  /**
   * Eliminar una foto de IndexedDB
   */
  async eliminarFoto(id) {
    try {
      const db = await getDB();
      if (!db) return false;

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(id);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch (e) {
      return false;
    }
  },

  /**
   * Sincronizar y asegurar fotos de una visita en IndexedDB
   */
  async sincronizarFotosVisita(visita) {
    if (!visita || !visita.hallazgos) return;
    for (const h of visita.hallazgos) {
      if (h.fotoAnotada && h.id) {
        await this.guardarFoto(h.id, h.fotoAnotada);
      }
    }
  }
};
