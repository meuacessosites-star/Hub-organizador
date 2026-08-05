import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown,
  Check, 
  Sparkles, 
  LayoutGrid, 
  Plus, 
  Search, 
  Settings2, 
  ShoppingBag,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  HelpCircle,
  BookOpen,
  AlertCircle,
  Calendar,
  Tag
} from 'lucide-react';

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
    description: 'Este tutorial interativo vai te guiar para você aprender a organizar suas contas de streaming, assinaturas, perfis e finanças em segundos.',
    icon: <Sparkles className="w-6 h-6 text-amber-500" />,
    position: 'center'
  },
  {
    targetId: 'add-platform-btn',
    title: 'Cadastrar Novas Plataformas',
    description: 'Comece adicionando novos serviços (ex: Netflix, Disney+, Steam). O app busca o logo e as cores oficiais de forma automática!',
    icon: <Plus className="w-5 h-5 text-indigo-500" />,
    position: 'bottom'
  },
  {
    targetId: 'platform-card-demo-plat-netflix',
    title: 'Visualização de Plataformas',
    description: 'Olha só! Com o tutorial ativo, adicionamos a Netflix como exemplo real. Cada card organiza as credenciais, contas e atalhos rápidos do serviço de forma isolada.',
    icon: <Sparkles className="w-5 h-5 text-purple-500" />,
    position: 'bottom'
  },
  {
    targetId: 'profile-card-demo-prof-net1',
    title: 'Perfis e Contas Virtuais',
    description: 'Dentro de cada plataforma, você pode cadastrar múltiplas contas, perfis ou e-mails de acesso, cada um com seu status de validade, apelido e campo de senha rápido.',
    icon: <Check className="w-5 h-5 text-emerald-500" />,
    position: 'bottom'
  },
  {
    targetId: 'view-selector-purchases',
    title: 'Controle de Lançamentos',
    description: 'Clique nas abas "Plataformas" e "Compras" para alternar o foco. Vamos dar uma olhada no painel de finanças do Hub.',
    icon: <ShoppingBag className="w-5 h-5 text-pink-500" />,
    position: 'bottom'
  },
  {
    targetId: 'purchase-card-demo-pur-net1',
    title: 'Fluxo de Gastos e Compras',
    description: 'Centralize todos os seus pagamentos! Saiba exatamente quanto gasta em cada serviço por mês, trimestral ou anual, evitando cobranças surpresas.',
    icon: <ShoppingBag className="w-5 h-5 text-rose-500" />,
    position: 'bottom'
  },
  {
    targetId: 'search-input-container',
    title: 'Busca Ultra Rápida',
    description: 'Use a busca para filtrar instantaneamente por nome, e-mail do usuário ou itens comprados. Dica: Pressione ⌘K (ou Ctrl+K) para focar na busca.',
    icon: <Search className="w-5 h-5 text-sky-500" />,
    position: 'bottom'
  },
  {
    targetId: 'category-btn-all',
    title: 'Navegação por Categorias',
    description: 'Filtre de forma rápida no painel lateral para ver somente Streaming, Jogos, Finanças ou Trabalho.',
    icon: <LayoutGrid className="w-5 h-5 text-teal-500" />,
    position: 'right'
  },
  {
    targetId: 'sidebar-manage-status-btn',
    title: 'Personalização do seu Jeito',
    description: 'No painel de configurações, crie ou altere as categorias de plataformas e os status de validade das contas (ex: "Em Ativação").',
    icon: <Settings2 className="w-5 h-5 text-amber-500" />,
    position: 'right'
  },
  {
    targetId: 'tutorial-final',
    title: 'Tudo Pronto!',
    description: 'Parabéns! Você já domina o Hub Organizador. Agora desfrute do app organizando suas próprias assinaturas de forma elegante!',
    icon: <Check className="w-6 h-6 text-green-500" />,
    position: 'center'
  }
];

interface OnboardingTutorialProps {
  isActive: boolean;
  onClose: () => void;
  onSetSidebarOpenMobile: (open: boolean) => void;
  onSetCurrentView?: (view: 'platforms' | 'purchases') => void;
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  isActive,
  onClose,
  onSetSidebarOpenMobile,
  onSetCurrentView,
}) => {
  const [currentStep, setCurrentStep] = useState(() => {
    const hasSeen = localStorage.getItem('hub_onboarding_seen') === 'true';
    return hasSeen ? 0 : -1;
  });
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [arrowPath, setArrowPath] = useState('');
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tooltipRef.current && targetRect) {
      const rect = tooltipRef.current.getBoundingClientRect();
      const isTargetInTopHalf = targetRect.top < window.innerHeight / 2;
      
      const startX = rect.left + rect.width / 2;
      const startY = isTargetInTopHalf 
        ? rect.top // Top edge of tooltip
        : rect.bottom; // Bottom edge of tooltip
        
      const endX = targetRect.left + targetRect.width / 2;
      const endY = isTargetInTopHalf
        ? targetRect.bottom + 12
        : targetRect.top - 12;

      const controlY1 = startY + (endY - startY) * 0.4;
      const controlY2 = startY + (endY - startY) * 0.6;
      
      setArrowPath(`M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`);
    }
  }, [currentStep, targetRect]);
  const [tooltipPos, setTooltipPos] = useState<React.CSSProperties>({});
  const [showDemoPassword, setShowDemoPassword] = useState(false);
  const [demoActiveTab, setDemoActiveTab] = useState<'contas' | 'compras'>('contas');
  const [demoExpanded, setDemoExpanded] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const simulateCopy = (field: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  // Reset step when tutorial is activated
  useEffect(() => {
    if (isActive) {
      const hasSeen = localStorage.getItem('hub_onboarding_seen') === 'true';
      setCurrentStep(hasSeen ? 0 : -1);
    }
  }, [isActive]);

  useEffect(() => {
    if (currentStep >= 0 && currentStep < steps.length) {
      const step = steps[currentStep];
      const isMobile = window.innerWidth < 640;

      // Automatically switch views based on target step element
      const isPurchasesStep = step.targetId === 'purchase-card-demo-pur-net1' || step.targetId === 'view-selector-purchases';
      if (isPurchasesStep) {
        onSetCurrentView?.('purchases');
      } else {
        onSetCurrentView?.('platforms');
      }

      // Automatically control sidebar based on step target element
      const isSidebarElement = step.targetId === 'category-btn-all' || step.targetId === 'sidebar-manage-status-btn';
      if (isSidebarElement) {
        onSetSidebarOpenMobile(true);
      } else {
        onSetSidebarOpenMobile(false);
      }

      // Add a small delay for the DOM elements to settle and sidebar transition to finish
      const delay = isSidebarElement ? 350 : 150;
      const timer = setTimeout(() => {
        const element = document.getElementById(step.targetId);
        if (element) {
          const rect = element.getBoundingClientRect();
          setTargetRect(rect);
          if (!isMobile) {
            setTooltipPos(calculateTooltipPosition(rect, step.position));
          } else {
            // Mobile-first: position tooltip at the opposite half of the target to avoid overlapping
            const isTargetInTopHalf = rect.top < window.innerHeight / 2;
            setTooltipPos({
              top: isTargetInTopHalf ? 'auto' : '80px',
              bottom: isTargetInTopHalf ? '80px' : 'auto',
              left: '50%',
              x: '-50%',
              y: '0'
            });
          }
        } else {
          setTargetRect(null);
          setTooltipPos({ top: '50%', left: '50%', x: '-50%', y: '-50%' });
        }
      }, delay);

      return () => clearTimeout(timer);
    } else {
      setTargetRect(null);
    }
  }, [currentStep, onSetSidebarOpenMobile, onSetCurrentView]);

  // Recalculate on resize
  useEffect(() => {
    const handleResize = () => {
      if (currentStep >= 0 && currentStep < steps.length) {
        const step = steps[currentStep];
        const isMobile = window.innerWidth < 640;
        const element = document.getElementById(step.targetId);
        
        if (element) {
          const rect = element.getBoundingClientRect();
          setTargetRect(rect);
          if (!isMobile) {
            setTooltipPos(calculateTooltipPosition(rect, step.position));
          } else {
            // Mobile-first: position tooltip at the opposite half of the target
            const isTargetInTopHalf = rect.top < window.innerHeight / 2;
            setTooltipPos({
              top: isTargetInTopHalf ? 'auto' : '80px',
              bottom: isTargetInTopHalf ? '80px' : 'auto',
              left: '50%',
              x: '-50%',
              y: '0'
            });
          }
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
    onSetSidebarOpenMobile(false);
    localStorage.setItem('hub_onboarding_seen', 'true');
    onClose();
  };

  if (!isActive) return null;

  // Initial Modal
  if (currentStep === -1) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm pointer-events-auto overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-[#0a0a0a] text-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 max-w-5xl w-full shadow-2xl border border-neutral-800 relative my-auto mx-auto overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 via-indigo-600 to-purple-600 shrink-0" />
          
          <div className="flex items-center justify-between mb-3 sm:mb-4 pb-3 border-b border-neutral-800 shrink-0">
            <div className="flex items-center gap-2 select-none">
              <Sparkles className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 text-red-500 animate-pulse" />
              <h2 className="text-base sm:text-2xl font-bold text-neutral-100">
                Tutorial do Aplicativo
              </h2>
            </div>
            <button 
              onClick={finishTutorial}
              className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-0 sm:pr-1 custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-start">
              {/* Left side: Saved Account Mockup */}
              <div className="lg:col-span-5 bg-[#0a0a0a] p-3 sm:p-5 rounded-2xl border border-neutral-800/80">
                  <div className="flex items-center justify-between mb-3 select-none">
                    <span className="text-[8px] sm:text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1">
                      TODAS &gt; 1 CONTA
                    </span>
                    <button 
                      onClick={() => setDemoActiveTab(demoActiveTab === 'contas' ? 'compras' : 'contas')}
                      className="px-1.5 py-0.5 rounded-full text-[7px] sm:text-[9px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse hover:bg-indigo-500/20 transition-all cursor-pointer"
                    >
                      ALTERAR ABA
                    </button>
                  </div>

                {/* Replica of User Screenshot Card */}
                <div className="bg-[#0d0d0d] rounded-2xl border border-neutral-800/60 p-3 sm:p-4 shadow-xl text-left select-none">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {/* Netflix red N */}
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-black border border-neutral-800 flex items-center justify-center relative overflow-hidden shrink-0">
                        <div className="font-sans font-black text-red-600 text-xl sm:text-2xl select-none" style={{ textShadow: '0 0 8px rgba(220, 38, 38, 0.4)' }}>
                          N
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-neutral-100 leading-tight">Netflix</h4>
                        <span className="text-[9px] sm:text-[10px] text-neutral-400 flex items-center gap-1 font-medium">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500/80" /> netflix.com
                        </span>
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                  </div>

                  {/* Subtabs tabs */}
                  <div className="flex border-b border-neutral-800 mb-4 text-[10px] sm:text-xs font-bold">
                    <button 
                      onClick={() => setDemoActiveTab('contas')}
                      className={`flex-1 pb-2 border-b-2 transition-all cursor-pointer ${demoActiveTab === 'contas' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-neutral-500'}`}
                    >
                      Contas (1)
                    </button>
                    <button 
                      onClick={() => setDemoActiveTab('compras')}
                      className={`flex-1 pb-2 border-b-2 transition-all cursor-pointer ${demoActiveTab === 'compras' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-neutral-500'}`}
                    >
                      Compras (2)
                    </button>
                  </div>

                  {demoActiveTab === 'contas' ? (
                    <div>
                      {/* Contas Cadastradas row */}
                      <div className="flex items-center justify-between mb-3.5">
                        <span className="text-[8px] sm:text-[9px] font-extrabold text-neutral-500 uppercase tracking-widest">CONTAS CADASTRADAS</span>
                        <button 
                          onClick={() => setDemoExpanded(!demoExpanded)}
                          className="text-[8px] sm:text-[9px] font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1 hover:text-indigo-300 transition-colors cursor-pointer"
                        >
                          {demoExpanded ? '▲ RECOLHER' : '▼ EXPANDIR'}
                        </button>
                      </div>

                      {/* Profile row */}
                      <div className="bg-[#111218] rounded-xl border border-neutral-800/40 p-3 sm:p-3.5">
                        <div className="flex items-center justify-between border-b border-neutral-800/40 pb-3 mb-3.5">
                          <div className="flex items-center gap-3">
                            {/* Purple Circle icon initials PE */}
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-[10px] sm:text-xs select-none">
                              PE
                            </div>
                            <div>
                              <p className="text-[10px] sm:text-xs font-bold text-neutral-200">Pessoal</p>
                              <p className="text-[8px] sm:text-[10px] text-neutral-500 font-medium">netflix.com</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] sm:text-[9px] text-neutral-500 lowercase font-medium tracking-wide">arrastar &lt;</span>
                            <ChevronDown className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${demoExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>

                        {demoExpanded && (
                          <div className="space-y-3 sm:space-y-3.5 text-left">
                            {/* E-Mail input mock */}
                            <div>
                              <span className="text-[8px] sm:text-[9px] font-extrabold text-neutral-500 uppercase tracking-wider block mb-1">E-MAIL</span>
                              <div className="flex items-center justify-between bg-[#16171d] px-2.5 py-2 sm:py-2.5 rounded-xl border border-neutral-800/60 transition-colors hover:border-neutral-700">
                                <span className="text-[10px] sm:text-xs font-mono text-neutral-300 truncate">teste@gmailm.com</span>
                                <button 
                                  onClick={() => simulateCopy('email', 'teste@gmailm.com')}
                                  className="text-neutral-400 hover:text-indigo-400 transition-colors p-1 cursor-pointer shrink-0"
                                  title="Copiar E-mail"
                                >
                                  {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-500 animate-scale" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>

                            {/* Usuário input mock */}
                            <div>
                              <span className="text-[8px] sm:text-[9px] font-extrabold text-neutral-500 uppercase tracking-wider block mb-1">USUÁRIO</span>
                              <div className="flex items-center justify-between bg-[#16171d] px-2.5 py-2 sm:py-2.5 rounded-xl border border-neutral-800/60 transition-colors hover:border-neutral-700">
                                <span className="text-[10px] sm:text-xs font-mono text-neutral-300">Teste</span>
                                <button 
                                  onClick={() => simulateCopy('usuario', 'Teste')}
                                  className="text-neutral-400 hover:text-indigo-400 transition-colors p-1 cursor-pointer shrink-0"
                                  title="Copiar Usuário"
                                >
                                  {copiedField === 'usuario' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>

                            {/* Senha input mock */}
                            <div>
                              <span className="text-[8px] sm:text-[9px] font-extrabold text-neutral-500 uppercase tracking-wider block mb-1">SENHA</span>
                              <div className="flex items-center justify-between bg-[#16171d] px-2.5 py-2 sm:py-2.5 rounded-xl border border-neutral-800/60 transition-colors hover:border-neutral-700">
                                <span className="text-[10px] sm:text-xs font-mono text-neutral-300">
                                  {showDemoPassword ? 'SenhaNetflix123!' : '••••••••'}
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button 
                                    onClick={() => setShowDemoPassword(!showDemoPassword)}
                                    className="text-neutral-400 hover:text-indigo-400 transition-colors p-1 cursor-pointer"
                                    title={showDemoPassword ? "Ocultar senha" : "Revelar senha"}
                                  >
                                    {showDemoPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                  <button 
                                    onClick={() => simulateCopy('senha', 'SenhaNetflix123!')}
                                    className="text-neutral-400 hover:text-indigo-400 transition-colors p-1 cursor-pointer"
                                    title="Copiar Senha"
                                  >
                                    {copiedField === 'senha' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Rascunho / Notas mock */}
                            <div>
                              <span className="text-[8px] sm:text-[9px] font-extrabold text-neutral-500 uppercase tracking-wider block mb-1">RASCUNHO / NOTAS</span>
                              <div className="bg-[#16171d] px-2.5 py-2 sm:py-2.5 rounded-xl border border-neutral-800/40 text-[10px] sm:text-xs italic text-neutral-400">
                                Tutorial de Uso
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottom layout actions matching the screenshot */}
                      <div className="flex items-center justify-between border-t border-neutral-800 pt-4 mt-4 text-[9px] sm:text-[11px] font-bold gap-2">
                        <button className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-indigo-400 hover:text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all border border-indigo-500/10">
                          <Plus className="w-3 h-3" /> Adicionar conta
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-rose-500 hover:text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 transition-all border border-rose-500/10">
                          <X className="w-3 h-3" /> Excluir plataforma
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] sm:text-[9px] font-extrabold text-neutral-500 uppercase tracking-widest">HISTÓRICO DE GASTOS</span>
                        <span className="text-[8px] sm:text-[9px] font-black text-indigo-400">2 ITENS</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="bg-[#111218] rounded-xl border border-neutral-800/40 p-2.5">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded bg-indigo-500/10 flex items-center justify-center">
                                <ShoppingBag className="w-3 h-3 text-indigo-400" />
                              </div>
                              <div>
                                <p className="text-[9px] sm:text-[11px] font-bold text-neutral-200">Plano Premium Ultra HD</p>
                                <p className="text-[7px] sm:text-[8px] text-neutral-500">Vence: 15/08/2026</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] sm:text-[11px] font-black text-indigo-400">R$ 55,90</p>
                              <span className="text-[6px] sm:text-[7px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold">PAGO</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-[#111218] rounded-xl border border-neutral-800/40 p-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded bg-amber-500/10 flex items-center justify-center">
                                <Calendar className="w-3 h-3 text-amber-500" />
                              </div>
                              <div>
                                <p className="text-[9px] sm:text-[11px] font-bold text-neutral-200">Adicional de Telas Extra</p>
                                <p className="text-[7px] sm:text-[8px] text-neutral-500">Próximo: 15/09/2026</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] sm:text-[11px] font-black text-amber-400">R$ 12,90</p>
                              <span className="text-[6px] sm:text-[7px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold">AGENDADO</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all border border-indigo-500/10 text-[8px] sm:text-[10px] font-bold mt-2">
                        <Plus className="w-3 h-3" /> Registrar nova compra
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right side: App 10 detailed tips */}
              <div className="lg:col-span-7 flex flex-col justify-between text-left h-full">
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-neutral-300 mb-4 uppercase tracking-widest flex items-center gap-2 border-b border-neutral-800 pb-2">
                    <BookOpen className="w-4 h-4 text-red-500" /> 9 Dicas de Uso Essenciais
                  </h3>
                  
                  <div className="space-y-3 sm:space-y-4 text-[11px] sm:text-xs text-neutral-400 leading-relaxed lg:max-h-[460px] lg:overflow-y-auto pr-2 custom-scrollbar">
                    <div className="flex gap-2 sm:gap-3.5 bg-neutral-800/20 p-2 sm:p-3 rounded-xl border border-neutral-800/30">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-red-600/10 text-red-400 flex items-center justify-center font-black shrink-0 text-[9px] sm:text-xs">
                        1
                      </div>
                      <div>
                        <p className="font-bold text-neutral-200 mb-0.5 text-[10px] sm:text-[12px]">Tutorial Interativo</p>
                        <p className="text-[10px] sm:text-[11px]">O card à esquerda é <span className="text-indigo-400">interativo</span>! Clique nas abas e botões para ver como o app se comporta.</p>
                      </div>
                    </div>

                    <div className="flex gap-3 sm:gap-3.5 p-2.5 sm:p-3 rounded-xl hover:bg-neutral-800/10 transition-colors">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-indigo-600/10 text-indigo-400 flex items-center justify-center font-black shrink-0 text-[10px] sm:text-xs">
                        2
                      </div>
                      <div>
                        <p className="font-bold text-neutral-200 mb-0.5 sm:mb-1">Múltiplos Perfis</p>
                        <p>Clique em <span className="font-semibold text-indigo-400">+ Adicionar conta</span> para incluir outros logins familiares de forma modular!</p>
                      </div>
                    </div>

                    <div className="flex gap-3 sm:gap-3.5 p-2.5 sm:p-3 rounded-xl hover:bg-neutral-800/10 transition-colors">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-purple-600/10 text-purple-400 flex items-center justify-center font-black shrink-0 text-[10px] sm:text-xs">
                        3
                      </div>
                      <div>
                        <p className="font-bold text-neutral-200 mb-0.5 sm:mb-1">Cópia Rápida</p>
                        <p>Basta clicar no ícone de cópia ao lado dos campos para transferir credenciais instantaneamente!</p>
                      </div>
                    </div>

                    <div className="flex gap-3 sm:gap-3.5 p-2.5 sm:p-3 rounded-xl hover:bg-neutral-800/10 transition-colors">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-amber-600/10 text-amber-400 flex items-center justify-center font-black shrink-0 text-[10px] sm:text-xs">
                        4
                      </div>
                      <div>
                        <p className="font-bold text-neutral-200 mb-0.5 sm:mb-1">Senhas Seguras</p>
                        <p>As senhas vêm ocultas por padrão. Clique no <span className="font-semibold text-amber-400">ícone de olho</span> para revelá-las.</p>
                      </div>
                    </div>

                    <div className="flex gap-3 sm:gap-3.5 p-2.5 sm:p-3 rounded-xl hover:bg-neutral-800/10 transition-colors">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-sky-600/10 text-sky-400 flex items-center justify-center font-black shrink-0 text-[10px] sm:text-xs">
                        5
                      </div>
                      <div>
                        <p className="font-bold text-neutral-200 mb-0.5 sm:mb-1">Anotações Livres</p>
                        <p>Use o campo de rascunhos para salvar códigos de recuperação ou observações específicas de cada perfil.</p>
                      </div>
                    </div>

                    <div className="flex gap-3 sm:gap-3.5 p-2.5 sm:p-3 rounded-xl hover:bg-neutral-800/10 transition-colors">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-pink-600/10 text-pink-400 flex items-center justify-center font-black shrink-0 text-[10px] sm:text-xs">
                        6
                      </div>
                      <div>
                        <p className="font-bold text-neutral-200 mb-0.5 sm:mb-1">Busca Inteligente (Ctrl+K)</p>
                        <p>Encontre qualquer e-mail ou observação em segundos. Use o atalho para filtrar as contas imediatamente.</p>
                      </div>
                    </div>

                    <div className="flex gap-3 sm:gap-3.5 p-2.5 sm:p-3 rounded-xl hover:bg-neutral-800/10 transition-colors">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-rose-600/10 text-rose-400 flex items-center justify-center font-black shrink-0 text-[10px] sm:text-xs">
                        7
                      </div>
                      <div>
                        <p className="font-bold text-neutral-200 mb-0.5 sm:mb-1">Controle Financeiro</p>
                        <p>Registre valores na aba <span className="font-semibold text-rose-400">Compras</span> para somar despesas e alertas de vencimento.</p>
                      </div>
                    </div>

                    <div className="flex gap-3 sm:gap-3.5 p-2.5 sm:p-3 rounded-xl hover:bg-neutral-800/10 transition-colors">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-teal-600/10 text-teal-400 flex items-center justify-center font-black shrink-0 text-[10px] sm:text-xs">
                        8
                      </div>
                      <div>
                        <p className="font-bold text-neutral-200 mb-0.5 sm:mb-1">Personalização</p>
                        <p>No menu lateral, crie suas categorias e gerencie status de validade de forma intuitiva.</p>
                      </div>
                    </div>

                    <div className="flex gap-3 sm:gap-3.5 p-2.5 sm:p-3 rounded-xl hover:bg-neutral-800/10 transition-colors">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-yellow-600/10 text-yellow-400 flex items-center justify-center font-black shrink-0 text-[10px] sm:text-xs">
                        9
                      </div>
                      <div>
                        <p className="font-bold text-neutral-200 mb-0.5 sm:mb-1">Tema Inteligente</p>
                        <p>O app sincroniza com seu sistema ou pode ser alterado manualmente pelo botão de sol/lua.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 border-t border-neutral-800 pt-4 shrink-0">
                  <button
                    onClick={() => {
                      setCurrentStep(0);
                    }}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 text-xs sm:text-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    Iniciar Tour
                  </button>
                  <button
                    onClick={finishTutorial}
                    className="py-3 px-6 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-bold active:scale-[0.98] transition-all cursor-pointer text-xs sm:text-sm text-center border border-neutral-700 hover:border-neutral-600"
                  >
                    Entendi tudo!
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden select-none">
      <div 
        onClick={finishTutorial}
        title="Clique fora para fechar o tutorial"
        className="absolute inset-0 bg-black/50 transition-all duration-500 ease-in-out pointer-events-auto cursor-pointer"
      >
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
        {/* Mobile Arrow - Curved and prominent */}
        {window.innerWidth < 640 && targetRect && (
          <div key={`arrow-${currentStep}`} className="fixed inset-0 z-[101] pointer-events-none">
            <svg className="w-full h-full">
              <defs>
                <filter id="glow-tutorial" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <marker id="arrowhead-mobile-tutorial" markerWidth="12" markerHeight="9" refX="10" refY="4.5" orient="auto">
                  <polygon points="0 0, 12 4.5, 0 9" fill="#fbbf24" />
                </marker>
              </defs>
              <motion.path
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                d={arrowPath}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="4"
                strokeDasharray="10 8"
                markerEnd="url(#arrowhead-mobile-tutorial)"
                filter="url(#glow-tutorial)"
              />
            </svg>
          </div>
        )}

        <motion.div
          key={currentStep}
          ref={tooltipRef}
          initial={window.innerWidth < 640 ? { opacity: 0, scale: 0.9, x: '-50%', y: 0 } : { opacity: 0, scale: 0.9 }}
          animate={window.innerWidth < 640 ? { opacity: 1, scale: 1, x: '-50%', y: 0 } : { opacity: 1, scale: 1 }}
          exit={window.innerWidth < 640 ? { opacity: 0, scale: 0.9, x: '-50%', y: 0 } : { opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={tooltipPos.top === '50%' || window.innerWidth < 640 ? {
            top: tooltipPos.top,
            bottom: tooltipPos.bottom,
            left: '50%',
          } : {
            top: tooltipPos.top,
            left: tooltipPos.left,
            transform: `translate(${(tooltipPos as any).x || '-50%'}, ${(tooltipPos as any).y || '0'})`,
          }}
          className="fixed z-[101] pointer-events-auto w-[92vw] max-w-[340px] sm:w-[320px] h-fit"
        >
          <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-4 sm:p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 relative max-h-[85vh] overflow-y-auto">
            {step.position !== 'center' && targetRect && window.innerWidth > 640 && (
              <div className={getArrowClass(step.position)} />
            )}

            <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-600/10 shrink-0">
                {React.cloneElement(step.icon as React.ReactElement, { className: 'w-5 h-5 sm:w-6 sm:h-6' })}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white leading-tight mb-0.5 sm:mb-1">
                  {step.title}
                </h3>
                <p className="text-[9px] sm:text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  Passo {currentStep + 1} de {steps.length}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4 sm:mb-6">
              {step.description}
            </p>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={finishTutorial}
                className="text-[10px] sm:text-xs font-bold text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors px-2 py-1"
              >
                Pular
              </button>
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrev}
                    className="p-1.5 sm:p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg bg-indigo-600 text-white text-xs sm:text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                >
                  {currentStep === steps.length - 1 ? 'Começar!' : 'Próximo'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

function calculateTooltipPosition(rect: DOMRect | null, position: string): any {
  if (!rect || position === 'center' || window.innerWidth < 640) {
    return {
      top: '50%',
      left: '50%',
      x: '-50%',
      y: '-50%',
    };
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

  // Vertical safety
  if (top < viewportPadding) top = viewportPadding;
  if (top > window.innerHeight - 200) top = window.innerHeight - 200;

  return { top, left, x, y };
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
