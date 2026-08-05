import { safeUrl } from "../lib/utils";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Platform, Purchase, PurchaseStatus, Category, Tag as TagType, Status } from '../types';
import {
  Search,
  SlidersHorizontal,
  Calendar,
  ExternalLink,
  ChevronRight,
  ShoppingBag,
  DollarSign,
  Package,
  CheckCircle,
  Truck,
  ArrowUpDown,
  Tag,
  Eye,
  Plus,
  CreditCard,
  Receipt,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FullScreenCarousel } from './FullScreenCarousel';
import { getPlatformColor, getInitials, getDomainFromInput, getLogoUrl } from '../utils/logoHelper';

interface PurchasesViewProps {
  platforms: Platform[];
  categories: Category[];
  statuses: Status[];
  tags: TagType[]; // Enhanced tags
  onViewPurchase: (platformId: string, purchase: Purchase) => void;
  onEditPurchase: (platformId: string, purchase: Purchase) => void;
  onAddPurchase: (platformId: string) => void;
  highlightedPurchaseId?: string | null;
  onClearHighlight?: () => void;
  initialSearchQuery?: string;
  onClearInitialSearch?: () => void;
}

const formatImageUrl = (url: string) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('https://corsproxy.io/')) {
    return trimmed;
  }
  if (trimmed.startsWith('/api/proxy-image?url=')) {
    const extracted = decodeURIComponent(trimmed.replace('/api/proxy-image?url=', ''));
    if (extracted) return `https://corsproxy.io/?${encodeURIComponent(extracted)}`;
    return trimmed;
  }

  let rawUrl = trimmed;
  if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
    if (rawUrl.startsWith('//')) {
      rawUrl = `https:${rawUrl}`;
    } else {
      const cleanHash = rawUrl.replace(/^\/?(file\/)?/, '');
      rawUrl = `https://down-br.img.susercontent.com/file/${cleanHash}`;
    }
  }

  return `https://corsproxy.io/?${encodeURIComponent(rawUrl)}`;
};

const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  target.style.opacity = '0.3';
};

const CardCarousel = ({ images, productName, onOpenFullScreen }: { images: string[]; productName: string, onOpenFullScreen: (index: number) => void }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="w-full flex flex-col bg-black">
      <div className="w-full h-52 relative group/carousel overflow-hidden flex items-center justify-center bg-black/40">
        {/* Blurred Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center blur-2xl opacity-20 transition-all duration-500"
          style={{ backgroundImage: `url(${formatImageUrl(images[currentIndex])})` }}
        />
        {/* Image Container */}
        <motion.div 
          className="relative w-full h-full flex items-center justify-center p-4 z-10 cursor-pointer" 
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.x > 50) prev(null as any);
            else if (info.offset.x < -50) next(null as any);
          }}
          onClick={() => onOpenFullScreen(currentIndex)}
          initial={false}
          animate={{ x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <motion.img
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            src={formatImageUrl(images[currentIndex])}
            referrerPolicy="no-referrer"
            onError={handleImgError}
            alt={`${productName} - Foto ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain select-none shadow-2xl rounded-sm"
          />
        </motion.div>
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="h-14 flex items-center gap-2 px-3 overflow-x-auto scrollbar-hide border-t border-neutral-100 dark:border-[#2a2d40]/40">
          {images.map((img, i) => (
            <button
              key={`thumb-${i}`}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(i);
              }}
              className={`w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer transition-all border-2 ${
                currentIndex === i 
                  ? 'border-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)] scale-105' 
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img referrerPolicy="no-referrer" src={formatImageUrl(img)} onError={handleImgError} alt="Foto do produto" className="w-full h-full object-cover"/>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const SearchableFilterSelect = ({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string; icon?: string }[];
  placeholder: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  const filteredOptions = useMemo(() => {
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(filterQuery.toLowerCase())
    );
  }, [options, filterQuery]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`flex flex-col gap-1 relative select-none ${isOpen ? 'z-[70]' : 'z-10'}`}>
      <label className="text-[10px] font-bold text-neutral-400 uppercase">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 px-3 rounded-lg border border-neutral-200 text-xs bg-neutral-50 text-neutral-700 dark:bg-[#0a0a0a] dark:border-white/[0.08] dark:text-neutral-300 focus:outline-none flex items-center justify-between cursor-pointer w-full"
      >
        <span className="truncate flex items-center gap-1.5">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="text-[10px] text-neutral-400 shrink-0">▼</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setFilterQuery(''); }} />
          <div className="absolute top-[54px] left-0 right-0 max-h-60 overflow-y-auto bg-white dark:bg-[#050505] border border-neutral-200 dark:border-white/[0.08] rounded-lg shadow-xl z-50 p-2 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="relative shrink-0">
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Pesquisar..."
                className="w-full h-8 pl-7 pr-3.5 rounded-md text-[11px] bg-neutral-50 border border-neutral-100 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 dark:bg-[#0a0a0a] dark:border-white/[0.08] dark:text-neutral-200"
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto pr-0.5 scrollbar-thin">
              {filteredOptions.length === 0 ? (
                <span className="text-[10px] text-neutral-400 text-center py-2 italic">Nenhuma opção</span>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSel = opt.value === value;
                  return (
                    <button
                      key={`${opt.value}-${idx}`}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                        setFilterQuery('');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isSel
                          ? 'bg-indigo-500 text-white font-semibold'
                          : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#111219]/80'
                      }`}
                    >
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <span className="truncate">{opt.label}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const STATUS_LIST = [
  { value: 'todos', label: 'Todos os Status' },
];

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  platforms,
  categories,
  statuses,
  tags,
  onViewPurchase,
  onEditPurchase,
  onAddPurchase,
  highlightedPurchaseId,
  onClearHighlight,
}) => {
  // Filters State
  const [search, setSearch] = useState('');

  // Scroll to highlighted purchase
  React.useEffect(() => {
    if (highlightedPurchaseId) {
      // Small delay to ensure the view has rendered
      const timer = setTimeout(() => {
        const element = document.getElementById(`purchase-card-${highlightedPurchaseId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Clear highlight after 3 seconds
          const clearTimer = setTimeout(() => {
            if (onClearHighlight) onClearHighlight();
          }, 3000);
          
          return () => clearTimeout(clearTimer);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [highlightedPurchaseId, onClearHighlight]);

  const cycleStatus = (e: React.MouseEvent, platformId: string, purchase: Purchase) => {
    e.stopPropagation();
    const sequence = statuses.map(s => s.id);
    const currentIndex = sequence.indexOf(purchase.status as any);
    
    // If it's not in the list, go to the first one
    // If it's the last one, go back to start
    const nextIndex = (currentIndex + 1) % sequence.length;
    const nextStatus = sequence[nextIndex];

    const updatedPurchase = { 
      ...purchase, 
      status: nextStatus,
      // Auto-set delivery date if it's the last one in the sequence and not already set
      deliveryDate: nextIndex === sequence.length - 1 && !purchase.deliveryDate 
        ? new Date().toISOString().substring(0, 10) 
        : purchase.deliveryDate
    };
    
    onEditPurchase(platformId, updatedPurchase);
  };

  const cycleBundleItemStatus = (e: React.MouseEvent, platformId: string, purchase: Purchase, itemIndex: number) => {
    e.stopPropagation();
    if (!purchase.bundleItems) return;
    const sequence = statuses.map(s => s.id);
    const item = purchase.bundleItems[itemIndex];
    const currentIndex = sequence.indexOf((item.status || 'pedido_feito') as any);
    const nextIndex = (currentIndex + 1) % sequence.length;
    const nextStatus = sequence[nextIndex];

    const updatedBundleItems = [...purchase.bundleItems];
    updatedBundleItems[itemIndex] = {
      ...item,
      status: nextStatus
    };

    const updatedPurchase = {
      ...purchase,
      bundleItems: updatedBundleItems
    };
    
    onEditPurchase(platformId, updatedPurchase);
  };
  const [platformFilter, setPlatformFilter] = useState('todos');
  const [profileFilter, setProfileFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [tagFilter, setTagFilter] = useState('todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState<'date_desc' | 'date_asc' | 'price_desc' | 'price_asc'>('date_desc');
  const [showFilters, setShowFilters] = useState(false);
  const [fullScreenCarousel, setFullScreenCarousel] = useState<{images: string[]; initialIndex: number} | null>(null);

  const openFullScreen = (images: string[], index: number) => {
    setFullScreenCarousel({ images, initialIndex: index });
  };

  // Flat list of all purchases across all platforms
  const allPurchases = useMemo(() => {
    const list: Array<Purchase & { platformId: string; platformName: string; platformLogo: string; platformUrl: string }> = [];
    platforms.forEach((plat) => {
      plat.purchases.forEach((pur) => {
        list.push({
          ...pur,
          platformId: plat.id,
          platformName: plat.name,
          platformLogo: plat.logoUrl || '',
          platformUrl: plat.url,
        });
      });
    });
    return list;
  }, [platforms]);

  // Unique Tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    allPurchases.forEach(p => p.tags?.forEach(t => tagsSet.add(t)));
    return Array.from(tagsSet).sort();
  }, [allPurchases]);

  // List of all unique profiles across platforms for the buyer filter
  const allProfiles = useMemo(() => {
    const profilesMap = new Map<string, { id: string; name: string; avatar: any }>();
    platforms.forEach((p) => {
      p.profiles.forEach((prof) => {
        profilesMap.set(prof.id, {
          id: prof.id,
          name: prof.name,
          avatar: prof.avatar,
        });
      });
    });
    return Array.from(profilesMap.values());
  }, [platforms]);

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    let result = [...allPurchases];

    // Search Query (product name or platform name)
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.productName.toLowerCase().includes(q) ||
          p.platformName.toLowerCase().includes(q) ||
          (p.notes && p.notes.toLowerCase().includes(q)) ||
          (p.tags && p.tags.some(tId => {
            const tag = tags.find(tg => tg.id === tId);
            return tag?.name.toLowerCase().includes(q);
          }))
      );
    }

    // Platform Filter
    if (platformFilter !== 'todos') {
      result = result.filter((p) => p.platformId === platformFilter);
    }

    // Buyer Profile Filter
    if (profileFilter !== 'todos') {
      result = result.filter((p) => p.profileId === profileFilter);
    }

    // Status Filter
    if (statusFilter !== 'todos') {
      result = result.filter((p) => p.status === statusFilter);
    }

    // Tag Filter
    if (tagFilter !== 'todos') {
      result = result.filter((p) => p.tags?.includes(tagFilter));
    }

    // Date Range Filter
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter((p) => new Date(p.date) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((p) => new Date(p.date) <= end);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortOrder === 'date_desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortOrder === 'date_asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortOrder === 'price_desc') {
        return b.finalPrice - a.finalPrice;
      }
      if (sortOrder === 'price_asc') {
        return a.finalPrice - b.finalPrice;
      }
      return 0;
    });

    return result;
  }, [allPurchases, search, platformFilter, profileFilter, statusFilter, tagFilter, tags, sortOrder]);

  // Dynamic Bento stats calculation
  const stats = useMemo(() => {
    const totalSpent = filteredPurchases.reduce((acc, p) => acc + p.finalPrice, 0);
    const deliveredStatus = statuses.find(s => s.label.toLowerCase() === 'entregue' || s.id === 'entregue');
    const deliveredCount = filteredPurchases.filter((p) => p.status === (deliveredStatus?.id || 'entregue')).length;
    const pendingCount = filteredPurchases.length - deliveredCount;

    return {
      totalCount: filteredPurchases.length,
      totalSpent,
      pendingCount,
      deliveredCount,
    };
  }, [filteredPurchases, statuses]);

  const getStatusLabel = (statusId: string) => {
    return statuses.find(s => s.id === statusId)?.label || statusId;
  };

  const getStatusColor = (statusId: string) => {
    return statuses.find(s => s.id === statusId)?.color || '#94a3b8';
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Dynamic Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spent */}
        <div className="bg-white dark:bg-[#0d0d0d] p-5 rounded-2xl border border-neutral-200/80 dark:border-white/[0.06] shadow-sm flex items-center justify-between transition-all duration-300 hover:border-neutral-300 dark:hover:border-white/[0.12] group/stat">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 dark:text-neutral-500 group-hover/stat:text-indigo-500 transition-colors">Total Investido</span>
            <h3 className="text-xl font-bold text-neutral-800 dark:text-white mt-1 font-mono">
              R$ {stats.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* Total Items */}
        <div className="bg-white dark:bg-[#0d0d0d] p-5 rounded-2xl border border-neutral-200/80 dark:border-white/[0.06] shadow-sm flex items-center justify-between transition-all duration-300 hover:border-neutral-300 dark:hover:border-white/[0.12] group/stat">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 dark:text-neutral-500 group-hover/stat:text-indigo-500 transition-colors">Compras Registradas</span>
            <h3 className="text-xl font-bold text-neutral-800 dark:text-white mt-1 font-mono">
              {stats.totalCount} {stats.totalCount === 1 ? 'item' : 'itens'}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-inner">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Delivery */}
        <div className="bg-white dark:bg-[#0d0d0d] p-5 rounded-2xl border border-neutral-200/80 dark:border-white/[0.06] shadow-sm flex items-center justify-between transition-all duration-300 hover:border-neutral-300 dark:hover:border-white/[0.12] group/stat">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 dark:text-neutral-500 group-hover/stat:text-indigo-500 transition-colors">A Caminho</span>
            <h3 className="text-xl font-bold text-neutral-800 dark:text-white mt-1 font-mono">
              {stats.pendingCount} pendentes
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Delivered count */}
        <div className="bg-white dark:bg-[#0d0d0d] p-5 rounded-2xl border border-neutral-200/80 dark:border-white/[0.06] shadow-sm flex items-center justify-between transition-all duration-300 hover:border-neutral-300 dark:hover:border-white/[0.12] group/stat">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 dark:text-neutral-500 group-hover/stat:text-indigo-500 transition-colors">Entregues</span>
            <h3 className="text-xl font-bold text-neutral-800 dark:text-white mt-1 font-mono">
              {stats.deliveredCount} concluídas
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Panel: Search & Filters Toggle */}
      <div className="bg-white dark:bg-[#0d0d0d] p-4 rounded-2xl border border-neutral-200/80 dark:border-white/[0.06] shadow-sm flex flex-col gap-4 overflow-visible relative z-[40]">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar pelo nome do produto, plataforma ou observações..."
              className="w-full h-11 pl-10 pr-4 rounded-xl text-xs sm:text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 dark:bg-[#141414] dark:border-white/[0.06] dark:text-neutral-100 dark:placeholder-neutral-600 transition-all focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>

          <div className="flex items-center gap-2.5">
            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-11 px-4 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                showFilters || platformFilter !== 'todos' || profileFilter !== 'todos' || statusFilter !== 'todos' || tagFilter !== 'todos' || startDate !== '' || endDate !== ''
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:bg-[#050505] dark:border-white/[0.08] dark:text-neutral-400 dark:hover:bg-white/[0.02]'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filtros</span>
              {(platformFilter !== 'todos' || profileFilter !== 'todos' || statusFilter !== 'todos' || tagFilter !== 'todos' || startDate !== '' || endDate !== '') && (
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="h-11 px-4 rounded-xl border border-neutral-200 text-xs font-semibold bg-white text-neutral-600 hover:bg-neutral-50 focus:outline-none focus:border-indigo-500 dark:bg-[#050505] dark:border-white/[0.08] dark:text-neutral-400 dark:hover:bg-white/[0.02] cursor-pointer appearance-none pr-8"
              >
                <option value="date_desc">Mais Recentes</option>
                <option value="date_asc">Mais Antigas</option>
                <option value="price_desc">Preço: Maior primeiro</option>
                <option value="price_asc">Preço: Menor primeiro</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-400">
                <ArrowUpDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible advanced filters tray */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="relative z-[60] overflow-visible"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-3.5 border-t border-neutral-100 dark:border-neutral-800/50">
                {/* Platform Filter */}
                <SearchableFilterSelect
                  label="Filtrar por Loja/Plataforma"
                  value={platformFilter === 'todas' ? 'filter-all-platforms' : platformFilter}
                  onChange={(val) => setPlatformFilter(val === 'filter-all-platforms' ? 'todas' : val)}
                  options={[
                    { value: 'filter-all-platforms', label: 'Todas as Plataformas' },
                    ...platforms.map((p) => ({ value: p.id, label: p.name })),
                  ]}
                  placeholder="Selecione uma loja..."
                />

                {/* Profile Filter */}
                <SearchableFilterSelect
                  label="Filtrar por Comprador"
                  value={profileFilter === 'todos' ? 'filter-all-profiles' : profileFilter}
                  onChange={(val) => setProfileFilter(val === 'filter-all-profiles' ? 'todos' : val)}
                  options={[
                    { value: 'filter-all-profiles', label: 'Todos os Perfis' },
                    ...allProfiles.map((p) => ({ 
                      value: p.id, 
                      label: p.name, 
                      icon: p.avatar?.type === 'emoji' ? p.avatar.value : undefined 
                    })),
                  ]}
                  placeholder="Selecione um perfil..."
                />

                {/* Status Filter */}
                <SearchableFilterSelect
                  label="Filtrar por Status"
                  value={statusFilter === 'todos' ? 'filter-all-statuses' : statusFilter}
                  onChange={(val) => setStatusFilter(val === 'filter-all-statuses' ? 'todos' : val)}
                  options={[
                    { value: 'filter-all-statuses', label: 'Todos os Status' },
                    ...statuses.map((s) => ({ value: s.id, label: s.label })),
                  ]}
                  placeholder="Selecione um status..."
                />

                {/* Tag Filter */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Filtrar por Tag</label>
                  <SearchableFilterSelect
                    label=""
                    value={tagFilter === 'todos' ? 'filter-all-tags' : tagFilter}
                    onChange={(val) => setTagFilter(val === 'filter-all-tags' ? 'todos' : val)}
                    options={[
                      { value: 'filter-all-tags', label: 'Todas as Tags' },
                      ...tags.map((t) => ({ value: t.id, label: t.name, icon: t.emoji })),
                    ]}
                    placeholder="Selecione uma tag..."
                  />
                </div>

                {/* Date Filters */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">De (Data Inicial)</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-xs bg-neutral-50 text-neutral-700 dark:bg-[#000000] dark:border-white/[0.08] dark:text-neutral-300 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Até (Data Final)</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-xs bg-neutral-50 text-neutral-700 dark:bg-[#000000] dark:border-white/[0.08] dark:text-neutral-300 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Grid List */}
      <AnimatePresence mode="popLayout">
        {filteredPurchases.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center py-24 bg-neutral-900/20 rounded-2xl border border-dashed border-neutral-800 text-center"
          >
            <Package className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mb-3" />
            <h3 className="font-semibold text-neutral-700 dark:text-neutral-300 text-sm">
              Nenhuma compra encontrada
            </h3>
            <p className="text-neutral-500 text-xs mt-1 max-w-xs">
              Ajuste seus filtros ou adicione compras clicando na aba compras de qualquer plataforma.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPurchases.map((purchase, pIdx) => {
              const platform = platforms.find((p) => p.id === purchase.platformId);
              const buyerProfile = platform?.profiles.find((pr) => pr.id === purchase.profileId);
              const domain = platform ? getDomainFromInput(platform.name, platform.url) : '';

              return (
                <motion.div
                  key={`pur-card-${purchase.platformId}-${purchase.id}-${pIdx}`}
                  id={`purchase-card-${purchase.id}`}
                  layoutId={`purchase-card-${purchase.id}`}
                  className={`bg-[#0d0d0d] border rounded-2xl overflow-hidden transition-all duration-300 shadow-[0_15px_40px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.6)] hover:border-white/[0.1] flex flex-col group ${
                    highlightedPurchaseId === purchase.id
                      ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-[0_0_20px_rgba(79,70,229,0.3)]'
                      : 'border-white/[0.05]'
                  }`}
                >
                  {/* Card Header (Date & Tags) */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.03] bg-white/[0.01]">
                    <span className="font-mono text-[10px] text-neutral-500 font-bold uppercase tracking-tighter">
                      {new Date(purchase.date).toLocaleDateString('pt-BR')}
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide max-w-[70%]">
                      {purchase.tags && purchase.tags.length > 0 ? (
                        purchase.tags.map((tId, idx) => {
                          const tag = tags.find((tg) => tg.id === tId);
                          if (!tag) return null;
                          return (
                            <span 
                                key={`pur-tag-${purchase.id}-${tId}-${idx}`}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tight shadow-sm shrink-0 border"
                              style={{ backgroundColor: `${tag.color}15`, borderColor: `${tag.color}30`, color: tag.color }}
                            >
                              <span>{tag.emoji}</span>
                              <span className="truncate max-w-[50px]">{tag.name}</span>
                            </span>
                          );
                        })
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800/50 flex items-center justify-center border border-neutral-200/50 dark:border-neutral-700/50">
                          <Tag className="w-3.5 h-3.5 text-neutral-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Main Product Image Carousel */}
                  {purchase.productImages && purchase.productImages.length > 0 && (
                    <CardCarousel 
                      images={purchase.productImages} 
                      productName={purchase.productName} 
                      onOpenFullScreen={(index) => setFullScreenCarousel({ images: purchase.productImages!, initialIndex: index })} 
                    />
                  )}

                  {/* FullScreen Modal Helper (This is usually better outside the map, but we'll keep it as a trigger) */}

                  {/* Info Content */}
                  <div className="p-4 sm:p-5 flex flex-col gap-4">
                    {/* Platform Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Logo container - Standardized App Icon Style */}
                        <div className="w-8 h-8 rounded-lg bg-[#141414] flex items-center justify-center overflow-hidden shrink-0 shadow-[0_6px_12px_-4px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/10 transition-transform hover:scale-105 active:scale-95 group">
                          <img referrerPolicy="no-referrer"
                            src={getLogoUrl(purchase.platformName, purchase.platformUrl)}
                            alt={purchase.platformName}
                            className="w-full h-full object-cover pointer-events-none transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              if (target.parentElement) {
                                target.parentElement.style.backgroundColor = getPlatformColor(purchase.platformName);
                                const span = document.createElement('span');
                                span.className = "text-white font-extrabold text-[9px] tracking-tight";
                                span.textContent = getInitials(purchase.platformName);
                                target.parentElement.appendChild(span);
                              }
                            }}
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white tracking-tight group-hover:text-indigo-400 transition-colors">
                            {purchase.platformName}
                          </span>
                          <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mt-0.5">
                            {purchase.category || 'Geral'}
                          </span>
                        </div>
                      </div>

                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          cycleStatus(e, purchase.platformId, purchase);
                        }}
                        className="text-[9px] px-3 py-1.5 rounded-lg font-extrabold uppercase tracking-widest shadow-lg transition-all active:scale-90 cursor-pointer hover:brightness-110 relative z-30 border"
                        style={{
                          backgroundColor: `${getStatusColor(purchase.status)}15`,
                          borderColor: `${getStatusColor(purchase.status)}40`,
                          color: getStatusColor(purchase.status)
                        }}
                        title="Clique para mudar o status"
                      >
                        {getStatusLabel(purchase.status)}
                      </button>
                    </div>

                    {/* Product Title & Link */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1.5 min-w-0">
                        {purchase.purchaseType === 'subscription' && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-purple-100 text-purple-700 border border-purple-200/50 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-500/20 w-fit">
                            <CreditCard className="w-2.5 h-2.5" />
                            Assinatura
                          </span>
                        )}
                        {purchase.purchaseType === 'single' && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-700 border border-indigo-200/50 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-500/20 w-fit">
                            <ShoppingBag className="w-2.5 h-2.5" />
                            Compra
                          </span>
                        )}
                        <h4 className="font-sans font-bold text-base text-neutral-800 dark:text-neutral-50 leading-tight">
                          {purchase.productName}
                        </h4>
                      </div>
                      {purchase.productLink && (
                        <a
                          href={safeUrl(purchase.productLink)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-500 hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-400 transition-all shrink-0 cursor-pointer shadow-sm border border-neutral-200 dark:border-neutral-700"
                          title="Ver produto"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    {/* Tracking Code / Notes Box */}
                    {purchase.notes && (
                      <div className="bg-neutral-50 dark:bg-neutral-900/60 rounded-xl p-2.5 border border-neutral-100 dark:border-neutral-800/50">
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 italic leading-relaxed">
                          {purchase.notes}
                        </p>
                      </div>
                    )}

                    {/* Bundle Items Box */}
                    {purchase.isBundle && purchase.bundleItems && purchase.bundleItems.length > 0 && (
                      <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl p-3 border border-indigo-100 dark:border-indigo-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <ShoppingBag className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                            Itens do Conjunto
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {purchase.bundleItems.map((item, idx) => {
                            const itemStatus = item.status || 'pedido_feito';
                            const hasPrice = item.price !== undefined && item.price !== null && item.price > 0;
                            return (
                              <div key={item.id ? `${item.id}-${idx}` : `bi-${purchase.id}-${idx}-${item.name}`} className="flex justify-between items-center text-[11px] py-1 border-b border-indigo-500/10 last:border-0">
                                <div className="flex items-center gap-2 max-w-[200px]">
                                  <button
                                    type="button"
                                    onClick={(e) => cycleBundleItemStatus(e, purchase.platformId, purchase, idx)}
                                    className="w-2.5 h-2.5 rounded-full shrink-0 border transition-transform hover:scale-125 cursor-pointer"
                                    style={{
                                      backgroundColor: `${getStatusColor(itemStatus)}20`,
                                      borderColor: getStatusColor(itemStatus)
                                    }}
                                    title={`${getStatusLabel(itemStatus)} - Clique para mudar`}
                                  />
                                  {item.image && (
                                    <div 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const itemImages = item.images && item.images.length > 0 ? item.images : [item.image!];
                                        openFullScreen(itemImages, 0);
                                      }}
                                      className="w-5 h-5 rounded overflow-hidden shrink-0 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60 shadow-sm cursor-pointer hover:opacity-85 transition-opacity relative group"
                                      title="Ver em tela cheia"
                                    >
                                      <img referrerPolicy="no-referrer" src={formatImageUrl(item.image)} onError={handleImgError} alt={item.name || "Item"} className="w-full h-full object-cover pointer-events-none"/>
                                      {item.images && item.images.length > 1 && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[8px] font-extrabold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                          +{item.images.length}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  <span className="text-neutral-700 dark:text-neutral-300 font-medium truncate">
                                    {item.name || `Item ${idx + 1}`}
                                  </span>
                                  {item.link && (
                                    <a
                                      href={safeUrl(item.link)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-indigo-500 hover:text-indigo-600 transition-colors shrink-0"
                                      title="Ver produto"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  {hasPrice && (
                                    <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">
                                      R$ {(item.price || 0).toFixed(2).replace('.', ',')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Comprado Date Line */}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-neutral-500 dark:text-neutral-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500/80" />
                        <span>Comprado: <span className="font-bold text-neutral-700 dark:text-neutral-200">{new Date(purchase.date).toLocaleDateString('pt-BR')}</span></span>
                      </div>
                      {purchase.deliveryDate && (
                        <div className="flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Entregue: <span className="font-bold text-emerald-600 dark:text-emerald-400">{new Date(purchase.deliveryDate).toLocaleDateString('pt-BR')}</span></span>
                        </div>
                      )}
                    </div>

                    {/* Payment Info Pill */}
                    {purchase.paymentMethod && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100/50 dark:bg-neutral-800/40 border border-neutral-200/50 dark:border-neutral-700/30 w-fit">
                        <CreditCard className="w-3.5 h-3.5 text-neutral-400" />
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="font-bold text-neutral-600 dark:text-neutral-300">
                            {purchase.paymentMethod === 'cartao' ? 'Cartão de Crédito' : 
                             purchase.paymentMethod === 'parcelada' ? 'Parcelado' : 
                             purchase.paymentMethod === 'conta' ? 'Conta Bancária' : purchase.paymentMethod}
                          </span>
                          {purchase.cardName && <span className="text-indigo-500 font-black">[{purchase.cardName}]</span>}
                          {purchase.bankName && <span className="text-neutral-400 font-medium">({purchase.bankName})</span>}
                          {purchase.installments && purchase.installments > 1 && (
                            <span className="bg-indigo-500 text-white px-1.5 py-0.5 rounded text-[8px] font-black">{purchase.installments}x</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Footer: Buyer & Pricing */}
                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {buyerProfile && (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase shadow-md border-2 border-white dark:border-neutral-800"
                            style={{
                              backgroundColor:
                              buyerProfile.avatar.bgColor || (buyerProfile.avatar.type === 'color'
                                ? buyerProfile.avatar.value
                                : '#4f46e5'),
                            }}
                          >
                            {buyerProfile.avatar.type === 'emoji' ? buyerProfile.avatar.value : buyerProfile.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-bold text-neutral-600 dark:text-neutral-200">
                          {buyerProfile ? buyerProfile.name : 'Outro'}
                        </span>
                      </div>

                      <div className="flex flex-col items-end">
                        {purchase.discount > 0 && (
                          <span className="text-[10px] text-rose-500 font-bold line-through font-mono opacity-80 mb-0.5">
                            R$ {purchase.originalPrice.toFixed(2)}
                          </span>
                        )}
                        <span className="text-lg font-black text-indigo-600 dark:text-blue-400 font-mono tracking-tighter">
                          R$ {purchase.finalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="pt-0.5 flex items-center justify-end">
                      <button
                        onClick={() => onViewPurchase(purchase.platformId, purchase)}
                        className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl text-[10px] font-bold uppercase tracking-widest text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 border border-neutral-200/50 dark:border-neutral-700/50 transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Detalhes / Editar</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {fullScreenCarousel && (
          <FullScreenCarousel
            images={fullScreenCarousel.images}
            initialIndex={fullScreenCarousel.initialIndex}
            onClose={() => setFullScreenCarousel(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
