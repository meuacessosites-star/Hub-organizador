import { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, EyeOff, ShoppingBag, UserRoundPlus, X } from 'lucide-react';
import type { Platform } from '../types';
import { ProfileAvatarDisplay } from './ProfileAvatarDisplay';
import { SmartImage } from './SmartImage';
import { getInitials, getLogoUrl } from '../utils/logoHelper';

/** Mostra o mesmo logo da plataforma usado nos cartões da tela inicial. */
function PlatformQuickLogo({ platform }: { platform: Platform }) {
  const generatedLogo = !platform.logoUrl || [
    'logo.clearbit.com', 't3.gstatic.com/favicon', 's2/favicons',
    'simpleicons.org', 'unavatar.io', 'vectorlogo.zone', 'iconfinder.com'
  ].some(source => platform.logoUrl?.includes(source));
  const logoUrl = generatedLogo
    ? getLogoUrl(platform.name, platform.url)
    : platform.logoUrl;

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#141414]">
      <SmartImage
        src={logoUrl}
        alt={`Logo de ${platform.name}`}
        containerClassName="w-full h-full"
        className="w-full h-full object-contain p-1 pointer-events-none"
        fallbackIcon={
          <span className="flex h-full w-full items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-xs font-extrabold text-neutral-700 dark:text-neutral-200">
            {getInitials(platform.name)}
          </span>
        }
      />
    </span>
  );
}

interface QuickAddMenuProps {
  platforms: Platform[];
  onClose: () => void;
  onAddProfile: (platformId: string) => void;
  onAddPurchase: (platformId: string, profileId: string) => void;
}

/** Atalho para ações já existentes: não duplica o cadastro nem armazena credenciais. */
export function QuickAddMenu({ platforms, onClose, onAddProfile, onAddPurchase }: QuickAddMenuProps) {
  const [action, setAction] = useState<'profile' | 'purchase' | null>(null);
  const [platformId, setPlatformId] = useState<string | null>(null);
  const [revealedPasswordId, setRevealedPasswordId] = useState<string | null>(null);
  const platform = platforms.find(item => item.id === platformId);
  const selectingProfile = action === 'purchase' && !!platform;

  const selectPlatform = (id: string) => {
    if (action === 'profile') {
      onClose();
      onAddProfile(id);
      return;
    }
    setPlatformId(id);
    setRevealedPasswordId(null);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-5"
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-label="Adicionar conta ou registrar compra"
        className="w-full max-w-md max-h-[88dvh] min-w-0 flex flex-col overflow-hidden rounded-2xl border border-indigo-500/20 bg-white dark:bg-[#101015] text-neutral-800 dark:text-neutral-100 shadow-2xl">
        <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-4 border-b border-neutral-200 dark:border-white/10">
          <div className="min-w-0">
            <h2 className="text-lg font-bold">Adicionar rapidamente</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {!action ? 'O que você deseja cadastrar?' : !platform ? 'Escolha a plataforma' : 'Escolha a conta que fez a compra'}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar atalhos"
            className="shrink-0 p-2 rounded-xl border border-neutral-200 dark:border-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3">
          {action && (
            <button type="button"
              onClick={() => {
                if (selectingProfile) {
                  setPlatformId(null);
                  setRevealedPasswordId(null);
                } else {
                  setAction(null);
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
          )}

          {!action ? (
            <div className="grid grid-cols-1 gap-3">
              <button type="button" onClick={() => setAction('profile')}
                className="w-full flex items-center gap-3 rounded-xl border border-indigo-500/25 bg-indigo-500/5 p-4 text-left hover:border-indigo-500/60">
                <span className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-500"><UserRoundPlus className="w-5 h-5" /></span>
                <span className="flex-1 min-w-0"><span className="block font-bold text-sm">Adicionar conta</span>
                  <span className="block text-xs text-neutral-500 dark:text-neutral-400">Escolha onde cadastrar outro acesso</span></span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
              <button type="button" onClick={() => setAction('purchase')}
                className="w-full flex items-center gap-3 rounded-xl border border-indigo-500/25 bg-indigo-500/5 p-4 text-left hover:border-indigo-500/60">
                <span className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-500"><ShoppingBag className="w-5 h-5" /></span>
                <span className="flex-1 min-w-0"><span className="block font-bold text-sm">Registrar compra</span>
                  <span className="block text-xs text-neutral-500 dark:text-neutral-400">Escolha a plataforma e depois o perfil</span></span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          ) : !selectingProfile ? (
            platforms.length === 0 ? (
              <p className="rounded-xl border border-neutral-200 dark:border-white/10 p-4 text-sm text-neutral-500">
                Você ainda não cadastrou nenhuma plataforma.
              </p>
            ) : (
              <div className="space-y-2">
                {platforms.map(item => (
                  <button key={item.id} type="button" onClick={() => selectPlatform(item.id)}
                    className="w-full min-w-0 flex items-center gap-3 rounded-xl border border-neutral-200 dark:border-white/10 p-3 text-left hover:border-indigo-500/60">
                    <PlatformQuickLogo platform={item} />
                    <span className="flex-1 min-w-0">
                      <span className="block truncate text-sm font-bold">{item.name}</span>
                      <span className="block text-xs text-neutral-500">{item.profiles.length} {item.profiles.length === 1 ? 'conta' : 'contas'}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 shrink-0 text-neutral-400" />
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {platform.name} — escolha o e-mail e a moldura da conta correta para registrar a compra.
              </p>
              {platform.profiles.length === 0 ? (
                <div className="space-y-3 rounded-xl border border-neutral-200 dark:border-white/10 p-4">
                  <p className="text-sm text-neutral-500">Esta plataforma ainda não tem contas cadastradas.</p>
                  <button type="button" onClick={() => { onClose(); onAddProfile(platform.id); }}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Adicionar conta</button>
                </div>
              ) : platform.profiles.map(profile => (
                <div key={profile.id} className="min-w-0 rounded-xl border border-neutral-200 dark:border-white/10 p-3 space-y-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <ProfileAvatarDisplay profile={profile} size={42} />
                    <div className="min-w-0 flex-1">
                      <span className="block text-sm font-bold break-words">{profile.name}</span>
                      <span className="block text-xs text-neutral-500 dark:text-neutral-400 break-all">
                        {profile.email || profile.username || 'Sem e-mail cadastrado'}
                      </span>
                      {profile.username && profile.email && <span className="block text-[11px] text-neutral-500 break-all">Usuário: {profile.username}</span>}
                    </div>
                  </div>
                  {profile.password && (
                    <div className="flex items-center gap-2 min-w-0 text-xs text-neutral-500 dark:text-neutral-400">
                      <span className="shrink-0">Senha:</span>
                      <span className="flex-1 min-w-0 break-all">{revealedPasswordId === profile.id ? profile.password : '••••••••'}</span>
                      <button type="button" onClick={() => setRevealedPasswordId(revealedPasswordId === profile.id ? null : profile.id)}
                        aria-label={revealedPasswordId === profile.id ? 'Ocultar senha' : 'Mostrar senha'}
                        className="shrink-0 p-1.5 rounded-lg border border-neutral-200 dark:border-white/10">
                        {revealedPasswordId === profile.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                  <button type="button" onClick={() => { onClose(); onAddPurchase(platform.id, profile.id); }}
                    className="w-full min-h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-sm font-bold text-white">
                    Registrar compra nesta conta
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
