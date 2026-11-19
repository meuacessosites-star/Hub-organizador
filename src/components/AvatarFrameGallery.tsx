import { useEffect, useMemo, useState } from 'react';
import { Search, X, Star, ChevronDown, ChevronUp } from 'lucide-react';
import {
  AvatarFrame, AVATAR_FRAME_MODELS, AVATAR_FRAME_MODEL_LABELS,
  type AvatarFrameModel, type AvatarFrameSettings
} from './AvatarFrame';
import { EXTRA_FRAME_MODELS } from './avatarFrameExtras';
import { THEME_FRAME_MODELS } from './avatarFrameThemes';

type GalleryCategory = 'todos' | 'novos' | 'flores' | 'coracoes' | 'natureza' | 'geometricos' | 'brilhos' | 'delicados'
  | 'realeza' | 'celestiais' | 'joias' | 'animais' | 'aquaticas' | 'festivas' | 'lacos' | 'mosaicos'
  | 'romanticas' | 'divertidas' | 'minimalistas' | 'tecnologicas' | 'favoritos' | 'recentes';

const MAIN_CATEGORIES: { id: GalleryCategory; name: string }[] = [
  { id: 'todos', name: 'Todos' }, { id: 'novos', name: 'Novidades' },
  { id: 'flores', name: 'Flores' }, { id: 'coracoes', name: 'Corações' },
  { id: 'natureza', name: 'Natureza' }, { id: 'geometricos', name: 'Geométricos' },
  { id: 'brilhos', name: 'Brilhos' }, { id: 'delicados', name: 'Delicados' }
];

const EXTRA_CATEGORIES: { id: GalleryCategory; name: string }[] = [
  { id: 'realeza', name: 'Realeza' },
  { id: 'celestiais', name: 'Celestiais' },
  { id: 'joias', name: 'Joias' },
  { id: 'animais', name: 'Animais' },
  { id: 'aquaticas', name: 'Aquáticas' },
  { id: 'festivas', name: 'Festivas' },
  { id: 'lacos', name: 'Laços e fitas' },
  { id: 'mosaicos', name: 'Mosaicos' },
  { id: 'romanticas', name: 'Românticas' },
  { id: 'divertidas', name: 'Divertidas' },
  { id: 'minimalistas', name: 'Minimalistas' },
  { id: 'tecnologicas', name: 'Tecnológicas' }
];

const CATEGORY_MODELS: Record<Exclude<GalleryCategory, 'todos' | 'novos' | 'favoritos' | 'recentes'>, string[]> = {
  flores: ['petals','petal-outline','tiny-flowers','flower-outline','mini-daisies','double-petals','three-petals','four-petal-flowers','starry-flower','long-petals','short-petals','cherry-blossoms','ribbon-bows','tiny-bows','rosebuds'],
  coracoes: ['micro-hearts','open-hearts','soft-heartbeat','paired-hearts','inverted-hearts','mini-links','infinity-links','lace-hearts'],
  natureza: ['tiny-leaves','leaf-pairs','tiny-sprigs','tiny-branches','seeds','double-seeds','mini-shells','mini-feathers','tiny-crescents','moons','alternating-leaves','twin-leaves','pointed-drops','round-drops','butterflies','little-clouds','tiny-flames','mountain-peaks','rosebuds'],
  geometricos: ['diamonds','diamond-outline','diamond-dots','mini-squares','tiny-squares','fine-triangles','tiny-triangles','tiny-circles','hollow-rings','tiny-rings','mini-links','open-links','rounded-dashes','fine-chevron','corner-marks','soft-x','large-hollow-diamonds','bold-zigzags','diagonal-strokes','stroke-blocks','separated-crosses','wide-links','slender-links','hexagon-badges','tile-mosaic','checker-blocks','single-diamonds'],
  brilhos: ['tiny-stars','sparkles','star-dots','star-outline','mini-snowflakes','tiny-sunbursts','tiny-comets','light-dots','bold-stars','star-clusters','four-corner-sparkles','long-sun-rays','bead-clusters','tiny-flames','constellation-clusters'],
  delicados: ['pearls','pearls-alternating','light-dots','micro-dashes','mini-arches','arches-alternating','tiny-waves','scallops','mini-swirls','tiny-spirals','fine-spirals','curved-waves','soft-braid','woven-ribbon','double-waves','tiny-crosses','delicate-crosses','tiny-pluses','tiny-fans','mini-ribbons','mini-crowns','alternating-grand-arches','broad-scallops','bead-clusters','pearl-necklace'],
  realeza: ['royal-tiara','royal-fleur','mini-crowns','faceted-gems','diamond-outline','crystal','pearl-necklace'].filter(id => id !== 'crystal'),
  celestiais: ['orbit-planets','constellation-clusters','moons','tiny-crescents','tiny-stars','bold-stars','star-clusters','mini-sunbursts','tiny-sunbursts','four-corner-sparkles'],
  joias: ['faceted-gems','pearl-necklace','pearls','pearls-alternating','diamonds','diamond-outline','bead-clusters','large-hollow-diamonds'],
  animais: ['paw-prints','little-bees','butterflies'],
  aquaticas: ['sea-stars','sea-bubbles','mini-shells','tiny-waves','curved-waves','round-drops','pointed-drops','broad-scallops'],
  festivas: ['confetti-bursts','party-bells','tiny-stars','ribbon-bows','four-corner-sparkles','star-clusters'],
  lacos: ['crossed-ribbons','braided-bows','ribbon-bows','tiny-bows','mini-ribbons','woven-ribbon','soft-braid'],
  mosaicos: ['tile-mosaic','checker-blocks','hexagon-badges','mini-squares','tiny-squares','corner-marks','stroke-blocks'],
  romanticas: ['lace-hearts','rosebuds','paired-hearts','inverted-hearts','cherry-blossoms','tiny-bows','long-petals','flower-outline'],
  divertidas: ['smiley-faces','candy-swirls','confetti-bursts','little-clouds','paw-prints','ribbon-bows','butterflies'],
  minimalistas: ['spaced-bars','single-diamonds','light-dots','micro-dashes','rounded-dashes','separated-crosses','tiny-circles','tiny-squares','fine-chevron','hexagon-badges'],
  tecnologicas: ['circuit-nodes','pixel-squares','checker-blocks','tiny-squares','corner-marks','hexagon-badges','tile-mosaic']
};

const FAVORITES_KEY = 'hub-organizador-avatar-frame-favorites-v1';
const RECENTS_KEY = 'hub-organizador-avatar-frame-recents-v1';

function readSavedModels(key: string): AvatarFrameModel[] {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(stored)) return [];
    return stored.filter((id): id is AvatarFrameModel => typeof id === 'string' && AVATAR_FRAME_MODELS.includes(id as AvatarFrameModel));
  } catch {
    return [];
  }
}

function saveModels(key: string, values: AvatarFrameModel[]) {
  try { localStorage.setItem(key, JSON.stringify(values)); } catch { /* modo privado ou armazenamento cheio */ }
}

/** Grid preservada, com filtros e expansão progressiva em vez de uma lista infinita. */
export function AvatarFrameGallery({ frame, onChange, profileId, avatarText, avatarColor }: {
  frame: AvatarFrameSettings;
  onChange: (frame: AvatarFrameSettings) => void;
  profileId: string;
  avatarText: string;
  avatarColor: string;
}) {
  const [category, setCategory] = useState<GalleryCategory>('novos');
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [favorites, setFavorites] = useState<AvatarFrameModel[]>(() => readSavedModels(FAVORITES_KEY));
  const [recents, setRecents] = useState<AvatarFrameModel[]>(() => readSavedModels(RECENTS_KEY));
  const newModels = useMemo(() => new Set<string>([...EXTRA_FRAME_MODELS, ...THEME_FRAME_MODELS]), []);

  const selectModel = (model: AvatarFrameModel) => {
    onChange({ ...frame, model });
    const next = [model, ...recents.filter(id => id !== model)].slice(0, 24);
    setRecents(next);
    saveModels(RECENTS_KEY, next);
  };

  const toggleFavorite = (model: AvatarFrameModel) => {
    const next = favorites.includes(model)
      ? favorites.filter(id => id !== model)
      : [...favorites, model];
    setFavorites(next);
    saveModels(FAVORITES_KEY, next);
  };

  const matching = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR');
    const withoutAccents = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const candidates = category === 'recentes' ? recents : AVATAR_FRAME_MODELS;
    return candidates.filter(model => {
      const inCategory = category === 'todos'
        || (category === 'novos' && newModels.has(model))
        || (category === 'favoritos' && favorites.includes(model))
        || (category === 'recentes' && recents.includes(model))
        || (category !== 'novos' && category !== 'todos' && category !== 'favoritos' && category !== 'recentes' && CATEGORY_MODELS[category].includes(model));
      return inCategory && (!q || withoutAccents(AVATAR_FRAME_MODEL_LABELS[model]).includes(withoutAccents(q)));
    });
  }, [category, query, newModels, favorites, recents]);

  useEffect(() => { setVisibleCount(12); }, [category, query]);

  const visible = matching.slice(0, visibleCount);

  return (
    <section className="pt-2 border-t border-indigo-200/60 dark:border-indigo-500/15 min-w-0 space-y-2">
      <div className="flex justify-between items-center gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
          Modelos de moldura ({AVATAR_FRAME_MODELS.length})
        </p>
        <span className="text-[9px] text-indigo-500 font-semibold whitespace-nowrap">
          {matching.length} nesta seleção
        </span>
      </div>

      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400" />
        <input type="search" aria-label="Pesquisar modelos de moldura"
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Buscar desenhos: estrelas, flores, folhas..."
          className="w-full min-w-0 h-9 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-[#15161e] pl-8 pr-8 text-[11px] text-neutral-800 dark:text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500" />
        {query && <button type="button" onClick={() => setQuery('')} title="Limpar busca" aria-label="Limpar busca de modelos"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-500"><X className="w-3.5 h-3.5"/></button>}
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar modelos por categoria">
        {[...MAIN_CATEGORIES, { id: 'favoritos' as const, name: 'Favoritos' }, { id: 'recentes' as const, name: 'Recentes' }].map(item => (
          <button key={item.id} type="button" onClick={() => setCategory(item.id)} aria-pressed={category === item.id}
            className={'rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition-colors ' +
              (category === item.id
                ? 'bg-indigo-500/15 border-indigo-500 text-indigo-500'
                : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-indigo-400')}>
            {item.name}
          </button>
        ))}
        <button type="button" onClick={() => setShowMoreCategories(v => !v)} aria-expanded={showMoreCategories}
          className="rounded-lg border border-indigo-400/40 px-2.5 py-1.5 text-[10px] font-semibold text-indigo-500 inline-flex items-center gap-1">
          Mais categorias {showMoreCategories ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>
      {showMoreCategories && (
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-indigo-500/20 p-2 bg-indigo-500/5"
          role="group" aria-label="Categorias adicionais">
          {EXTRA_CATEGORIES.map(item => (
            <button key={item.id} type="button" onClick={() => setCategory(item.id)} aria-pressed={category === item.id}
              className={'rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold ' +
                (category === item.id ? 'bg-indigo-500/15 border-indigo-500 text-indigo-500'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400')}>
              {item.name}
            </button>
          ))}
        </div>
      )}

      {frame.model !== 'none' && !visible.includes(frame.model) && (
        <div className="flex items-center justify-between gap-2 text-[10px] rounded-lg px-2 py-1.5 bg-indigo-500/5 border border-indigo-500/20">
          <span className="min-w-0 truncate text-neutral-500">Selecionado: <strong className="text-indigo-500">{AVATAR_FRAME_MODEL_LABELS[frame.model]}</strong></span>
          <button type="button" className="shrink-0 text-indigo-500 font-bold"
            onClick={() => { setCategory('todos'); setQuery(AVATAR_FRAME_MODEL_LABELS[frame.model]); }}>
            Mostrar
          </button>
        </div>
      )}

      {visible.length > 0 ? (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-56 overflow-y-auto overflow-x-hidden pr-1">
          {visible.map(model => (
            <div key={model} className={'relative min-w-0 rounded-xl border transition-colors ' +
              (frame.model === model ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/20' : 'border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-[#111219]')}>
              <button type="button" onClick={() => selectModel(model)}
                aria-label={'Selecionar moldura ' + AVATAR_FRAME_MODEL_LABELS[model]}
                aria-pressed={frame.model === model}
                className="w-full min-w-0 p-2 flex flex-col items-center gap-1">
                <AvatarFrame profileId={profileId + '-preview-' + model}
                  settings={{ ...frame, model, motion: 'none' }} size={42}>
                  <div className="w-full h-full rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ backgroundColor: avatarColor }}>{avatarText}</div>
                </AvatarFrame>
                <span className="text-[9px] leading-tight text-center text-neutral-500 break-words">
                  {AVATAR_FRAME_MODEL_LABELS[model]}
                </span>
              </button>
              <button type="button" onClick={() => toggleFavorite(model)}
                title={favorites.includes(model) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                aria-label={favorites.includes(model) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                aria-pressed={favorites.includes(model)}
                className="absolute top-0 right-0 rounded-lg p-1 text-indigo-500 bg-neutral-100/80 dark:bg-[#171720]/90">
                <Star className="w-3 h-3" fill={favorites.includes(model) ? 'currentColor' : 'none'}/>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3 text-center text-xs text-neutral-500">
          {category === 'favoritos' ? 'Nenhum favorito ainda. Toque na estrela de um modelo para guardar aqui.'
            : category === 'recentes' ? 'Os modelos que você escolher aparecerão aqui.'
            : 'Nenhum modelo encontrado. Experimente outra palavra ou categoria.'}
        </p>
      )}

      {visibleCount < matching.length && (
        <button type="button" onClick={() => setVisibleCount(n => Math.min(n + 12, matching.length))}
          className="w-full rounded-lg border border-indigo-500/25 py-2 text-[11px] font-semibold text-indigo-500 hover:bg-indigo-500/5">
          Ver mais 12 modelos ({matching.length - visibleCount} restantes)
        </button>
      )}
    </section>
  );
}
