import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { Category, Purchase, Platform } from '../types';
import { useTheme } from '../context/ThemeContext';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  TrendingDown, 
  Award, 
  ShoppingBag, 
  Calendar,
  LineChart as LineChartIcon,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CategoryChartPanelProps {
  filteredPurchases: Array<Purchase & { platformId: string; platformName: string }>;
  categories: Category[];
  platforms: Platform[];
}

type TabType = 'categories' | 'timeline' | 'comparison';

export const CategoryChartPanel: React.FC<CategoryChartPanelProps> = ({
  filteredPurchases,
  categories,
  platforms,
}) => {
  const { theme } = useTheme();
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [activeTab, setActiveTab] = useState<TabType>('categories');
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate comprehensive metrics and groupings
  const stats = useMemo(() => {
    let totalSpent = 0;
    let totalOriginal = 0;
    let maxPurchase: { name: string; value: number } | null = null;
    const categorySpentMap = new Map<string, { spent: number; original: number; count: number }>();
    const timelineMap = new Map<string, { spent: number; savings: number; original: number }>();

    filteredPurchases.forEach((purchase) => {
      const final = purchase.finalPrice || 0;
      const original = purchase.originalPrice || final;
      const savings = Math.max(0, original - final);

      totalSpent += final;
      totalOriginal += original;

      // Track highest purchase
      if (!maxPurchase || final > maxPurchase.value) {
        maxPurchase = { name: purchase.productName, value: final };
      }

      // Group by Category
      const platform = platforms.find((p) => p.id === purchase.platformId);
      const catId = platform?.categoryId || 'geral';
      const existingCat = categorySpentMap.get(catId) || { spent: 0, original: 0, count: 0 };
      categorySpentMap.set(catId, {
        spent: existingCat.spent + final,
        original: existingCat.original + original,
        count: existingCat.count + 1,
      });

      // Group by Date for timeline (YYYY-MM-DD for sorting, formatted as DD/MM for display)
      if (purchase.date) {
        try {
          const dateObj = new Date(purchase.date);
          const dateStr = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
          const existingTime = timelineMap.get(dateStr) || { spent: 0, savings: 0, original: 0 };
          timelineMap.set(dateStr, {
            spent: existingTime.spent + final,
            savings: existingTime.savings + savings,
            original: existingTime.original + original,
          });
        } catch (e) {
          // ignore invalid dates
        }
      }
    });

    const totalSavings = Math.max(0, totalOriginal - totalSpent);
    const savingsPercentage = totalOriginal > 0 ? (totalSavings / totalOriginal) * 100 : 0;
    const avgPurchase = filteredPurchases.length > 0 ? totalSpent / filteredPurchases.length : 0;

    // Build Category Data List
    const categoryDataList: Array<{
      id: string;
      name: string;
      value: number; // final spent
      original: number;
      savings: number;
      count: number;
      color: string;
      icon: string;
      percentage: number;
    }> = [];

    categorySpentMap.forEach((val, catId) => {
      const category = categories.find((c) => c.id === catId);
      const catSavings = Math.max(0, val.original - val.spent);
      categoryDataList.push({
        id: catId,
        name: category ? category.name : 'Geral',
        value: val.spent,
        original: val.original,
        savings: catSavings,
        count: val.count,
        color: category ? category.color : '#94a3b8',
        icon: category ? category.icon : '🛒',
        percentage: totalSpent > 0 ? (val.spent / totalSpent) * 100 : 0,
      });
    });

    categoryDataList.sort((a, b) => b.value - a.value);

    // Build Timeline Data List
    const timelineDataList = Array.from(timelineMap.entries())
      .map(([dateStr, val]) => {
        const [year, month, day] = dateStr.split('-');
        return {
          rawDate: dateStr,
          date: `${day}/${month}`,
          spent: val.spent,
          savings: val.savings,
          original: val.original,
        };
      })
      .sort((a, b) => a.rawDate.localeCompare(b.rawDate));

    // Cumulative timeline for area chart evolution
    let cumulativeSpent = 0;
    let cumulativeSavings = 0;
    const cumulativeTimelineData = timelineDataList.map((item) => {
      cumulativeSpent += item.spent;
      cumulativeSavings += item.savings;
      return {
        ...item,
        acumuladoGasto: cumulativeSpent,
        acumuladoEconomizado: cumulativeSavings,
      };
    });

    return {
      totalSpent,
      totalOriginal,
      totalSavings,
      savingsPercentage,
      avgPurchase,
      maxPurchase,
      categoryData: categoryDataList,
      timelineData: cumulativeTimelineData,
      itemCount: filteredPurchases.length,
    };
  }, [filteredPurchases, categories, platforms]);

  // Color constants for charts based on theme
  const colors = {
    text: theme === 'dark' ? '#94a3b8' : '#64748b',
    grid: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    tooltipBg: theme === 'dark' ? '#0d0d0d' : '#ffffff',
    tooltipBorder: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isTimeline = payload[0].name.includes('acumuladoGasto') || payload[0].name.includes('spent');
      
      return (
        <div 
          className="p-3 rounded-xl border shadow-xl flex flex-col gap-1 z-50 transition-all duration-200"
          style={{
            backgroundColor: colors.tooltipBg,
            borderColor: colors.tooltipBorder,
          }}
        >
          {data.icon ? (
            <div className="flex items-center gap-1.5 font-bold text-neutral-800 dark:text-neutral-100 text-xs">
              <span className="text-sm shrink-0">{data.icon}</span>
              <span>{data.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 font-bold text-neutral-800 dark:text-neutral-100 text-xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>Data: {data.date}</span>
            </div>
          )}

          <div className="space-y-1 mt-1 text-xs font-mono">
            {payload.map((p: any, idx: number) => {
              const label = p.name === 'value' || p.name === 'spent' || p.name === 'acumuladoGasto' ? 'Total Gasto' : 
                            p.name === 'savings' || p.name === 'acumuladoEconomizado' ? 'Economizado' : p.name;
              const valueColor = p.name.includes('Gasto') || p.name === 'value' || p.name === 'spent' ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400';
              return (
                <div key={`chart-p-${p.name || idx}-${idx}`} className="flex items-center justify-between gap-6">
                  <span className="text-neutral-400 font-semibold">{label}:</span>
                  <span className={`font-black ${valueColor}`}>
                    R$ {p.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              );
            })}
            
            {data.percentage !== undefined && (
              <span className="text-[10px] text-neutral-400 font-semibold block mt-1">
                {data.percentage.toFixed(1)}% do total gasto
              </span>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const isEmpty = filteredPurchases.length === 0;

  return (
    <div className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-neutral-200/80 dark:border-white/[0.06] shadow-sm overflow-hidden transition-all duration-300">
      
      {/* HEADER BAR (Visualizes summary even when collapsed) */}
      <div 
        className="px-5 py-4 border-b border-neutral-100 dark:border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer select-none gap-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 dark:from-indigo-500/20 dark:to-indigo-500/30 flex items-center justify-center text-white dark:text-indigo-400 shadow-sm border border-indigo-100/30 dark:border-indigo-500/10">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
                Monitoramento & Gráficos Financeiros
              </h3>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                COMPLETO
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-semibold mt-0.5">
              {!isEmpty 
                ? `Análise em tempo real de ${stats.itemCount} compras aplicadas aos filtros`
                : 'Monitore seus gastos por categoria, evolução temporal e economias de forma inteligente'
              }
            </p>
          </div>
        </div>

        {/* Quick summary numbers (Only shown when collapsed and not empty) */}
        <div className="flex items-center justify-between sm:justify-end gap-4" onClick={(e) => e.stopPropagation()}>
          {!isExpanded && !isEmpty && (
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-right">
                <span className="text-[9px] text-neutral-400 dark:text-neutral-500 block font-sans font-bold uppercase tracking-wider">Total Gasto</span>
                <span className="font-extrabold text-neutral-800 dark:text-white">
                  R$ {stats.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-right border-l border-neutral-150 dark:border-white/[0.08] pl-4">
                <span className="text-[9px] text-emerald-500 block font-sans font-bold uppercase tracking-wider">Economizado ({stats.savingsPercentage.toFixed(0)}%)</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5 inline" />
                  R$ {stats.totalSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2.5">
            {/* Quick action buttons if expanded */}
            {isExpanded && !isEmpty && (
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-900/60 p-0.5 rounded-lg border border-neutral-200/50 dark:border-white/[0.04] text-[10px] font-bold">
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    activeTab === 'categories'
                      ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-sm font-extrabold'
                      : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                  }`}
                >
                  Categorias
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    activeTab === 'timeline'
                      ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-sm font-extrabold'
                      : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                  }`}
                >
                  Evolução Temporal
                </button>
                <button
                  onClick={() => setActiveTab('comparison')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    activeTab === 'comparison'
                      ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-sm font-extrabold'
                      : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                  }`}
                >
                  Comparativo de Economia
                </button>
              </div>
            )}

            {/* Collapse Icon */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors cursor-pointer hover:bg-neutral-50 dark:hover:bg-white/[0.02]"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {isEmpty ? (
              /* EMPTY STATE: Visual guidance on how the chart is constructed */
              <div className="p-6 border-t border-neutral-50 dark:border-neutral-900/40">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-7 space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                      📊 Novo Recurso de Análise
                    </div>
                    <h4 className="text-base font-bold text-neutral-800 dark:text-neutral-100">
                      Como funciona o gráfico de monitoramento financeiro?
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Este painel analisa todas as suas compras adicionadas e monta gráficos de distribuição de custos por categoria (como Casa, Jogos, Vestuário, etc.) de forma totalmente automática. Ele obedece instantaneamente os filtros de busca, datas e perfis que você selecionar!
                    </p>
                    
                    <div className="space-y-3 pt-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                        Siga estes passos simples para ativar o gráfico:
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-100 dark:border-white/[0.02]">
                          <span className="text-lg mb-1 block">📌 1. Escolha</span>
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight">
                            Clique em qualquer uma de suas lojas/plataformas na página inicial.
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-100 dark:border-white/[0.02]">
                          <span className="text-lg mb-1 block">🛒 2. Histórico</span>
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight">
                            Acesse a aba <strong>Compras e Histórico</strong> de dentro da plataforma.
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-100 dark:border-white/[0.02]">
                          <span className="text-lg mb-1 block">💸 3. Adicione</span>
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight">
                            Clique em <strong>Adicionar Compra</strong> e preencha os dados de valor, desconto e data!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-5 flex flex-col items-center justify-center p-5 bg-neutral-50/50 dark:bg-neutral-950/30 rounded-2xl border border-neutral-150/40 dark:border-white/[0.02] text-center min-h-[180px]">
                    <div className="flex items-end gap-2.5 h-16 mb-4 px-4 w-full justify-center">
                      <div className="w-6 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-t-md h-[40%] animate-pulse" />
                      <div className="w-6 bg-emerald-500/30 dark:bg-emerald-500/20 rounded-t-md h-[75%] animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <div className="w-6 bg-indigo-500/40 dark:bg-indigo-500/30 rounded-t-md h-[55%] animate-pulse" style={{ animationDelay: '0.4s' }} />
                      <div className="w-6 bg-amber-500/30 dark:bg-amber-500/20 rounded-t-md h-[90%] animate-pulse" style={{ animationDelay: '0.6s' }} />
                    </div>
                    <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                      Os gráficos de barras, pizza e temporal aparecerão aqui!
                    </p>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1 max-w-[220px]">
                      Os gastos de todas as plataformas cadastradas serão totalizados e exibidos de forma inteligente neste painel.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 border-t border-neutral-50 dark:border-neutral-900/40 flex flex-col gap-6">
                
                {/* 1. COMPREHENSIVE STATS CARDS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Total spent and comparison */}
                  <div className="bg-neutral-50/60 dark:bg-neutral-950/30 border border-neutral-200/50 dark:border-white/[0.02] rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-indigo-500" />
                      Total Final Gasto
                    </span>
                    <div className="mt-2.5">
                      <h4 className="text-xl font-black text-neutral-800 dark:text-white font-mono leading-none">
                        R$ {stats.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </h4>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-semibold mt-1">
                        Soma real paga considerando todos os descontos
                      </p>
                    </div>
                  </div>

                  {/* Total Savings - complete with relative percentage */}
                  <div className="bg-emerald-500/5 dark:bg-emerald-500/[0.03] border border-emerald-500/20 dark:border-emerald-500/10 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      Economia Acumulada
                    </span>
                    <div className="mt-2.5">
                      <h4 className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono leading-none flex items-baseline gap-1.5">
                        R$ {stats.totalSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        <span className="text-xs font-black bg-emerald-500/10 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-500">
                          {stats.savingsPercentage.toFixed(0)}%
                        </span>
                      </h4>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-500/80 font-semibold mt-1">
                        Valor poupado em relação ao preço original
                      </p>
                    </div>
                  </div>

                  {/* Average Ticket */}
                  <div className="bg-neutral-50/60 dark:bg-neutral-950/30 border border-neutral-200/50 dark:border-white/[0.02] rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3 text-sky-500" />
                      Ticket Médio por Item
                    </span>
                    <div className="mt-2.5">
                      <h4 className="text-xl font-black text-neutral-800 dark:text-white font-mono leading-none">
                        R$ {stats.avgPurchase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </h4>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-semibold mt-1">
                        Média de investimento por compra cadastrada
                      </p>
                    </div>
                  </div>

                  {/* Highest Investment with dynamic product name */}
                  <div className="bg-neutral-50/60 dark:bg-neutral-950/30 border border-neutral-200/50 dark:border-white/[0.02] rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
                      <Award className="w-3 h-3 text-amber-500" />
                      Maior Compra do Filtro
                    </span>
                    <div className="mt-2.5">
                      <h4 className="text-xl font-black text-neutral-800 dark:text-white font-mono leading-none truncate max-w-[200px]" title={stats.maxPurchase?.name}>
                        R$ {stats.maxPurchase ? stats.maxPurchase.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                      </h4>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-semibold mt-1 truncate">
                        {stats.maxPurchase ? stats.maxPurchase.name : 'Nenhuma compra'}
                      </p>
                    </div>
                  </div>

                </div>

                {/* 2. DYNAMIC TAB INTERFACE & VISUAL CHARTS */}
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Left Column: Interactive Graphics Display */}
                  <div className="lg:col-span-7 bg-neutral-50/50 dark:bg-neutral-950/20 rounded-xl p-4 border border-neutral-150/40 dark:border-white/[0.02] flex flex-col justify-between min-h-[300px]">
                    
                    {/* Header inside specific visual mode */}
                    <div className="flex items-center justify-between mb-4 border-b border-neutral-200/40 dark:border-white/[0.02] pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                          {activeTab === 'categories' && 'Gastos por Categoria'}
                          {activeTab === 'timeline' && 'Evolução dos Investimentos (Acumulado)'}
                          {activeTab === 'comparison' && 'Economia (Gasto Real vs Preço Original)'}
                        </span>
                      </div>

                      {/* Chart toggle inside categories */}
                      {activeTab === 'categories' && (
                        <div className="flex items-center bg-white dark:bg-neutral-900 p-0.5 rounded-lg border border-neutral-200/60 dark:border-white/[0.04]">
                          <button
                            onClick={() => setChartType('bar')}
                            className={`p-1 rounded transition-all cursor-pointer ${
                              chartType === 'bar'
                                ? 'bg-neutral-100 dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                            }`}
                            title="Visualizar em Barras"
                          >
                            <BarChart3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setChartType('pie')}
                            className={`p-1 rounded transition-all cursor-pointer ${
                              chartType === 'pie'
                                ? 'bg-neutral-100 dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                            }`}
                            title="Visualizar em Pizza"
                          >
                            <PieIcon className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Chart rendering based on selected Tab */}
                    <div className="flex-1 flex items-center justify-center h-56 w-full">
                      {activeTab === 'categories' && (
                        <ResponsiveContainer width="100%" height="100%">
                          {chartType === 'bar' ? (
                            <BarChart
                              data={stats.categoryData}
                              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                              <XAxis 
                                dataKey="name" 
                                stroke={colors.text} 
                                fontSize={9} 
                                tickLine={false} 
                                axisLine={false}
                                dy={6}
                              />
                              <YAxis 
                                stroke={colors.text} 
                                fontSize={9} 
                                tickLine={false} 
                                axisLine={false}
                                tickFormatter={(val) => `R$${val}`}
                              />
                              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }} />
                              <Bar 
                                dataKey="value" 
                                radius={[4, 4, 0, 0]}
                                maxBarSize={32}
                              >
                                {stats.categoryData.map((entry, index) => (
                                  <Cell key={`bar-cell-${entry.id || index}-${index}`} fill={entry.color} />
                                ))}
                              </Bar>
                            </BarChart>
                          ) : (
                            <PieChart>
                              <Pie
                                data={stats.categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={75}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {stats.categoryData.map((entry, index) => (
                                  <Cell key={`pie-cell-${entry.id || index}-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                          )}
                        </ResponsiveContainer>
                      )}

                      {activeTab === 'timeline' && (
                        stats.timelineData.length === 0 ? (
                          <p className="text-xs text-neutral-400 italic">Preencha datas válidas nas suas compras para ver a evolução temporal.</p>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={stats.timelineData}
                              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                                </linearGradient>
                                <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                              <XAxis 
                                dataKey="date" 
                                stroke={colors.text} 
                                fontSize={9} 
                                tickLine={false} 
                                axisLine={false}
                                dy={6}
                              />
                              <YAxis 
                                stroke={colors.text} 
                                fontSize={9} 
                                tickLine={false} 
                                axisLine={false}
                                tickFormatter={(val) => `R$${val}`}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Area 
                                type="monotone" 
                                name="acumuladoGasto"
                                dataKey="acumuladoGasto" 
                                stroke="#6366f1" 
                                strokeWidth={2.5}
                                fillOpacity={1} 
                                fill="url(#colorSpent)" 
                              />
                              <Area 
                                type="monotone" 
                                name="acumuladoEconomizado"
                                dataKey="acumuladoEconomizado" 
                                stroke="#10b981" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorSavings)" 
                              />
                              <Legend 
                                verticalAlign="top" 
                                height={36} 
                                iconType="circle"
                                iconSize={8}
                                formatter={(value) => {
                                  if (value === 'acumuladoGasto') return <span className="text-[10px] text-neutral-600 dark:text-neutral-400 font-bold">Investido Acumulado</span>;
                                  if (value === 'acumuladoEconomizado') return <span className="text-[10px] text-emerald-500 font-bold">Economizado Acumulado</span>;
                                  return value;
                                }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        )
                      )}

                      {activeTab === 'comparison' && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={stats.categoryData}
                            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                            <XAxis 
                              dataKey="name" 
                              stroke={colors.text} 
                              fontSize={9} 
                              tickLine={false} 
                              axisLine={false}
                              dy={6}
                            />
                            <YAxis 
                              stroke={colors.text} 
                              fontSize={9} 
                              tickLine={false} 
                              axisLine={false}
                              tickFormatter={(val) => `R$${val}`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                              verticalAlign="top" 
                              height={36} 
                              iconType="circle"
                              iconSize={8}
                              formatter={(value) => {
                                if (value === 'original') return <span className="text-[10px] text-neutral-500 font-bold">Preço Original</span>;
                                if (value === 'value') return <span className="text-[10px] text-indigo-500 font-bold">Gasto Real (Pago)</span>;
                                if (value === 'savings') return <span className="text-[10px] text-emerald-500 font-bold">Economia</span>;
                                return value;
                              }}
                            />
                            <Bar dataKey="original" fill={theme === 'dark' ? '#1f2937' : '#e2e8f0'} radius={[3, 3, 0, 0]} maxBarSize={16} />
                            <Bar dataKey="value" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={16} />
                            <Bar dataKey="savings" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={16} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Detailed Category Breakdown List & Insight Banner */}
                  <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                    <div className="bg-neutral-50/20 dark:bg-neutral-950/10 rounded-xl p-4 border border-neutral-150/40 dark:border-white/[0.02] flex-1 flex flex-col">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3 block">
                        Participação por Categoria
                      </h4>
                      
                      <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin flex-1">
                        {stats.categoryData.map((cat, idx) => (
                          <div 
                            key={`chart-detailed-${cat.id}-${idx}`} 
                            className="group/item flex flex-col gap-1.5 transition-all duration-200"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <span 
                                  className="w-5.5 h-5.5 rounded-md flex items-center justify-center text-xs shadow-sm border border-neutral-200/40 dark:border-white/[0.04]"
                                  style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                                >
                                  {cat.icon}
                                </span>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-neutral-700 dark:text-neutral-200 truncate">
                                    {cat.name}
                                  </span>
                                  <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-semibold leading-none">
                                    {cat.count} {cat.count === 1 ? 'compra' : 'compras'}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end shrink-0 font-mono">
                                <span className="text-neutral-800 dark:text-neutral-200 font-bold">
                                  R$ {cat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 dark:text-neutral-500 font-bold">
                                  <span>{cat.percentage.toFixed(1)}% do total</span>
                                  {cat.savings > 0 && (
                                    <span className="text-emerald-500 font-black">(-R${cat.savings.toFixed(0)})</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Percentage dynamic progress bar */}
                            <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${cat.percentage}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: cat.color }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dynamic Intelligent Insights Box */}
                    <div className="p-4 rounded-xl bg-gradient-to-tr from-indigo-500/5 to-indigo-600/[0.02] dark:from-indigo-500/10 dark:to-transparent border border-indigo-500/20 dark:border-indigo-500/10 flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h5 className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          Insight Financeiro
                        </h5>
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed font-semibold">
                          {stats.totalSavings > 0 ? (
                            <span>
                              Incrível! Você já economizou um total de <strong className="text-emerald-600 dark:text-emerald-400 font-mono">R$ {stats.totalSavings.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</strong> nesta seleção de filtros, representando <strong className="font-mono">{stats.savingsPercentage.toFixed(1)}%</strong> de desconto obtido sobre o preço original de venda!
                            </span>
                          ) : (
                            <span>
                              Suas compras ativas estão totalizando <strong className="font-mono">R$ {stats.totalSpent.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</strong>. Adicione cupons ou registre preços originais para acompanhar sua economia média e taxas de descontos obtidos!
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
