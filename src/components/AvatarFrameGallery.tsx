import React, { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import {
  AvatarFrame, AVATAR_FRAME_MODELS, AVATAR_FRAME_MODEL_LABELS,
  type AvatarFrameModel, type AvatarFrameSettings
} from './AvatarFrame';
import { EXTRA_FRAME_MODELS } from './avatarFrameExtras';

type GalleryCategory = 'todos' | 'novos' | 'flores' | 'coracoes' | 'natureza' | 'geometricos' | 'brilhos' | 'delicados';

const CATEGORIES: { id: GalleryCategory; name: string }[] = [
  { id: 'todos', name: 'Todos' },
  { id: 'novos', name: 'Novidades' },
  { id: 'flores', name: 'Flores' },
  { id: 'coracoes', name: 'Corações' },
  { id: 'natureza', name: 'Natureza' },
  { id: 'geometricos', name: 'Geométricos' },
  { id: 'brilhos', name: 'Brilhos' },
  { id: 'delicados', name: 'Delicados' }
];

const CATEGORY_MODELS: Record<Exclude<GalleryCategory, 'todos' | 'novos'>, string[]> = {
  flores: ['petals','petal-outline','tiny-flowers','flower-outline','mini-daisies','double-petals','three-petals','four-petal-flowers','starry-flower','long-petals','short-petals','cherry-blossoms','ribbon-bows','tiny-bows'],
  coracoes: ['micro-hearts','open-hearts','soft-heartbeat','paired-hearts','inverted-hearts','mini-links','infinity-links'],
  natureza: ['tiny-leaves','leaf-pairs','tiny-sprigs','tiny-branches','seeds','double-seeds','mini-shells','tiny-feathers','mini-feathers','tiny-crescents','moons','alternating-leaves','twin-leaves','pointed-drops','round-drops','butterflies','little-clouds','tiny-flames','mountain-peaks'],
  geometricos: ['diamonds','diamond-outline','diamond-dots','mini-squares','tiny-squares','fine-triangles','tiny-triangles','tiny-circles','hollow-rings','tiny-rings','mini-links','open-links','rounded-dashes','fine-chevron','corner-marks','soft-x','large-hollow-diamonds','bold-zigzags','diagonal-strokes','stroke-blocks','separated-crosses','wide-links','slender-links','hexagon-badges'],
  brilhos: ['tiny-stars','sparkles','star-dots','star-outline','mini-snowflakes','tiny-sunbursts','tiny-comets','light-dots','bold-stars','star-clusters','four-corner-sparkles','long-sun-rays','bead-clusters','tiny-flames'],
  delicados: ['pearls','pearls-alternating','light-dots','micro-dashes','mini-arches','arches-alternating','tiny-waves','scallops','mini-swirls','tiny-spirals','fine-spirals','curved-waves','soft-braid','woven-ribbon','double-waves','tiny-crosses','delicate-crosses','tiny-pluses','tiny-fans','mini-ribbons','mini-crowns','alternating-grand-arches','broad-scallops','bead-clusters']
};

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
  const newModels = useMemo(() => new Set<string>(EXTRA_FRAME_MODELS), []);

  const matching = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR');
    const withoutAccents = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return AVATAR_FRAME_MODELS.filter(model => {
      const inCategory = category === 'todos' || (category === 'novos'
        ? newModels.has(model)
        : CATEGORY_MODELS[category].includes(model));
      return inCategory && (!q || withoutAccents(AVATAR_FRAME_MODEL_LABELS[model]).includes(withoutAccents(q)));
    });
  }, [category, query, newModels]);

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
        {CATEGORIES.map(item => (
          <button key={item.id} type="button" onClick={() => setCategory(item.id)} aria-pressed={category === item.id}
            className={'rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition-colors ' +
              (category === item.id
                ? 'bg-indigo-500/15 border-indigo-500 text-indigo-500'
                : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-indigo-400')}>
            {item.name}
          </button>
        ))}
      </div>

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
            <button key={model} type="button" onClick={() => onChange({ ...frame, model })}
              aria-label={'Selecionar moldura ' + AVATAR_FRAME_MODEL_LABELS[model]}
              aria-pressed={frame.model === model}
              className={'min-w-0 rounded-xl p-2 flex flex-col items-center gap-1 border transition-colors ' +
                (frame.model === model ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/20' : 'border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-[#111219]')}>
              <AvatarFrame profileId={profileId + '-preview-' + model}
                settings={{ ...frame, model, motion: 'none' }} size={42}>
                <div className="w-full h-full rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ backgroundColor: avatarColor }}>{avatarText}</div>
              </AvatarFrame>
              <span className="text-[9px] leading-tight text-center text-neutral-500 break-words">
                {AVATAR_FRAME_MODEL_LABELS[model]}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3 text-center text-xs text-neutral-500">
          Nenhum modelo encontrado. Experimente outra palavra ou categoria.
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
