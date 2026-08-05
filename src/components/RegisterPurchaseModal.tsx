import React, { useState, useEffect, useRef } from 'react';
import { resizeImage } from "../utils/imageHelper";
import { Platform, Profile, Purchase, PurchaseStatus, Tag, Status, BundleItem } from '../types';
import { X, ShoppingBag, Link, CreditCard, Receipt, AlignLeft, Trash2, Image as ImageIcon, Upload, Loader2, Sparkles, ExternalLink, Plus, Settings2, Check, Pencil, Palette, Building2, CreditCard as CardIcon, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../context/ToastContext';
import { FullScreenCarousel } from './FullScreenCarousel';

// Color wheel helpers
const hexToHsv = (hex: string): { h: number; s: number; v: number } => {
  let r = 0, g = 0, b = 0;
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  } else {
    return { h: 0, s: 0, v: 1 };
  }

  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s, v };
};

const getIndicatorCoords = (color: string, radius: number = 64) => {
  const { h, s } = hexToHsv(color);
  const angle = (h / 360) * (Math.PI * 2) - Math.PI;
  const dist = s * radius;
  return {
    x: radius + Math.cos(angle) * dist,
    y: radius + Math.sin(angle) * dist,
  };
};

const hsvToRgb = (h: number, s: number, v: number): [number, number, number] => {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
};

const PRESET_EMOJIS = ['🏷️', '💻', '🏠', '🎁', '⚡', '📦', '📱', '🎮', '🚗', '🍔', '✈️', '📁'];
const PRESET_COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

interface RegisterPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: Platform | null;
  purchase: Purchase | null; // If null, mode is "add"
  onSave: (purchaseData: Omit<Purchase, 'id'>) => void;
  onEdit: (purchaseId: string, purchaseData: Partial<Purchase>) => void;
  onDelete?: (purchaseId: string) => void;
  onAddProfile?: (platformId: string) => void; // New prop to create profile from here
  availableTags: Tag[];
  availableStatuses: Status[];
  onAddTag: (tag: Omit<Tag, 'id'>) => void;
  onUpdateTag: (id: string, updated: Partial<Tag>) => void;
  onDeleteTag: (id: string) => void;
}

export const RegisterPurchaseModal: React.FC<RegisterPurchaseModalProps> = ({
  isOpen,
  onClose,
  platform,
  purchase,
  onSave,
  onEdit,
  onDelete,
  onAddProfile,
  availableTags,
  availableStatuses,
  onAddTag,
  onUpdateTag,
  onDeleteTag,
}) => {
  const isEditMode = !!purchase;
  const { addToast } = useToast();

  // Form states
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [productLink, setProductLink] = useState('');
  const [productName, setProductName] = useState('');
  const [status, setStatus] = useState<PurchaseStatus>('pedido_feito');
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [productImages, setProductImages] = useState<string[]>([]);
  const [isPulling, setIsPulling] = useState(false);
  const [pullingBundleIndices, setPullingBundleIndices] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ productName?: string; originalPrice?: string; finalPrice?: string }>({});

  // New dates & payment fields
  const [purchaseDate, setPurchaseDate] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [bankName, setBankName] = useState('');
  const [installments, setInstallments] = useState<number>(1);
  const [cardName, setCardName] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  // New quantity and tags fields
  const [quantity, setQuantity] = useState<number>(1);
  const [isBundle, setIsBundle] = useState(false);
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState('');
  const [fullScreenCarousel, setFullScreenCarousel] = useState<{images: string[]; initialIndex: number} | null>(null);
  const [purchaseType, setPurchaseType] = useState<'single' | 'subscription'>('single');

  const getLinkWarning = (url: string) => {
    if (!url) return null;
    const lower = url.toLowerCase();
    
    if (lower.includes("shp.ee") || lower.includes("shope.ee")) {
      return {
        title: "Links encurtados (shp.ee) não são suportados",
        body: "Por favor, abra o produto no navegador e copie o link completo da barra de endereço."
      };
    }

    if (lower.includes("mercadolivre.com") || lower.includes("mercadolivre.com.br") || lower.includes("mlb.link")) {
      return {
        title: "Aviso: Restrição de Imagens do Mercado Livre",
        body: "O Mercado Livre utiliza proteções ativas da Cloudflare e bloqueio de imagens externas (hotlinking) em links encurtados ou compartilhados diretamente de aplicativos móveis. Se a imagem do produto não carregar ou ficar preta, salve a foto do produto diretamente de sua fonte e faça o upload manual clicando em \"Enviar\"."
      };
    }

    if (lower.includes("aliexpress") || lower.includes("a.aliexpress.com")) {
      return {
        title: "Aviso: Proteção de Imagem do AliExpress",
        body: "O AliExpress bloqueia requisições automatizadas fora de seu ecossistema oficial e usa criptografia contra leitura de fotos externas (hotlinking). Se a imagem do produto não puder ser puxada automaticamente, salve o arquivo e envie manualmente clicando em \"Enviar\"."
      };
    }

    if (lower.includes("shein.com") || lower.includes("shein.top")) {
      return {
        title: "Aviso: Limitação de Imagens da Shein",
        body: "A Shein possui barreiras rígidas de segurança para impedir o rastreamento e exibição de fotos de produtos fora de seu app ou site oficial. Recomendamos salvar a imagem desejada e fazer o upload manual clicando em \"Enviar\"."
      };
    }

    if (lower.includes("maga.lu") || lower.includes("magazineluiza")) {
      return {
        title: "Aviso: Link do Magazine Luiza",
        body: "Links originados de aplicativos móveis (como o encurtador maga.lu) usam tokens temporários de sessão que expiram rapidamente e impedem o rastreamento externo de fotos de produtos. Por favor, envie a imagem manualmente clicando em \"Enviar\"."
      };
    }

    // Generic shorteners
    if (
      lower.includes("bit.ly") || 
      lower.includes("tinyurl.com") || 
      lower.includes("cutt.ly") || 
      lower.includes("rebrand.ly") || 
      lower.includes("is.gd") || 
      lower.includes("t.co") || 
      lower.includes("lnk.to")
    ) {
      return {
        title: "Link Encurtado Detectado",
        body: "Links encurtados dificultam o rastreamento direto de metadados e imagens por redirecionarem através de múltiplos servidores intermediários que protegem suas conexões contra robôs de leitura. Se as imagens não forem carregadas automaticamente, faça o upload da foto diretamente clicando em \"Enviar\"."
      };
    }

    return null;
  };

  const formatShopeeCdnUrl = (url: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('/api/proxy-image')) {
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

    return `/api/proxy-image?url=${encodeURIComponent(rawUrl)}`;
  };

  const getProxiedImageUrl = (url: string) => {
    return formatShopeeCdnUrl(url);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    target.style.opacity = '0.3';
  };
  
  // Tag creation/edit state
  const [isManagingTags, setIsManagingTags] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagEmoji, setNewTagEmoji] = useState('🏷️');
  const [newTagColor, setNewTagColor] = useState('#6366f1');
  const [showColorWheel, setShowColorWheel] = useState(false);

  const colorWheelRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDraggingRef = useRef(false);

  // Color wheel generator
  const drawColorWheel = () => {
    const canvas = colorWheelRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = width / 2;

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= radius) {
          let angle = Math.atan2(dy, dx) + Math.PI;
          const hue = (angle / (Math.PI * 2)) * 360;
          const sat = dist / radius;
          const val = 1.0;

          const rgb = hsvToRgb(hue, sat, val);
          const index = (y * width + x) * 4;
          data[index] = rgb[0];
          data[index + 1] = rgb[1];
          data[index + 2] = rgb[2];
          data[index + 3] = 255;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  };

  useEffect(() => {
    if (isOpen && showColorWheel) {
      const timer = setTimeout(() => {
        drawColorWheel();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, showColorWheel]);

  const handleColorSelection = (clientX: number, clientY: number) => {
    const canvas = colorWheelRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    try {
      const clampedX = Math.max(0, Math.min(canvas.width - 1, x * (canvas.width / rect.width)));
      const clampedY = Math.max(0, Math.min(canvas.height - 1, y * (canvas.height / rect.height)));
      
      const pixel = ctx.getImageData(clampedX, clampedY, 1, 1).data;
      if (pixel[3] > 0) {
        const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(val => {
          const hexStr = val.toString(16);
          return hexStr.length === 1 ? '0' + hexStr : hexStr;
        }).join('');
        setNewTagColor(hex);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    handleColorSelection(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      handleColorSelection(e.clientX, e.clientY);
    }
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    if (e.touches[0]) {
      handleColorSelection(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current && e.touches[0]) {
      handleColorSelection(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // Load purchase or reset defaults
  useEffect(() => {
    setShowDeleteConfirm(false);
    setIsManagingTags(false);
    setEditingTagId(null);
    setValidationErrors({});
    if (platform && platform.profiles.length > 0) {
      if (isEditMode && purchase) {
        setSelectedProfileId(purchase.profileId);
        setProductLink(purchase.productLink || '');
        setProductName(purchase.productName);
        setStatus(purchase.status);
        setOriginalPrice(purchase.originalPrice);
        setDiscount(purchase.discount);
        setFinalPrice(purchase.finalPrice);
        setNotes(purchase.notes || '');
        setProductImages(purchase.productImages || []);

        setPurchaseDate(purchase.date ? purchase.date.substring(0, 10) : new Date().toISOString().substring(0, 10));
        setPaymentDate(purchase.paymentDate ? purchase.paymentDate.substring(0, 10) : '');
        setPaymentMethod(purchase.paymentMethod || '');
        setBankName(purchase.bankName || '');
        setInstallments(purchase.installments || 1);
        setCardName(purchase.cardName || '');
        setDeliveryDate(purchase.deliveryDate ? purchase.deliveryDate.substring(0, 10) : '');

        setQuantity(purchase.quantity || 1);
        setIsBundle(purchase.isBundle || false);
        setBundleItems(purchase.bundleItems || []);
        setSelectedTagIds(purchase.tags || []);
        setPurchaseType(purchase.purchaseType || 'single');
      } else {
        setSelectedProfileId(platform.profiles[0].id);
        setProductLink('');
        setProductName('');
        setStatus('pedido_feito');
        setOriginalPrice(0);
        setDiscount(0);
        setFinalPrice(0);
        setNotes('');
        setProductImages([]);

        setPurchaseDate(new Date().toISOString().substring(0, 10));
        setPaymentDate('');
        setPaymentMethod('');
        setBankName('');
        setInstallments(1);
        setCardName('');
        setDeliveryDate('');

        setQuantity(1);
        setIsBundle(false);
        setBundleItems([]);
        setSelectedTagIds([]);
        setPurchaseType('single');
      }
    }
  }, [purchase, isOpen, isEditMode, platform]);

  // Recalculate final price when original or discount changes
  useEffect(() => {
    const calc = Math.max(0, (originalPrice || 0) - (discount || 0));
    setFinalPrice(calc);
  }, [originalPrice, discount]);

  // Auto-set delivery date when status changes to "entregue"
  useEffect(() => {
    if (status === 'entregue' && !deliveryDate) {
      setDeliveryDate(new Date().toISOString().substring(0, 10));
    }
  }, [status]);

  // Clear field errors as user typing corrects them
  useEffect(() => {
    if (validationErrors.productName && productName.trim().length >= 3) {
      setValidationErrors(prev => ({ ...prev, productName: undefined }));
    }
  }, [productName, validationErrors.productName]);

  useEffect(() => {
    if (validationErrors.originalPrice && originalPrice > 0) {
      setValidationErrors(prev => ({ ...prev, originalPrice: undefined }));
    }
  }, [originalPrice, validationErrors.originalPrice]);

  useEffect(() => {
    const calculatedFinalPrice = Math.max(0, originalPrice - discount);
    if (validationErrors.finalPrice && calculatedFinalPrice > 0) {
      setValidationErrors(prev => ({ ...prev, finalPrice: undefined }));
    }
  }, [originalPrice, discount, validationErrors.finalPrice]);

  const handlePriceChange = (valStr: string, setter: (val: number) => void) => {
    const numeric = parseFloat(valStr.replace(/[^\d.]/g, ''));
    if (!isNaN(numeric)) {
      setter(numeric);
    } else {
      setter(0);
    }
  };

  const getRootDomain = (url: string) => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      const hostname = urlObj.hostname.replace('www.', '');
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        // Handle common double extensions like .com.br
        const isDoubleExtension = ['com', 'org', 'net', 'gov', 'edu'].includes(parts[parts.length - 2]) && parts.length >= 3;
        if (isDoubleExtension) {
          return parts.slice(-3).join('.');
        }
        return parts.slice(-2).join('.');
      }
      return hostname;
    } catch (e) {
      return null;
    }
  };

  const puxarDadosScraper = async () => {
    if (!productLink || !productLink.includes("http")) {
      addToast('Por favor, insira um link válido do produto.', 'info');
      return;
    }

    const lowerLink = productLink.toLowerCase();
    if (lowerLink.includes("shp.ee") || lowerLink.includes("shope.ee")) {
      addToast("Links encurtados (shp.ee) não são suportados. Por favor, abra o produto no navegador e copie o link completo da barra de endereço.", "error");
      return;
    }

    setIsPulling(true);
    
    try {
      const shopeeApiKey = localStorage.getItem('shopee_api_key') || '';
      const response = await fetch("/api/fetch-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: productLink, apiKey: shopeeApiKey })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao buscar dados do produto");
      }

      const data = await response.json();
      
      if (data.resolvedUrl && data.resolvedUrl !== productLink) {
        setProductLink(data.resolvedUrl);
      }

      if (data.titulo && !productName.trim()) {
        setProductName(data.titulo);
      }

      const activeLink = data.resolvedUrl || productLink;
      const lowerLink = activeLink.toLowerCase();
      const isShopee = lowerLink.includes("shopee") || lowerLink.includes("shope.ee") || lowerLink.includes("shp.ee") || data.isShopee;
      const isML = lowerLink.includes("mercadolivre") || lowerLink.includes("mlb.link");
      const isAli = lowerLink.includes("aliexpress") || lowerLink.includes("a.aliexpress");
      const isShein = lowerLink.includes("shein") || lowerLink.includes("shein.top");
      const isMagalu = lowerLink.includes("maga.lu") || lowerLink.includes("magazineluiza");

      const isProtected = data.isProtected || isShopee || isML || isAli || isShein || isMagalu;

      if (data.imagens && Array.isArray(data.imagens) && data.imagens.length > 0) {
        setProductImages(data.imagens);
        addToast(`Título e ${data.imagens.length} imagens extraídos com sucesso! ✨`, "success");
      } else if (data.imagem) {
        setProductImages([data.imagem]);
        addToast("Título e imagem real extraídos com sucesso! ✨", "success");
      } else if (isProtected) {
        setProductImages([]);
        addToast("Título extraído! Por limitações de segurança da plataforma, adicione a imagem manualmente.", "warning");
      } else {
        setProductImages([]);
        addToast("Título extraído! Por restrições da plataforma, adicione a imagem manualmente.", "warning");
      }

    } catch (e: any) {
      console.error("Erro no processamento do link:", e);
      addToast(e.message || "Não foi possível identificar o link automaticamente.", "error");
    } finally {
      setIsPulling(false);
    }
  };

  const handleAutoPullImage = async () => {
    let itemsToPull = [];
    if (isBundle && bundleItems.length > 0) {
      itemsToPull = bundleItems.map(item => ({ name: item.name, link: item.link || '' }));
    } else {
      itemsToPull = [{ name: productName, link: productLink }];
    }

    if (itemsToPull.every(item => !item.name.trim() && !item.link.trim())) {
      addToast('Digite o nome do produto ou insira um link para puxar uma imagem!', 'info');
      return;
    }

    setIsPulling(true);
    try {
      // Clear existing images before pulling new ones
      setProductImages([]);
      const images: string[] = [];
      
      for (let i = 0; i < itemsToPull.length; i++) {
        const item = itemsToPull[i];
        
        // Simplesmente gera um placeholder estético baseado no nome ou loja
        const searchTerm = (item.name || "Product").toLowerCase();
        let placeholderImg = "https://images.unsplash.com/photo-1555529669-2269763671c0?auto=format&fit=crop&q=80&w=400"; // General

        if (searchTerm.includes("shopee") || item.link?.includes("shopee")) {
          continue; // Skip generating automatic image for Shopee
        } else if (searchTerm.includes("amazon") || item.link?.includes("amazon")) {
          placeholderImg = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400";
        } else if (searchTerm.includes("mercado") || item.link?.includes("mercadolivre")) {
          placeholderImg = "https://images.unsplash.com/photo-1566576721346-d4a3b4eaad5b?auto=format&fit=crop&q=80&w=400";
        } else if (searchTerm.includes("teclado") || searchTerm.includes("mouse") || searchTerm.includes("gamer") || searchTerm.includes("tech")) {
          placeholderImg = "https://images.unsplash.com/photo-1587829741301-dc798b83bac1?auto=format&fit=crop&q=80&w=400";
        }

        if (!images.includes(placeholderImg)) {
          images.push(placeholderImg);
        }
      }

      setProductImages(images);
      const hasProtected = itemsToPull.some(item => {
        const lowerName = (item.name || "").toLowerCase();
        const lowerLink = (item.link || "").toLowerCase();
        return lowerName.includes("aliexpress") || lowerLink.includes("aliexpress") || lowerLink.includes("a.aliexpress") ||
               lowerName.includes("shein") || lowerLink.includes("shein") || lowerLink.includes("shein.top") ||
               lowerName.includes("mercado") || lowerLink.includes("mercadolivre") || lowerLink.includes("mlb.link") ||
               lowerLink.includes("bit.ly") || lowerLink.includes("tinyurl") || lowerLink.includes("maga.lu");
      });
      if (hasProtected) {
        addToast('Imagens de plataformas protegidas ou links encurtados podem não carregar automaticamente. Por favor, envie uma foto manual se necessário.', 'warning');
      } else if (images.length > 0) {
        addToast('Imagens de sugestão adicionadas! ✨', 'info');
      }
    } catch (err) {
      console.error(err);
      addToast('Erro ao processar imagem do produto.', 'error');
    } finally {
      setIsPulling(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Check size first
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > 5 * 1024 * 1024) {
        addToast('As imagens devem ter no máximo 5MB cada.', 'error');
        return;
      }
    }

    try {
      const resizedImages = await Promise.all(
        Array.from(files).map((file: File) => resizeImage(file, 600, 600, false))
      );
      setProductImages((prev) => [...prev, ...resizedImages]);
    } catch (error) {
      addToast('Erro ao processar imagem.', 'error');
    }

    // Reset value so onChange can be triggered again even for the same or subsequent files
    e.target.value = '';
  };

  const handleAutoPullBundleItemImage = async (index: number) => {
    const item = bundleItems[index];
    if (!item.name.trim() && !item.link?.trim()) {
      addToast('Digite o nome do produto ou insira um link para puxar uma imagem!', 'info');
      return;
    }

    setPullingBundleIndices(prev => new Set(prev).add(index));
    try {
      const suggestedImages: string[] = [];
      let metadataImage = null;
      let metadataTitle = null;

      // 1. Fetch metadata from link if available
      if (item.link?.trim()) {
        try {
          const response = await fetch('/api/fetch-metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: item.link.trim() })
          });
          if (response.ok) {
            const data = await response.json();
            if (data.imagem) {
              const imgUrl = data.imagem.startsWith('//') ? `https:${data.imagem}` : data.imagem;
              metadataImage = imgUrl;
            } else if (data.imagens && data.imagens.length > 0) {
              metadataImage = data.imagens[0];
            }
            if (data.titulo) {
              metadataTitle = data.titulo;
            }
            
            // If item name is empty, auto-fill it with metadata title
            if (!item.name.trim() && data.titulo) {
              const newItems = [...bundleItems];
              newItems[index].name = data.titulo.substring(0, 100);
              setBundleItems(newItems);
            }
          }
        } catch (e) {
          console.error("Metadata fetch error:", e);
        }
      }

      if (metadataImage) {
        suggestedImages.push(metadataImage);
      }
      
      // 2. Product Search - use metadata title as priority search term
      let searchTerms = "";
      
      if (metadataTitle) {
        searchTerms = metadataTitle
          .replace(/comprar|preço|oferta|promoção|aliExpress|shopee|amazon|mercado livre/gi, '')
          .split(/[|:-]/)[0]
          .trim();
      }

      if (!searchTerms) searchTerms = item.name.trim();

      // If no name/title, try to extract from URL
      if (!searchTerms && item.link?.trim()) {
        try {
          const urlObj = new URL(item.link.startsWith('http') ? item.link : `https://${item.link}`);
          const isShortened = urlObj.hostname.includes('a.aliexpress') || urlObj.hostname.includes('t.me') || urlObj.hostname.includes('bit.ly');
          
          if (isShortened) {
            searchTerms = urlObj.hostname.split('.').reverse()[1];
          } else {
            // Ignore numeric IDs
            const pathParts = urlObj.pathname.split('/').filter(p => {
              if (p.length <= 3) return false;
              if (/^\d+$/.test(p)) return false;
              if (urlObj.hostname.includes('shopee') && p.includes('-i.')) return true;
              return !p.includes('.');
            });

            if (pathParts.length > 0) {
              let lastPart = decodeURIComponent(pathParts[pathParts.length - 1]);
              if (urlObj.hostname.includes('shopee')) {
                lastPart = lastPart.split('-i.')[0];
              }
              const isHash = /^[a-zA-Z0-9_-]+$/.test(lastPart) && (lastPart.includes('_') || lastPart.length < 10) && !lastPart.includes(' ');
              searchTerms = !isHash ? lastPart.replace(/[-_]/g, ' ') : (urlObj.hostname.split('.').reverse()[1] || '');
            } else {
              searchTerms = urlObj.hostname.split('.').reverse()[1] || '';
            }
          }
        } catch (e) {}
      }

      if (searchTerms && searchTerms.length > 2) {
        const encoded = encodeURIComponent(searchTerms);
        const randomId = Math.floor(Math.random() * 1000000) + index;
        suggestedImages.push(`https://images.unsplash.com/featured/500x500/?${encoded},product&sig=${randomId}`);
        suggestedImages.push(`https://images.unsplash.com/featured/500x500/?${encoded},item&sig=${randomId + 1}`);
      } else if (!metadataImage) {
        const randomId = Math.floor(Math.random() * 1000000) + index;
        suggestedImages.push(`https://images.unsplash.com/featured/500x500/?package,product&sig=${randomId}`);
      }

      // 3. Logo using Clearbit & Google Favicon from the domain - Fallback reference
      if (item.link?.trim()) {
        const rootDomain = getRootDomain(item.link);
        if (rootDomain) {
          suggestedImages.push(`https://logo.clearbit.com/${rootDomain}`);
          suggestedImages.push(`https://www.google.com/s2/favicons?domain=${rootDomain}&sz=128`);
        }
      }

      if (suggestedImages.length > 0) {
        const newItems = [...bundleItems];
        const currentImages = newItems[index].images || (newItems[index].image ? [newItems[index].image] : []);
        const updatedImages = [...currentImages];
        
        suggestedImages.forEach(img => {
          if (!updatedImages.includes(img)) {
            updatedImages.push(img);
          }
        });
        
        newItems[index].images = updatedImages;
        // Priority for non-logo images if setting for the first time
        const firstNonLogo = updatedImages.find(img => !img.includes('logo.clearbit.com') && !img.includes('favicons'));
        newItems[index].image = firstNonLogo || updatedImages[0] || '';
        
        setBundleItems(newItems);
        addToast('Imagens sugeridas adicionadas!', 'success');
      } else {
        addToast('Não foi possível identificar imagem automática.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Erro ao puxar imagem.', 'error');
    } finally {
      setPullingBundleIndices(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const handleBundleItemImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check size first
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > 5 * 1024 * 1024) {
        addToast('As imagens devem ter no máximo 5MB cada.', 'error');
        return;
      }
    }

    try {
      const resizedImages = await Promise.all(
        Array.from(files).map((file: File) => resizeImage(file, 600, 600, false))
      );
      
      const newItems = [...bundleItems];
      const currentImages = newItems[index].images || (newItems[index].image ? [newItems[index].image] : []);
      const updatedImages = [...currentImages, ...resizedImages];
      newItems[index].images = updatedImages;
      newItems[index].image = updatedImages[0] || '';
      setBundleItems(newItems);
      addToast(`${resizedImages.length} imagem(ns) carregada(s) da galeria!`, 'success');
    } catch (error) {
      addToast('Erro ao processar imagem.', 'error');
    }

    e.target.value = '';
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSaveTag = () => {
    if (!newTagName.trim()) return;

    if (editingTagId) {
      onUpdateTag(editingTagId, {
        name: newTagName,
        emoji: newTagEmoji,
        color: newTagColor,
      });
      addToast('Tag atualizada!', 'success');
    } else {
      onAddTag({
        name: newTagName,
        emoji: newTagEmoji,
        color: newTagColor,
      });
      addToast('Tag criada!', 'success');
    }

    setEditingTagId(null);
    setNewTagName('');
    setNewTagEmoji('🏷️');
    setNewTagColor('#6366f1');
  };

  const handleEditTagClick = (tag: Tag) => {
    setEditingTagId(tag.id);
    setNewTagName(tag.name);
    setNewTagEmoji(tag.emoji);
    setNewTagColor(tag.color);
  };

  const handleCreateOrSave = () => {
    // Validate fields
    const validation: { productName?: string; originalPrice?: string; finalPrice?: string; profile?: string } = {};

    const trimmedName = productName.trim();
    if (!trimmedName) {
      validation.productName = 'O nome do produto/serviço não pode ser vazio.';
    } else if (trimmedName.length < 2) {
      validation.productName = 'O nome do produto deve conter pelo menos 2 caracteres.';
    } else if (/^[^a-zA-Z0-9]+$/.test(trimmedName)) {
      validation.productName = 'O nome do produto não pode conter apenas caracteres especiais.';
    } else if (trimmedName === '<INVALID NAME>') {
      validation.productName = 'Nome inválido para o produto.';
    } else if (/[<>{}]/.test(trimmedName)) {
      validation.productName = 'O nome do produto contém caracteres inválidos.';
    }

    if (originalPrice <= 0) {
      validation.originalPrice = 'O preço original deve ser um valor positivo maior que zero.';
    }

    const calculatedFinalPrice = isEditMode ? finalPrice : Math.max(0, originalPrice - discount);
    if (calculatedFinalPrice <= 0) {
      validation.finalPrice = 'O preço final (após descontos) deve ser maior que zero.';
    }

    // Validation for bundle items
    if (isBundle) {
      if (bundleItems.length === 0) {
        addToast('Adicione pelo menos um item ao combo!', 'error');
        return;
      }
      for (const item of bundleItems) {
        if (!item.name.trim()) {
          addToast('Todos os itens do combo devem ter um nome!', 'error');
          return;
        }
        if (item.name.trim() === '<INVALID NAME>') {
          addToast('Nome de item do combo inválido.', 'error');
          return;
        }
        if (item.price !== undefined && item.price < 0) {
          addToast(`O preço do item "${item.name}" não pode ser negativo!`, 'error');
          return;
        }
      }
    }

    if (!selectedProfileId) {
      validation.profile = 'Selecione um perfil antes de salvar.';
      addToast('Selecione ou cadastre um perfil antes de registrar a compra!', 'error');
      setValidationErrors(validation);
      return;
    }

    if (Object.keys(validation).length > 0) {
      setValidationErrors(validation);
      addToast('Erro de validação: Verifique os campos em vermelho!', 'error');
      return;
    }

    setValidationErrors({});

    // Convert date YYYY-MM-DD to ISO String format
    const dateToSave = purchaseDate ? new Date(purchaseDate).toISOString() : new Date().toISOString();

    // Normalize bundle items to make sure image and images list are in sync
    const normalizedBundleItems = bundleItems.map((item) => {
      let imgs = item.images || [];
      if (item.image && item.image.trim() && !imgs.includes(item.image.trim())) {
        imgs = [item.image.trim(), ...imgs];
      }
      return {
        ...item,
        images: imgs,
        image: imgs[0] || '',
      };
    });

    const purchaseData = {
      profileId: selectedProfileId,
      productName,
      productLink,
      status,
      originalPrice,
      discount,
      finalPrice: isEditMode ? finalPrice : Math.max(0, originalPrice - discount),
      notes,
      productImages,
      date: dateToSave,
      paymentDate: paymentDate || undefined,
      paymentMethod: paymentMethod || undefined,
      bankName: bankName || undefined,
      installments: (paymentMethod === 'cartao' || paymentMethod === 'parcelada') ? installments : undefined,
      cardName: (paymentMethod === 'cartao' || paymentMethod === 'parcelada') ? cardName : undefined,
      deliveryDate: deliveryDate || undefined,
      quantity,
      tags: selectedTagIds,
      isBundle,
      bundleItems: normalizedBundleItems,
      purchaseType,
    };

    if (isEditMode && purchase) {
      onEdit(purchase.id, purchaseData);
      addToast(`Compra "${productName}" atualizada com sucesso! 🛒`, 'success');
    } else {
      onSave(purchaseData);
      addToast(`Compra "${productName}" adicionada com sucesso! 🛍️`, 'success');
    }
    onClose();
  };

  const handleDelete = () => {
    if (isEditMode && purchase && onDelete) {
      onDelete(purchase.id);
      addToast(`Compra "${purchase.productName}" excluída com sucesso! 🗑️`, 'info');
      onClose();
    }
  };

  if (!isOpen || !platform) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-white dark:bg-[#0a0a0a] rounded-2xl border border-neutral-200 dark:border-white/[0.08] overflow-hidden shadow-2xl text-neutral-800 dark:text-neutral-200"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-white/[0.08] flex items-start justify-between bg-neutral-50 dark:bg-[#0d0d0d]">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-sans font-bold text-base text-neutral-900 dark:text-white leading-tight">
                  {isEditMode ? 'Registro de compra' : 'Registrar compra'}
                </h2>
                <span className="text-[9px] px-2 py-0.5 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20 uppercase tracking-tight">
                  {platform.name}
                </span>
              </div>
              <p className="text-neutral-500 dark:text-neutral-400 text-[10px] font-medium leading-tight">
                {isEditMode ? 'Acompanhe ou edite os detalhes desta compra' : 'Cadastre uma nova transação'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-all cursor-pointer border border-neutral-200 dark:border-neutral-700 shadow-sm shrink-0 ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 max-h-[80vh] sm:max-h-[70vh] overflow-y-auto">
          <div className="flex flex-col gap-5">
            {/* Perfil que comprou (buyer select) */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest whitespace-nowrap">
                Perfil que comprou
              </label>
              {platform.profiles.length === 0 ? (
                <div className="flex flex-col gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-500/10">
                  <p className="text-xs text-rose-500 font-semibold select-text leading-relaxed">
                    ⚠️ Esta plataforma não possui nenhum perfil cadastrado. Você precisa criar um perfil antes de registrar uma compra.
                  </p>
                  {onAddProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        onAddProfile(platform.id);
                        onClose(); // Close this modal to open the profile one
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-rose-500/20 cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Criar Primeiro Perfil Agora</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {platform.profiles.map((prof, idx) => {
                    const isSel = selectedProfileId === prof.id;
                    return (
                      <button
                        key={`profile-sel-${prof.id}-${idx}`}
                        type="button"
                        onClick={() => setSelectedProfileId(prof.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer border ${
                          isSel
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                            : 'bg-white dark:bg-[#050505] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-[#2a2d40] hover:border-indigo-400 dark:hover:border-indigo-500/50'
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 uppercase shadow-sm border border-white/20"
                          style={{
                            backgroundColor:
                              prof.avatar.bgColor || (prof.avatar.type === 'color' ? prof.avatar.value : '#4f46e5'),
                          }}
                        >
                          {prof.avatar.type === 'emoji' ? prof.avatar.value : prof.name.slice(0, 1).toUpperCase()}
                        </div>
                        <span>{prof.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Link do produto */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest whitespace-nowrap">
                Link do produto (opcional)
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-indigo-500 transition-colors">
                  <Link className="w-4 h-4" />
                </span>
                <input
                  id="input-link-do-produto"
                  type="url"
                  value={productLink}
                  onChange={(e) => setProductLink(e.target.value)}
                  placeholder="Cole o link da Shopee ou Amazon aqui..."
                  className="w-full h-12 pl-11 pr-4 rounded-xl text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-[#050505] dark:border-[#2a2d40] dark:text-neutral-200 transition-all"
                />
              </div>
            </div>

            {/* Tipo de Registro (Assinatura vs Compra) */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest whitespace-nowrap">
                Tipo de Registro
              </label>
              <div className="grid grid-cols-2 gap-2 bg-neutral-100/50 p-1 rounded-xl dark:bg-[#050505]/60 border border-neutral-200/50 dark:border-neutral-800/80">
                <button
                  type="button"
                  onClick={() => setPurchaseType('single')}
                  className={`flex items-center justify-center gap-2 h-10 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    purchaseType === 'single'
                      ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-600 dark:text-white'
                      : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-indigo-500" />
                  <span>Compra</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPurchaseType('subscription')}
                  className={`flex items-center justify-center gap-2 h-10 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    purchaseType === 'subscription'
                      ? 'bg-[#8b5cf6] text-white shadow-sm dark:bg-[#8b5cf6] dark:text-white'
                      : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-purple-500" />
                  <span>Assinatura</span>
                </button>
              </div>
            </div>

            {/* Nome do produto */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest whitespace-nowrap">
                Nome do produto / serviço
              </label>
              <div className="relative group">
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${validationErrors.productName ? 'text-rose-500' : 'text-neutral-400 group-focus-within:text-indigo-500'}`}>
                  <ShoppingBag className="w-4 h-4" />
                </span>
                <input
                  id="input-nome-do-produto"
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ex: Teclado Mecânico RGB"
                  className={`w-full h-12 pl-11 pr-4 rounded-xl text-sm bg-neutral-50 border text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 dark:bg-[#050505] dark:text-neutral-200 transition-all ${
                    validationErrors.productName
                      ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500 dark:border-rose-500/80'
                      : 'border-neutral-200 dark:border-white/[0.08] focus:ring-indigo-500/20 focus:border-indigo-500'
                  }`}
                />
              </div>
              {validationErrors.productName && (
                <span className="text-[11px] font-bold text-rose-500 mt-0.5 flex items-center gap-1">
                  ⚠️ {validationErrors.productName}
                </span>
              )}
            </div>

            {/* Fotos do produto */}
            <div className="flex flex-col gap-3 p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 dark:border-[#2a2d40]/60 dark:bg-[#050505]/50 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
                    <ImageIcon className="w-4 h-4 text-indigo-500" />
                    <span>Fotos do Produto ({productImages.length})</span>
                  </label>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 leading-snug">
                    Puxe fotos ou envie da galeria (selecione várias de uma vez ou envie uma por uma).
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={isPulling || !productLink.trim()}
                    onClick={() => puxarDadosScraper()}
                    className="h-8 px-2.5 text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    {isPulling ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Processando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Puxar</span>
                      </>
                    )}
                  </button>

                  <label className="h-8 px-2.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Enviar</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Dynamic link warning based on platform/shorteners */}
              {(() => {
                if (productImages.length > 0) return null; // Hide all warnings if images were successfully retrieved!
                const warning = getLinkWarning(productLink);
                if (!warning) return null;
                return (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-amber-700 dark:text-amber-300">
                    <span className="text-sm shrink-0 mt-0.5">⚠️</span>
                    <div className="flex-1 text-[11px] leading-relaxed select-text">
                      <span className="font-bold block mb-0.5 text-amber-800 dark:text-amber-200">{warning.title}</span>
                      {warning.body}
                    </div>
                  </div>
                );
              })()}

              {/* Foto Principal Preview (ID solicitado para ScraperAPI) */}
              {productImages.length > 0 && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative aspect-video rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-white/[0.08] overflow-hidden mb-2 cursor-pointer group"
                >
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex flex-col items-center justify-center text-white gap-2">
                    <Upload className="w-8 h-8" />
                    <span className="text-xs font-bold">Trocar por Foto Real</span>
                  </div>
                  <img
                    id="exibicao-da-foto"
                    src={getProxiedImageUrl(productImages[0])}
                    alt="Preview Principal"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                  />
                </div>
              )}

              {/* Thumbnails grid */}
              {productImages.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-2 max-h-[150px] overflow-y-auto pr-1">
                  {productImages.map((img, idx) => (
                    <div key={`img-gallery-${idx}-${img.substring(0, 10)}`} className="relative aspect-square rounded-lg border border-neutral-200 dark:border-[#2a2d40] overflow-hidden bg-neutral-100 dark:bg-neutral-800/30 group flex items-center justify-center">
                      <ImageIcon className="absolute w-5 h-5 text-neutral-300 dark:text-neutral-700 z-0" />
                      <img
                        referrerPolicy="no-referrer"
                        src={getProxiedImageUrl(img)}
                        alt="Foto do produto"
                        onError={handleImageError}
                        onClick={() => setFullScreenCarousel({ images: productImages.map(formatShopeeCdnUrl), initialIndex: idx })}
                        className="relative z-10 w-full h-full object-contain p-1 bg-transparent cursor-pointer hover:opacity-90 transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setProductImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 hover:bg-rose-600 text-white transition-all cursor-pointer z-10 flex items-center justify-center"
                        title="Remover foto"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-black/50 text-[8px] font-bold text-center text-white py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        Foto {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 border border-dashed border-neutral-200 dark:border-[#2a2d40] rounded-lg mt-2 text-neutral-400 text-center">
                  <ImageIcon className="w-6 h-6 mb-1 text-neutral-300 dark:text-neutral-600" />
                  <span className="text-[10px]">Nenhuma foto adicionada</span>
                </div>
              )}
            </div>

            {/* Status (shipping status selector) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                Status
              </label>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {availableStatuses.map((s, idx) => {
                  const isSel = status === s.id;
                  return (
                    <button
                      key={`status-sel-${s.id}-${idx}`}
                      type="button"
                      onClick={() => setStatus(s.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                        isSel ? 'text-white' : 'hover:opacity-80'
                      }`}
                      style={{
                        backgroundColor: isSel ? s.color : `${s.color}15`,
                        borderColor: s.color,
                        color: isSel ? '#fff' : s.color
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bundle Toggle */}
            <div className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 dark:border-[#2a2d40] bg-neutral-50/50 dark:bg-[#050505]/50">
              <input
                type="checkbox"
                id="isBundle"
                checked={isBundle}
                onChange={(e) => setIsBundle(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-neutral-900 dark:border-neutral-700"
              />
              <div className="flex flex-col">
                <label htmlFor="isBundle" className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer">
                  Compra em conjunto (Vários produtos)
                </label>
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  Calcule automaticamente o valor final de cada produto baseado no desconto total da compra.
                </span>
              </div>
            </div>

            {isBundle && (
              <div className="flex flex-col gap-3 p-4 rounded-xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                    Itens da Compra ({bundleItems.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => setBundleItems([...bundleItems, { id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, name: '', link: '', image: '' }])}
                    className="h-7 px-3 text-[10px] font-bold bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors cursor-pointer"
                  >
                    + Adicionar Item
                  </button>
                </div>
                
                {bundleItems.length > 0 && (
                  <div className="flex flex-col gap-2 mt-1">
                    {bundleItems.map((item, index) => {
                      return (
                        <div key={`bundle-item-${index}-${item.id ? `${item.id}-${index}` : index}`} className="flex flex-col gap-2 bg-white dark:bg-[#0a0a0a] p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 relative group">
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = bundleItems.filter((_, i) => i !== index);
                              setBundleItems(newItems);
                            }}
                            className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-rose-200 dark:border-rose-800 hover:bg-rose-500 hover:text-white"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          
                          <div className="flex flex-col gap-2 w-full">
                            <input
                              type="text"
                              placeholder="Nome do produto"
                              value={item.name}
                              onChange={(e) => {
                                const newItems = [...bundleItems];
                                newItems[index].name = e.target.value;
                                setBundleItems(newItems);
                              }}
                              className="w-full h-9 px-3 rounded-md text-xs bg-neutral-50 dark:bg-[#111219] border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-indigo-500"
                            />
                            
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-neutral-400">R$</span>
                                <input
                                  type="number"
                                  placeholder="Preço (opcional)"
                                  value={item.price !== undefined ? item.price : ''}
                                  onChange={(e) => {
                                    const newItems = [...bundleItems];
                                    const val = e.target.value;
                                    newItems[index].price = val === '' ? undefined : parseFloat(val);
                                    setBundleItems(newItems);
                                  }}
                                  className="w-full h-9 pl-8 pr-3 rounded-md text-xs font-mono bg-neutral-50 dark:bg-[#111219] border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                              <select
                                value={item.status || 'pedido_feito'}
                                onChange={(e) => {
                                  const newItems = [...bundleItems];
                                  newItems[index].status = e.target.value;
                                  setBundleItems(newItems);
                                }}
                                className="w-32 h-9 px-2 rounded-md text-xs bg-neutral-50 dark:bg-[#111219] border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                              >
                                {availableStatuses.map((s, idx) => (
                                  <option key={`opt-status-${s.id}-${idx}`} value={s.id}>{s.label}</option>
                                ))}
                              </select>
                            </div>

                            <div className="flex flex-col gap-2 bg-neutral-50/50 dark:bg-[#111219]/40 p-2.5 rounded-lg border border-neutral-200/50 dark:border-neutral-800/80">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">Imagens do combo:</span>
                                <div className="flex items-center gap-1.5">
                                  {/* Botão de Puxar Imagem */}
                                  <button
                                    type="button"
                                    disabled={pullingBundleIndices.has(index)}
                                    onClick={() => handleAutoPullBundleItemImage(index)}
                                    className="px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-[9px] flex items-center gap-1 cursor-pointer transition-all border border-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Tentar buscar imagem automaticamente"
                                  >
                                    {pullingBundleIndices.has(index) ? (
                                      <>
                                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                        <span>...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="w-2.5 h-2.5 text-amber-500 animate-pulse" />
                                        <span>Puxar</span>
                                      </>
                                    )}
                                  </button>

                                  {/* Botão de Upload da Galeria */}
                                  <label className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-bold text-[9px] flex items-center gap-1 cursor-pointer transition-all border border-neutral-200 dark:border-neutral-700">
                                    <Upload className="w-2.5 h-2.5" />
                                    <span>Galeria</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      className="hidden"
                                      onChange={(e) => handleBundleItemImageUpload(index, e)}
                                    />
                                  </label>
                                </div>
                              </div>

                              {/* Thumbnails row */}
                              {(() => {
                                const itemImages = item.images || (item.image ? [item.image] : []);
                                return itemImages.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto py-1">
                                    {itemImages.map((img, imgIdx) => (
                                      <div key={`bundle-thumb-${index}-${imgIdx}`} className="w-10 h-10 rounded border border-neutral-200 dark:border-[#2a2d40] overflow-hidden bg-neutral-100 dark:bg-neutral-800/30 relative group/img shrink-0 flex items-center justify-center">
                                        <ImageIcon className="absolute w-3.5 h-3.5 text-neutral-300 dark:text-neutral-700 z-0" />
                                        <img
                                          referrerPolicy="no-referrer" 
                                          src={getProxiedImageUrl(img)} 
                                          alt="Foto do produto" 
                                          onError={handleImageError}
                                          onClick={() => setFullScreenCarousel({ images: itemImages.map(formatShopeeCdnUrl), initialIndex: imgIdx })}
                                          className="relative z-10 w-full h-full object-cover cursor-pointer hover:brightness-110 transition-all duration-300"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newItems = [...bundleItems];
                                            const updatedImages = itemImages.filter((_, i) => i !== imgIdx);
                                            newItems[index].images = updatedImages;
                                            newItems[index].image = updatedImages[0] || '';
                                            setBundleItems(newItems);
                                          }}
                                          className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-all cursor-pointer z-10 flex items-center justify-center"
                                          title="Remover imagem"
                                        >
                                          <X className="w-2 h-2" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 py-1 text-neutral-400 dark:text-neutral-600 text-[10px]">
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    <span>Nenhuma foto adicionada</span>
                                  </div>
                                );
                              })()}

                              <input
                                type="url"
                                placeholder="Ou cole link da imagem e aperte Enter para somar..."
                                value={item.image || ''}
                                onChange={(e) => {
                                  const newItems = [...bundleItems];
                                  newItems[index].image = e.target.value;
                                  setBundleItems(newItems);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = (e.target as HTMLInputElement).value.trim();
                                    if (val) {
                                      const newItems = [...bundleItems];
                                      const currentImages = newItems[index].images || (newItems[index].image ? [newItems[index].image] : []);
                                      if (!currentImages.includes(val)) {
                                        newItems[index].images = [...currentImages, val];
                                      }
                                      newItems[index].image = ''; // clear text box
                                      setBundleItems(newItems);
                                      addToast('Imagem adicionada por link!', 'success');
                                    }
                                  }
                                }}
                                className="w-full h-6 px-2 rounded text-[10px] bg-neutral-100 dark:bg-[#111219] border border-neutral-200/50 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            <input
                              type="url"
                              placeholder="Link do produto (opcional)"
                              value={item.link || ''}
                              onChange={(e) => {
                                const newItems = [...bundleItems];
                                newItems[index].link = e.target.value;
                                setBundleItems(newItems);
                              }}
                              className="w-full h-9 px-3 rounded-md text-xs bg-neutral-50 dark:bg-[#111219] border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Numerical rows (original, discount, final price) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Preço original */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest truncate">
                  Preço original
                </label>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold ${validationErrors.originalPrice ? 'text-rose-500' : 'text-neutral-400'}`}>
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={originalPrice || ''}
                    onChange={(e) => setOriginalPrice(parseFloat(e.target.value) || 0)}
                    className={`w-full h-11 pl-8 pr-3 rounded-xl text-sm bg-neutral-50 border text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 dark:bg-[#111219] dark:text-neutral-200 transition-all font-mono font-medium ${
                      validationErrors.originalPrice
                        ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500 dark:border-rose-500/80'
                        : 'border-neutral-200 dark:border-[#2a2d40] focus:ring-indigo-500/20 focus:border-indigo-500'
                    }`}
                  />
                </div>
                {validationErrors.originalPrice && (
                  <span className="text-[10px] font-bold text-rose-500 mt-1 block leading-tight">
                    ⚠️ {validationErrors.originalPrice}
                  </span>
                )}
              </div>
              {/* Desconto */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest truncate">
                  Desconto
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-neutral-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={discount || ''}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full h-11 pl-8 pr-3 rounded-xl text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200 transition-all font-mono font-medium text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>
              {/* Preço final */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest truncate">
                  Preço final
                </label>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold ${validationErrors.finalPrice ? 'text-rose-500' : 'text-indigo-400 dark:text-indigo-500'}`}>
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={finalPrice || ''}
                    onChange={(e) => setFinalPrice(parseFloat(e.target.value) || 0)}
                    className={`w-full h-11 pl-8 pr-3 rounded-xl text-lg bg-indigo-50/50 border text-indigo-700 placeholder-indigo-300 focus:outline-none focus:ring-2 transition-all font-mono font-black shadow-sm dark:bg-indigo-900/20 dark:text-indigo-300 ${
                      validationErrors.finalPrice
                        ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500 dark:border-rose-500/40'
                        : 'border-indigo-200 dark:border-indigo-500/30 focus:ring-indigo-500/30 focus:border-indigo-500'
                    }`}
                  />
                </div>
                {validationErrors.finalPrice && (
                  <span className="text-[10px] font-bold text-rose-500 mt-1 block leading-tight">
                    ⚠️ {validationErrors.finalPrice}
                  </span>
                )}
              </div>
            </div>




            {/* Quantidade e Tags */}
            <div className="grid grid-cols-1 gap-4 pt-1">
              {/* Quantidade */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                  Quantidade (Unidades)
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-11 h-11 rounded-lg border border-neutral-200 dark:border-[#2a2d40] bg-neutral-50 dark:bg-[#111219] text-neutral-600 dark:text-neutral-400 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 font-bold text-lg cursor-pointer transition-colors shrink-0"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setQuantity(isNaN(val) || val < 1 ? 1 : val);
                    }}
                    className="w-full h-11 text-center rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-indigo-500 font-mono font-semibold dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-11 h-11 rounded-lg border border-neutral-200 dark:border-[#2a2d40] bg-neutral-50 dark:bg-[#111219] text-neutral-600 dark:text-neutral-400 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 font-bold text-lg cursor-pointer transition-colors shrink-0"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Enhanced Tags System */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                    Tags do Produto
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsManagingTags(!isManagingTags)}
                    className={`flex items-center gap-1.5 text-[10px] font-bold uppercase transition-colors px-2 py-1 rounded-md ${
                      isManagingTags 
                        ? 'bg-indigo-600 text-white' 
                        : 'text-neutral-400 hover:text-indigo-500 hover:bg-indigo-500/10'
                    }`}
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Gerenciar Tags</span>
                  </button>
                </div>

                {isManagingTags ? (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/20 dark:bg-indigo-950/10 flex flex-col gap-4"
                  >
                    {/* Tag Search and Editor Form */}
                    <div className="flex flex-col gap-4">
                      {/* Tag List search inside management too */}
                      <div className="relative group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 transition-colors group-focus-within:text-indigo-500">
                          <Search className="w-3.5 h-3.5" />
                        </span>
                        <input
                          type="text"
                          value={tagSearch}
                          onChange={(e) => setTagSearch(e.target.value)}
                          placeholder="Pesquisar tags..."
                          className="w-full h-9 pl-9 pr-3 rounded-lg bg-white dark:bg-[#0a0a0c] border border-neutral-200 dark:border-[#2a2d40] text-xs text-neutral-700 dark:text-neutral-300 placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500 transition-all duration-200"
                        />
                      </div>
                      
                      {/* Emoji presets */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-tight">Presets de Emoji</span>
                        <div className="flex flex-wrap gap-1">
                          {PRESET_EMOJIS.map((em, idx) => (
                            <button
                              key={`reg-emoji-${em}-${idx}`}
                              type="button"
                              onClick={() => setNewTagEmoji(em)}
                              className={`w-7 h-7 rounded flex items-center justify-center text-sm hover:bg-white dark:hover:bg-neutral-800 transition-all ${
                                newTagEmoji === em ? 'bg-white dark:bg-neutral-800 border border-indigo-500 shadow-sm' : ''
                              }`}
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Color presets */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-tight">Cores Rápidas</span>
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_COLORS.map((col, idx) => (
                            <button
                              key={`reg-color-${col}-${idx}`}
                              type="button"
                              onClick={() => setNewTagColor(col)}
                              className="w-5 h-5 rounded-full border border-black/10 flex items-center justify-center shadow-inner hover:scale-110 transition-all"
                              style={{ backgroundColor: col }}
                            >
                              {newTagColor === col && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <div className="relative group">
                          <input
                            type="text"
                            value={newTagEmoji}
                            onChange={(e) => setNewTagEmoji(e.target.value)}
                            className="w-11 h-11 rounded-lg border border-neutral-200 dark:border-[#2a2d40] bg-white dark:bg-[#111219] text-center text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="😀"
                          />
                          <div className="absolute -top-5 left-0 text-[8px] font-bold text-neutral-400 uppercase tracking-tight">Emoji</div>
                        </div>
                        <div className="flex-1 relative group">
                          <input
                            type="text"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            className="w-full h-11 px-3 rounded-lg border border-neutral-200 dark:border-[#2a2d40] bg-white dark:bg-[#111219] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="Nome da tag..."
                          />
                          <div className="absolute -top-5 left-0 text-[8px] font-bold text-neutral-400 uppercase tracking-tight">Nome</div>
                        </div>
                        <div className="relative group">
                          <button
                            type="button"
                            onClick={() => setShowColorWheel(!showColorWheel)}
                            className="w-11 h-11 rounded-lg border border-neutral-200 dark:border-[#2a2d40] flex items-center justify-center p-1 cursor-pointer transition-all"
                            style={{ backgroundColor: newTagColor }}
                            title="Escolher cor"
                          >
                            <Palette className="w-5 h-5 text-white drop-shadow-md" />
                          </button>
                          <div className="absolute -top-5 left-0 text-[8px] font-bold text-neutral-400 uppercase tracking-tight">Cor</div>
                        </div>
                        <button
                          type="button"
                          onClick={handleSaveTag}
                          disabled={!newTagName.trim()}
                          className="w-11 h-11 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 transition-colors disabled:opacity-50"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Color Wheel Toggle */}
                      <AnimatePresence>
                        {showColorWheel && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex flex-col items-center gap-3 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30 bg-white dark:bg-[#111219] shadow-inner"
                          >
                            <div className="relative w-32 h-32 flex items-center justify-center touch-none">
                              <canvas
                                ref={colorWheelRef}
                                width={128}
                                height={128}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUpOrLeave}
                                onMouseLeave={handleMouseUpOrLeave}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                className="rounded-full cursor-crosshair border border-neutral-300 dark:border-neutral-700 shadow-md touch-none z-10"
                              />
                              {(() => {
                                const coords = getIndicatorCoords(newTagColor, 64);
                                return (
                                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                                    <line
                                      x1={64}
                                      y1={64}
                                      x2={coords.x}
                                      y2={coords.y}
                                      stroke="white"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      className="shadow-sm drop-shadow-[0_1.5px_2.5px_rgba(0,0,0,0.6)]"
                                    />
                                    <circle
                                      cx={coords.x}
                                      cy={coords.y}
                                      r="5"
                                      fill={newTagColor}
                                      stroke="white"
                                      strokeWidth="2"
                                      className="shadow-md"
                                    />
                                  </svg>
                                );
                              })()}
                            </div>
                            <div className="flex items-center gap-2 w-full">
                              <div className="flex-1 h-2 rounded-full" style={{ background: `linear-gradient(to right, transparent, ${newTagColor})` }} />
                              <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase">{newTagColor}</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {editingTagId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTagId(null);
                            setNewTagName('');
                            setNewTagEmoji('🏷️');
                            setNewTagColor('#6366f1');
                          }}
                          className="text-[10px] font-bold text-neutral-500 hover:text-neutral-700 underline uppercase tracking-tight self-start"
                        >
                          Cancelar Edição
                        </button>
                      )}
                    </div>

                    {/* Tag List with edit/delete */}
                    <div className="border-t border-indigo-100 dark:border-indigo-900/30 pt-3 flex flex-wrap gap-2">
                      {availableTags.map((tag, idx) => (
                        <div 
                          key={`tag-manage-${tag.id}-${idx}`}
                          className="flex items-center gap-1 pl-2 pr-1 py-1 rounded-lg border dark:border-transparent group"
                          style={{ backgroundColor: `${tag.color}15`, borderColor: `${tag.color}30` }}
                        >
                          <span className="text-xs">{tag.emoji}</span>
                          <span className="text-[10px] font-bold uppercase tracking-tight" style={{ color: tag.color }}>{tag.name}</span>
                          <div className="flex items-center ml-1">
                            <button
                              type="button"
                              onClick={() => handleEditTagClick(tag)}
                              className="p-1 text-neutral-400 hover:text-indigo-600 transition-colors"
                            >
                              <Pencil className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteTag(tag.id)}
                              className="p-1 text-neutral-400 hover:text-rose-600 transition-colors"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableTags.length === 0 ? (
                      <p className="text-[10px] text-neutral-500 font-medium italic">Nenhuma tag cadastrada. Clique em "Gerenciar Tags" para criar.</p>
                    ) : (
                      availableTags.map((tag, idx) => {
                        const isSel = selectedTagIds.includes(tag.id);
                        return (
                          <button
                            key={`tag-toggle-${tag.id}-${idx}`}
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                              isSel 
                                ? 'shadow-md scale-[1.02]' 
                                : 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
                            }`}
                            style={{ 
                              backgroundColor: isSel ? `${tag.color}25` : 'transparent',
                              borderColor: isSel ? tag.color : 'rgba(128,128,128,0.2)',
                              color: isSel ? tag.color : 'inherit'
                            }}
                          >
                            <span className="text-sm">{tag.emoji}</span>
                            <span className="text-[10px] font-bold uppercase tracking-tight">{tag.name}</span>
                            {isSel && <Check className="w-2.5 h-2.5" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Datas e Meio de Pagamento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Data da Compra */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                  Data da Compra
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-indigo-500 font-mono font-medium dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200 cursor-pointer"
                />
              </div>

              {/* Data de Pagamento */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                  Data de Pagamento
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-indigo-500 font-mono font-medium dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200 cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Meio de Pagamento */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                  Meio de Pagamento
                </label>
                <div className="relative">
                  <select
                    value={['Pix', 'Cartão de Crédito', 'Boleto Bancário', 'Dinheiro', 'Saldo'].includes(paymentMethod) ? paymentMethod : (['cartao', 'parcelada', 'conta'].includes(paymentMethod) ? paymentMethod : (paymentMethod ? 'Outro' : ''))}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPaymentMethod(val);
                    }}
                    className="w-full h-11 px-3.5 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-indigo-500 font-medium dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200 cursor-pointer appearance-none"
                  >
                    <option value="">Selecione...</option>
                    <option value="Pix">Pix</option>
                    <option value="cartao">Cartão de Crédito</option>
                    <option value="parcelada">Compra Parcelada</option>
                    <option value="Boleto Bancário">Boleto Bancário</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="conta">Conta / Saldo Bancário</option>
                    <option value="Outro">Outro...</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-400">
                    <Receipt className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Optional Bank Name for "conta" */}
                {paymentMethod === 'conta' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="relative mt-1.5"
                  >
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                      <Building2 className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Nome do banco ou conta (opcional)"
                      className="w-full h-11 pl-10 pr-4 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-indigo-500 font-medium dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200"
                    />
                  </motion.div>
                )}

                {/* Installments and Card for "cartao" or "parcelada" */}
                {(paymentMethod === 'cartao' || paymentMethod === 'parcelada') && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-1.5 mt-5"
                  >
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                          <CardIcon className="w-3.5 h-3.5" />
                        </span>
                        <input
                          type="text"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="Qual cartão?"
                          className="w-full h-11 pl-10 pr-4 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-indigo-500 font-medium dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200"
                        />
                      </div>
                      <div className="w-24 relative">
                        <input
                          type="number"
                          min="1"
                          value={installments}
                          onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
                          className="w-full h-11 px-3 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-indigo-500 font-mono font-bold dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200 text-center"
                        />
                        <div className="absolute -top-5 left-0 text-[8px] font-bold text-neutral-400 uppercase">Parcelas</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {paymentMethod === 'Outro' && (
                  <input
                    type="text"
                    value={paymentMethod === 'Outro' ? '' : paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    placeholder="Especifique o meio..."
                    className="w-full h-11 px-3.5 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-indigo-500 font-medium dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200 mt-1.5"
                  />
                )}
              </div>

              {/* Quando Chegou (Data de Entrega) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                  Quando Chegou (Entrega)
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-indigo-500 font-mono font-medium dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200 cursor-pointer"
                />
              </div>
            </div>

            {/* Observações */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                Observações
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-neutral-500">
                  <AlignLeft className="w-4 h-4" />
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Código de rastreio, observações..."
                  className="w-full h-20 pl-10 pr-4 py-2.5 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 resize-none dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-neutral-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-neutral-50 select-none dark:border-[#26283b]/70 dark:bg-[#111219]/90">
          {/* Left Delete (Only in edit-mode) */}
          <div className="flex items-center justify-center sm:justify-start">
            {isEditMode && onDelete && (
              showDeleteConfirm ? (
                <div className="flex items-center gap-2 bg-rose-500/10 p-1.5 rounded-xl border border-rose-500/20 w-full sm:w-auto justify-center">
                  <span className="text-[10px] font-bold text-rose-500 px-1 uppercase tracking-tight">Excluir?</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[10px] font-bold uppercase tracking-wider hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      Não
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 text-rose-500 hover:text-rose-400 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-rose-500/10 transition-all cursor-pointer active:scale-95 w-full sm:w-auto justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Compra
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 h-11 rounded-xl text-[11px] font-black uppercase tracking-widest border border-neutral-200 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 cursor-pointer dark:border-[#2c2e42] dark:hover:bg-neutral-800 dark:text-neutral-400 transition-all active:scale-95 shadow-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              id="submit-purchase-btn"
              data-testid="submit-purchase-btn"
              disabled={!selectedProfileId || platform.profiles.length === 0}
              onClick={handleCreateOrSave}
              className="flex-1 sm:flex-none px-8 h-11 rounded-xl text-[11px] font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95"
            >
              Registrar compra
            </button>
          </div>
        </div>
      </motion.div>

      {fullScreenCarousel && (
        <FullScreenCarousel
          images={fullScreenCarousel.images.map(getProxiedImageUrl)}
          initialIndex={fullScreenCarousel.initialIndex}
          onClose={() => setFullScreenCarousel(null)}
        />
      )}
    </div>
  );
};
