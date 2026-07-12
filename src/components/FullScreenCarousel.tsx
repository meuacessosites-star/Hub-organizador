import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

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
        <button className="absolute left-4 text-white p-2" onClick={prev}>
          <ChevronLeft className="w-12 h-12" />
        </button>
        
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={images[currentIndex]}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="max-w-[90vw] max-h-[80vh] object-contain"
          />
        </AnimatePresence>
        
        <button className="absolute right-4 text-white p-2" onClick={next}>
          <ChevronRight className="w-12 h-12" />
        </button>
        
        <div className="absolute bottom-4 text-white text-lg">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
};
