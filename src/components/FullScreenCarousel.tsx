import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { SmartImage } from './SmartImage';

interface FullScreenCarouselProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

/** Exibe capturas em tamanho legível, com rolagem nos dois eixos quando ampliadas. */
export const FullScreenCarousel: React.FC<FullScreenCarouselProps> = ({ images, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomed(false);
    setCurrentIndex(prev => (prev + 1) % images.length);
  };
  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomed(false);
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  };

  const currentRaw = images[currentIndex] || '';

  return (
    <div role="dialog" aria-modal="true" aria-label="Visualizar imagens da compra"
      className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-sm"
      onClick={onClose}>
      <div className="absolute top-4 right-4 z-[140] flex items-center gap-2">
        <button type="button" onClick={e => { e.stopPropagation(); setZoomed(value => !value); }}
          aria-label={zoomed ? 'Reduzir imagem' : 'Ampliar imagem'}
          title={zoomed ? 'Ajustar à tela' : 'Ampliar para ler'}
          className="flex items-center gap-1.5 bg-black/75 border border-white/20 text-white px-3 py-2 rounded-xl text-xs font-bold">
          {zoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          <span>{zoomed ? 'Ajustar' : 'Ampliar'}</span>
        </button>
        <button type="button" onClick={e => { e.stopPropagation(); onClose(); }}
          aria-label="Fechar imagem" className="rounded-xl bg-black/75 p-2 text-white border border-white/20">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="absolute inset-0 pt-16 pb-20" onClick={e => e.stopPropagation()}>
        <AnimatePresence mode="wait">
          {currentRaw && (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.16 }}
              className="w-full h-full"
            >
              {zoomed ? (
                <div className="w-full h-full overflow-auto overscroll-contain touch-pan-x touch-pan-y" aria-label="Imagem ampliada, arraste para ler">
                  <div className="min-w-full min-h-full w-max flex items-start justify-center p-5">
                    <img src={currentRaw} alt="Imagem ampliada da compra"
                      className="block h-auto max-w-none object-contain rounded-sm"
                      style={{ width: 'max(160vw, 550px)' }} />
                  </div>
                </div>
              ) : (
                <SmartImage src={currentRaw} alt="Foto da compra" objectFit="contain"
                  containerClassName="w-full h-full flex items-center justify-center p-3"
                  className="max-w-full max-h-full w-auto h-auto object-contain" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {images.length > 1 && (
        <>
          <button type="button" onClick={prev} aria-label="Imagem anterior"
            className="absolute bottom-5 left-4 z-[140] rounded-full bg-black/80 border border-white/20 text-white p-2.5">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button type="button" onClick={next} aria-label="Próxima imagem"
            className="absolute bottom-5 right-4 z-[140] rounded-full bg-black/80 border border-white/20 text-white p-2.5">
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[140] text-white text-xs font-semibold bg-black/70 rounded-full px-3 py-1.5 pointer-events-none">
        {currentIndex + 1} / {images.length}{zoomed ? ' · Arraste para ler' : ''}
      </div>
    </div>
  );
};
