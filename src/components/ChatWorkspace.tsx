import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowUp,
  CheckCheck,
  Compass,
  MapPin,
  Mic,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Trees,
  Wallet,
} from 'lucide-react';
import {
  BUDGET_MAX_SLIDER,
  VIBE_OPTIONS,
  formatRupiah,
  type Destination,
  type UserPreferences,
} from '../data/destinations';
import { DestinationCard } from './DestinationCard';

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  waktu?: string;
  destinations?: Destination[];
  isError?: boolean;
  retryPrompt?: string;
}

interface ChatWorkspaceProps {
  messages: ChatMessage[];
  preferences: UserPreferences;
  isSending: boolean;
  savedIds: string[];
  onSendMessage: (text: string) => void;
  onToggleSave: (id: string) => void;
  onAskDestinationDetail: (destination: Destination) => void;
  onOpenDetail: (destination: Destination) => void;
  onOpenMobilePreferences: () => void;
  onResetPreferences: () => void;
  onBudgetChange: (budget: number) => void;
}

const STARTER_PROMPTS = [
  {
    title: 'Pantai tenang & laguna',
    prompt: 'Rekomendasikan pantai yang tenang dan cocok untuk bersantai di Gunungkidul',
  },
  {
    title: 'Sejarah & desa budaya',
    prompt: 'Saya ingin wisata sejarah dan budaya lokal di Kabupaten Gunungkidul',
  },
  {
    title: 'Petualangan gua & tebing',
    prompt: 'Cari wisata petualangan cave tubing atau trekking tebing di Gunungkidul',
  },
];

const QUICK_PROMPTS = [
  {
    label: '🌅 Spot sunset terbaik di sekitar sini?',
    prompt: 'Rekomendasikan spot sunset terbaik di sekitar destinasi ini di Gunungkidul',
  },
  {
    label: '🐟 Kuliner seafood terdekat',
    prompt: 'Cari kuliner seafood terdekat di sekitar destinasi ini di Gunungkidul',
  },
];

const BUDGET_QUICK_OPTIONS: { label: string; value: number }[] = [
  { label: 'Gratis', value: 0 },
  { label: '≤ 25rb', value: 25000 },
  { label: '≤ 100rb', value: 100000 },
  { label: 'Bebas', value: BUDGET_MAX_SLIDER },
];

export function ChatWorkspace({
  messages,
  preferences,
  isSending,
  savedIds,
  onSendMessage,
  onToggleSave,
  onAskDestinationDetail,
  onOpenDetail,
  onOpenMobilePreferences,
  onResetPreferences,
  onBudgetChange,
}: ChatWorkspaceProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const adjustTextareaHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  };

  const submitMessage = () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    onSendMessage(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  const budgetLabel =
    preferences.budget >= BUDGET_MAX_SLIDER
      ? 'Budget bebas'
      : `Maks ${formatRupiah(preferences.budget)}`;
  const jenisLabel =
    preferences.jenis === 'semua'
      ? 'Semua jenis'
      : preferences.jenis === 'alam'
      ? 'Pantai & Alam'
      : preferences.jenis.charAt(0).toUpperCase() + preferences.jenis.slice(1);
  const lokasiLabel =
    preferences.lokasi === 'semua' ? 'Semua area' : preferences.lokasi;
  const vibeLabels = preferences.vibes
    .map((id) => VIBE_OPTIONS.find((v) => v.id === id)?.label)
    .filter(Boolean);

  const hasOnlyWelcome = messages.length === 1;

  return (
    <div className="flex min-h-[calc(100vh-220px)] flex-col lg:h-full lg:min-h-0 lg:rounded-2xl lg:border lg:border-white/10 lg:bg-[rgba(17,24,20,0.45)] lg:backdrop-blur-2xl">
      <div className="hidden flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-3.5 lg:flex">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="font-medium text-[#8C95A8]">Kriteria aktif:</span>
          <span className="font-mono-tabular font-medium text-[#E8ECF4]">
            {budgetLabel}
          </span>
          <span className="text-[#566073]" aria-hidden="true">
            ·
          </span>
          <span className="text-[#D4DBE7]">{jenisLabel}</span>
          <span className="text-[#566073]" aria-hidden="true">
            ·
          </span>
          <span className="text-[#D4DBE7]">{lokasiLabel}</span>
          {vibeLabels.length > 0 && (
            <>
              <span className="text-[#566073]" aria-hidden="true">
                ·
              </span>
              <span className="text-brand-lime">{vibeLabels.join(', ')}</span>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onResetPreferences}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-[#8D96A8] transition-colors hover:bg-white/5 hover:text-[#F2F4F8]"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={onOpenMobilePreferences}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-medium text-[#E8ECF4] transition-colors hover:border-brand-lime/50"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-brand-lime" />
            <span>Preferensi</span>
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        aria-live="polite"
        className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-4 pb-36 pt-3 lg:wj-scroll lg:space-y-5 lg:px-5 lg:pb-6 lg:pt-6"
      >
        <div className="pb-2 pt-1 lg:hidden">
          <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-brand-lime/20 bg-brand-lime/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-lime">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-lime" />
            <span>Panduan Lokal Cerdas</span>
          </div>
          <h1 className="text-2xl font-black leading-tight tracking-tight text-white">
            Temukan tempat yang <br />
            <span className="bg-gradient-to-r from-lime-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
              sesuai ceritamu.
            </span>
          </h1>
          <p className="mt-1 text-[12px] leading-snug text-zinc-400">
            Patuk, Semanu, Tanjungsari, Tepus & seluruh pesisir eksotis Gunungkidul.
          </p>
        </div>

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isUser ? 'items-end justify-end' : 'items-start'}`}
            >
              {!isUser && (
                <div
                  aria-hidden="true"
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-brand-lime/40 bg-brand-lime/20 text-brand-lime shadow-sm lg:h-8 lg:w-8"
                >
                  <Compass className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[88%] sm:max-w-[85%] ${
                  isUser
                    ? 'rounded-2xl rounded-br-sm border border-brand-lime/40 bg-gradient-to-tr from-brand-glow/20 to-brand-lime/10 px-4 py-3 text-xs leading-relaxed text-slate-100 shadow-md backdrop-blur-md lg:max-w-[85%] lg:rounded-tr-sm lg:text-sm'
                    : msg.isError
                    ? 'w-full rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3.5 text-sm text-red-200'
                    : 'w-full space-y-3 lg:max-w-none lg:space-y-4'
                }`}
              >
                {msg.isError ? (
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                    {msg.retryPrompt && (
                      <button
                        type="button"
                        onClick={() => onSendMessage(msg.retryPrompt!)}
                        className="inline-flex min-h-[36px] shrink-0 items-center justify-center rounded-lg border border-red-400/40 px-3 py-1.5 text-xs font-medium text-red-100 transition-colors hover:bg-red-400/15"
                      >
                        Coba lagi
                      </button>
                    )}
                  </div>
                ) : isUser ? (
                  <>
                    <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                    {msg.waktu && (
                      <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-brand-lime/80">
                        <span>{msg.waktu}</span>
                        <CheckCheck className="h-3 w-3 text-brand-lime" />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="glass-card space-y-2 rounded-2xl rounded-tl-sm p-3.5 text-xs leading-relaxed text-zinc-200 shadow-lg lg:text-sm">
                      {msg.text.split('\n\n').map((para, i) => (
                        <p key={i} className="whitespace-pre-line">
                          {para}
                        </p>
                      ))}
                      {msg.id === 'welcome' && (
                        <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 p-2 text-[11px] text-zinc-300">
                          <Sparkles className="h-4 w-4 shrink-0 text-brand-lime" />
                          <span>
                            Bisa langsung tulis suasana liburan yang kamu impikan atau
                            pilih rekomendasi cepat.
                          </span>
                        </div>
                      )}
                    </div>

                    {msg.destinations && msg.destinations.length > 0 && (
                      <>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {msg.destinations.map((dest) => (
                            <DestinationCard
                              key={dest.id}
                              destination={dest}
                              isSaved={savedIds.includes(dest.id)}
                              onToggleSave={onToggleSave}
                              onAskDetail={onAskDestinationDetail}
                              onOpenDetail={onOpenDetail}
                            />
                          ))}
                        </div>
                        <div className="space-y-1.5 pl-9 pt-1 lg:hidden">
                          <p className="text-[11px] font-medium text-zinc-400">
                            Lanjutkan eksplorasi:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {QUICK_PROMPTS.map((item) => (
                              <button
                                key={item.label}
                                type="button"
                                onClick={() => onSendMessage(item.prompt)}
                                className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-left text-[11px] text-zinc-200 transition hover:bg-white/10"
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}

        {hasOnlyWelcome && !isSending && (
          <>
            <div className="pl-9 lg:hidden">
              <p className="text-[11px] font-medium text-zinc-400">
                Mulai dari ide perjalanan ini
              </p>
              <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto pb-1">
                {STARTER_PROMPTS.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => onSendMessage(item.prompt)}
                    className="flex-shrink-0 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-left text-[11px] text-zinc-200 transition hover:bg-white/10"
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>
            <div className="hidden pl-11 lg:block">
              <p className="text-xs font-medium text-[#8C95A8]">
                Mulai dari ide perjalanan ini
              </p>
              <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {STARTER_PROMPTS.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => onSendMessage(item.prompt)}
                    className="flex flex-col items-start rounded-xl border border-white/10 bg-white/5 p-3 text-left transition-colors duration-150 hover:border-brand-lime/55 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-lime"
                  >
                    <span className="text-xs font-semibold text-[#E8ECF4]">
                      {item.title}
                    </span>
                    <span className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#8993A6]">
                      {item.prompt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {isSending && (
          <div className="flex items-start gap-2.5">
            <div
              aria-hidden="true"
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-brand-lime/40 bg-brand-lime/20 text-brand-lime lg:h-8 lg:w-8"
            >
              <Compass className="h-4 w-4 animate-spin" />
            </div>
            <div className="glass-card w-full max-w-lg space-y-2.5 rounded-2xl rounded-tl-sm px-4 py-3.5">
              <p className="text-xs font-medium text-[#A4AEBF]">
                Menyusun rekomendasi wisata sesuai preferensimu...
              </p>
              <div className="h-3 w-4/5 rounded bg-white/8" />
              <div className="h-3 w-3/5 rounded bg-white/6" />
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="hidden border-t border-white/8 p-4 lg:block"
      >
        <div className="flex items-end gap-2.5 rounded-xl border border-white/12 bg-black/20 p-2.5 transition-colors focus-within:border-brand-lime/60">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitMessage();
              }
            }}
            placeholder="Ceritakan destinasi, pantai, gua, atau rencana liburanmu di Gunungkidul..."
            aria-label="Pesan ke asisten wisata"
            className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent px-1.5 py-1.5 text-sm text-[#F2F4F8] placeholder-[#6B7487] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            aria-label="Kirim pesan"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-lime text-[#0F1506] transition-colors duration-150 hover:bg-brand-glow disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-lime"
          >
            <ArrowUp className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-[#6E778A]">
          <span>Tekan Enter untuk mengirim, Shift+Enter untuk baris baru.</span>
          <span>Periksa jam buka terbaru sebelum berkunjung.</span>
        </div>
      </form>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[420px] lg:hidden">
        <div className="h-8 bg-gradient-to-t from-[#090e0c] via-[#090e0c]/60 to-transparent" />
        <div className="pointer-events-auto space-y-2.5 border-t border-white/10 bg-[#0c120f]/80 px-4 pb-6 pt-2.5 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-shrink-0 items-center gap-1 text-[11px] text-zinc-400">
              <Wallet className="h-3 w-3 text-brand-lime" />
              <span>Budget Tiket:</span>
            </div>
            <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
              {BUDGET_QUICK_OPTIONS.map((option) => {
                const active =
                  option.value === BUDGET_MAX_SLIDER
                    ? preferences.budget >= BUDGET_MAX_SLIDER
                    : preferences.budget === option.value;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => onBudgetChange(option.value)}
                    className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] transition ${
                      active
                        ? 'bg-brand-lime font-semibold text-black glow-lime'
                        : 'border border-white/5 bg-white/5 font-medium text-zinc-300 hover:bg-white/10'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="relative flex items-center">
            <div className="flex w-full items-center rounded-2xl border border-white/15 bg-zinc-900/90 py-1.5 pl-3.5 pr-1.5 shadow-xl transition-all focus-within:border-brand-lime/80">
              <span aria-hidden="true" className="mr-1 p-1 text-emerald-400">
                <MapPin className="h-4 w-4" />
              </span>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ceritakan destinasi atau suasana impianmu..."
                aria-label="Pesan ke asisten wisata"
                className="w-full border-0 bg-transparent p-0 text-xs tracking-tight text-white placeholder-zinc-500 focus:outline-none focus:ring-0"
              />
              <span aria-hidden="true" className="p-1.5 text-zinc-400">
                <Mic className="h-4 w-4" />
              </span>
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                aria-label="Kirim pesan"
                className="ml-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-brand-lime font-bold text-black shadow-md transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 glow-lime"
              >
                <ArrowUp className="h-4 w-4 stroke-[2.5]" />
              </button>
            </div>
          </form>

          <div className="mx-auto mt-2 h-1 w-32 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  );
}
