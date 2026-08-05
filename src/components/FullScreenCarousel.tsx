import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { SmartImage } from './SmartImage';

interface FullScreenCarouselProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export const FullScreenCarousel: React.FC<FullScreenCarouselProps> = ({ images, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div className="absolute top-4 right-4 text-white p-2 cursor-pointer z-[60] bg-black/50 rounded-full" onClick={(e) => { e.stopPropagation(); onClose(); }}>
        <X className="w-8 h-8" />
      </div>
      
      <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <button className="absolute left-4 text-white p-2 z-[60]" onClick={prev}>
          <ChevronLeft className="w-12 h-12" />
        </button>
        
        <AnimatePresence mode="wait">
          {(() => {
            const currentRaw = images[currentIndex] || '';
            if (!currentRaw) return null;

            return (
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="max-w-[90vw] max-h-[80vh] w-full h-full flex items-center justify-center"
              >
                <SmartImage
                  src={currentRaw}
                  alt="Foto do produto"
                  objectFit="contain"
                  className="max-w-[90vw] max-h-[80vh]"
                  containerClassName="w-full h-full flex items-center justify-center"
                />
              </motion.div>
            );
          })()}
        </AnimatePresence>
        
        <button className="absolute right-4 text-white p-2 z-[60]" onClick={next}>
          <ChevronRight className="w-12 h-12" />
        </button>
        
        <div className="absolute bottom-4 text-white text-lg font-medium">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
};
