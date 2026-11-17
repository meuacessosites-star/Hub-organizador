import React, { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export const ScrollButtons: React.FC = () => {
  const [showUp, setShowUp] = useState(false);
  const [showDown, setShowDown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      // Show Up button if scrolled down more than 200px
      setShowUp(scrollTop > 200);

      // Show Down button if not at the bottom (buffer of 100px) and there's enough content to scroll
      setShowDown(scrollHeight > clientHeight + 100 && (scrollHeight - scrollTop - clientHeight > 100));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    
    // Initial check
    handleScroll();
    
    // Set up a resize observer on body to handle dynamic content height changes
    const resizeObserver = new ResizeObserver(() => {
      handleScroll();
    });
    resizeObserver.observe(document.body);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      resizeObserver.disconnect();
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] right-5 flex flex-col gap-3 z-40 pointer-events-none">
      <AnimatePresence>
        {showUp && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={scrollToTop}
            className="p-3 bg-white dark:bg-[#1a1b26] text-neutral-600 dark:text-neutral-300 rounded-full shadow-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-[#232536] transition-colors cursor-pointer pointer-events-auto"
            aria-label="Voltar ao topo"
            title="Voltar ao topo"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDown && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            onClick={scrollToBottom}
            className="p-3 bg-white dark:bg-[#1a1b26] text-neutral-600 dark:text-neutral-300 rounded-full shadow-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-[#232536] transition-colors cursor-pointer pointer-events-auto"
            aria-label="Ir para o final"
            title="Ir para o final"
          >
            <ArrowDown className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
