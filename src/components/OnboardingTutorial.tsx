import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Check, Sparkles, LayoutGrid, Plus, Search, Settings2, ShoppingBag } from 'lucide-react';

interface TutorialStep {
  targetId: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const steps: TutorialStep[] = [
  {
    targetId: 'welcome',
    title: 'Bem-vindo ao Hub Organizador!',
    description: 'Este tutorial vai te mostrar como organizar suas contas de streaming, jogos e serviços de forma simples e elegante.',
    icon: <Sparkles className="w-6 h-6 text-amber-500" />,
    position: 'center'
  },
  {
    targetId: 'add-platform-btn',
    title: 'Cadastre suas Plataformas',
    description: 'Aqui você adiciona novos serviços como Netflix, Spotify ou Steam. O Hub busca o logo automaticamente para você!',
    icon: <Plus className="w-5 h-5 text-indigo-500" />,
    position: 'bottom'
  },
  {
    targetId: 'category-btn-all',
    title: 'Organize por Categorias',
    description: 'Filtre suas plataformas por categorias como Streaming, Jogos ou Trabalho para encontrar o que precisa rapidamente.',
    icon: <LayoutGrid className="w-5 h-5 text-emerald-500" />,
    position: 'right'
  },
  {
    targetId: 'search-input-container',
    title: 'Busca Inteligente',
    description: 'Pesquise por nome da plataforma, usuário ou até mesmo por produtos comprados. Use ⌘K para focar rapidamente.',
    icon: <Search className="w-5 h-5 text-sky-500" />,
    position: 'bottom'
  },
  {
    targetId: 'view-selector-platforms',
    title: 'Plataformas vs Compras',
    description: 'Alterne entre a visualização de suas contas e o painel de compras para ver o histórico de gastos de cada serviço.',
    icon: <ShoppingBag className="w-5 h-5 text-pink-500" />,
    position: 'bottom'
  },
  {
    targetId: 'sidebar-manage-status-btn',
    title: 'Status e Categorias',
    description: 'Personalize o seu Hub! Crie novos status de acesso ou mude as categorias para deixar o app com a sua cara.',
    icon: <Settings2 className="w-5 h-5 text-orange-500" />,
    position: 'right'
  },
  {
    targetId: 'tutorial-final',
    title: 'Tudo Pronto!',
    description: 'Agora você já sabe o básico. Comece adicionando sua primeira plataforma e aproveite a organização!',
    icon: <Check className="w-6 h-6 text-green-500" />,
    position: 'center'
  }
];

export const OnboardingTutorial: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<React.CSSProperties>({});

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hub_onboarding_seen');
    if (!hasSeenTutorial) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (currentStep >= 0 && currentStep < steps.length) {
      const step = steps[currentStep];
      if (step.targetId !== 'welcome' && step.targetId !== 'tutorial-final') {
        const element = document.getElementById(step.targetId);
        if (element) {
          const rect = element.getBoundingClientRect();
          setTargetRect(rect);
          setTooltipPos(calculateTooltipPosition(rect, step.position));
        } else {
          setTargetRect(null);
          setTooltipPos({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
        }
      } else {
        setTargetRect(null);
        setTooltipPos({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
      }
    }
  }, [currentStep]);

  // Recalculate on resize
  useEffect(() => {
    const handleResize = () => {
      if (currentStep >= 0 && currentStep < steps.length) {
        const step = steps[currentStep];
        const element = document.getElementById(step.targetId);
        if (element) {
          const rect = element.getBoundingClientRect();
          setTargetRect(rect);
          setTooltipPos(calculateTooltipPosition(rect, step.position));
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishTutorial();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const finishTutorial = () => {
    setIsVisible(false);
    localStorage.setItem('hub_onboarding_seen', 'true');
  };

  if (!isVisible) return null;

  // Initial Modal
  if (currentStep === -1) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white dark:bg-[#0d0e12] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200 dark:border-neutral-800 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-3">
            Primeira vez por aqui?
          </h2>
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed">
            Bem-vindo ao Hub Organizador! Gostaria de fazer um tour rápido de 1 minuto para conhecer as principais ferramentas?
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setCurrentStep(0)}
              className="w-full py-3 sm:py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              Sim, me mostre tudo!
            </button>
            <button
              onClick={finishTutorial}
              className="w-full py-3 sm:py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-300 rounded-xl font-bold active:scale-[0.98] transition-all cursor-pointer"
            >
              Agora não, quero explorar sozinho
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-black/60 transition-all duration-500 ease-in-out pointer-events-auto">
        {targetRect && (
          <div
            className="absolute bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] transition-all duration-300 rounded-xl ring-4 ring-indigo-500/50"
            style={{
              left: targetRect.left - 8,
              top: targetRect.top - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          />
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Mobile Arrow */}
        {window.innerWidth < 640 && targetRect && isVisible && (
          <div className="fixed inset-0 z-[100] pointer-events-none">
            <svg className="w-full h-full">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#fbbf24" />
                </marker>
              </defs>
              <motion.line
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                x1={window.innerWidth / 2}
                y1={window.innerHeight / 2}
                x2={targetRect.left + targetRect.width / 2}
                y2={targetRect.top + targetRect.height / 2}
                stroke="#fbbf24"
                strokeWidth="3"
                strokeDasharray="6 4"
                markerEnd="url(#arrowhead)"
              />
            </svg>
          </div>
        )}

        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            top: tooltipPos.top,
            left: tooltipPos.left,
          }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="absolute z-[101] pointer-events-auto w-[calc(100vw-32px)] sm:w-[320px] max-w-[320px]"
          style={{ 
            top: tooltipPos.top, 
            left: tooltipPos.left,
            transform: tooltipPos.transform || undefined
          }}
        >
          <div className="bg-white dark:bg-[#16171d] rounded-2xl p-5 sm:p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 relative max-h-[85vh] overflow-y-auto">
            {step.position !== 'center' && targetRect && window.innerWidth > 640 && (
              <div className={getArrowClass(step.position)} />
            )}

            <div className="flex items-start gap-4 mb-3">
              <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shrink-0">
                {step.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white leading-tight truncate">
                  {step.title}
                </h3>
                <div className="text-[9px] sm:text-[10px] text-neutral-400 mt-0.5 font-bold uppercase tracking-wider">
                  Passo {currentStep + 1} de {steps.length}
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-6">
              {step.description}
            </p>

            <div className="flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={finishTutorial}
                  className="px-3 py-1.5 text-[10px] sm:text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Pular
                </button>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] sm:text-xs font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  {currentStep === steps.length - 1 ? 'Concluir' : 'Próximo'}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

function calculateTooltipPosition(rect: DOMRect | null, position: string): React.CSSProperties {
  const isMobile = window.innerWidth < 640;
  
  if (!rect || position === 'center' || isMobile) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    } as any;
  }

  const padding = 20;
  let top = 0;
  let left = 0;
  let x = '-50%';
  let y = '0';

  switch (position) {
    case 'top':
      top = rect.top - padding;
      left = rect.left + rect.width / 2;
      y = '-100%';
      break;
    case 'bottom':
      top = rect.bottom + padding;
      left = rect.left + rect.width / 2;
      break;
    case 'left':
      top = rect.top + rect.height / 2;
      left = rect.left - padding;
      x = '-100%';
      y = '-50%';
      break;
    case 'right':
      top = rect.top + rect.height / 2;
      left = rect.right + padding;
      x = '0';
      y = '-50%';
      break;
  }

  // Final viewport safety check
  const viewportPadding = 16;
  const tooltipWidth = 320;
  
  if (left < viewportPadding + tooltipWidth / 2) left = viewportPadding + tooltipWidth / 2;
  if (left > window.innerWidth - viewportPadding - tooltipWidth / 2) left = window.innerWidth - viewportPadding - tooltipWidth / 2;

  return { top, left, transform: `translate(${x}, ${y})` } as any;
}

function getArrowClass(position: string): string {
  const base = "absolute w-3 h-3 bg-white dark:bg-[#16171d] border-neutral-200 dark:border-neutral-800 transform rotate-45";
  switch (position) {
    case 'top': return `${base} -bottom-1.5 left-1/2 -translate-x-1/2 border-r border-b`;
    case 'bottom': return `${base} -top-1.5 left-1/2 -translate-x-1/2 border-l border-t`;
    case 'left': return `${base} -right-1.5 top-1/2 -translate-y-1/2 border-r border-t`;
    case 'right': return `${base} -left-1.5 top-1/2 -translate-y-1/2 border-l border-b`;
    default: return "";
  }
}
