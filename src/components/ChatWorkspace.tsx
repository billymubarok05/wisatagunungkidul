import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowUp,
  Compass,
  RotateCcw,
  SlidersHorizontal,
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
  onOpenMobilePreferences: () => void;
  onResetPreferences: () => void;
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

export function ChatWorkspace({
  messages,
  preferences,
  isSending,
  savedIds,
  onSendMessage,
  onToggleSave,
  onAskDestinationDetail,
  onOpenMobilePreferences,
  onResetPreferences,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    onSendMessage(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const budgetLabel =
    preferences.budget >= BUDGET_MAX_SLIDER
      ? 'Budget bebas'
      : `Maks ${formatRupiah(preferences.budget)}`;
  const jenisLabel =
    preferences.jenis === 'semua'
      ? 'Semua jenis'
      : preferences.jenis.charAt(0).toUpperCase() + preferences.jenis.slice(1);
  const lokasiLabel =
    preferences.lokasi === 'semua' ? 'Semua area' : preferences.lokasi;
  const vibeLabels = preferences.vibes
    .map((id) => VIBE_OPTIONS.find((v) => v.id === id)?.label)
    .filter(Boolean);

  const hasOnlyWelcome = messages.length === 1;

  return (
    <div className="flex h-full min-h-[560px] flex-col rounded-2xl border border-white/10 bg-[#12161F]">
      {/* Active Preferences Context Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-3.5">
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
              <span className="text-[#C7F36B]">{vibeLabels.join(', ')}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onResetPreferences}
            className="hidden sm:inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-[#8D96A8] transition-colors hover:bg-white/5 hover:text-[#F2F4F8]"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={onOpenMobilePreferences}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-white/12 bg-[#171C27] px-3 py-1.5 text-xs font-medium text-[#E8ECF4] transition-colors hover:border-[#C7F36B]/50 lg:hidden"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#C7F36B]" />
            <span>Preferensi</span>
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      <div
        ref={scrollRef}
        aria-live="polite"
        className="wj-scroll flex-1 space-y-5 overflow-y-auto px-5 py-6"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'items-start'}`}
            >
              {!isUser && (
                <div
                  aria-hidden="true"
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#C7F36B]/25 bg-[#1B2314] text-[#C7F36B]"
                >
                  <Compass className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[92%] sm:max-w-[85%] ${
                  isUser
                    ? 'rounded-2xl rounded-tr-sm border border-[#C7F36B]/25 bg-[#1D2616] px-4 py-3 text-sm leading-relaxed text-[#EDF2E7]'
                    : msg.isError
                    ? 'w-full rounded-2xl border border-[#F87171]/30 bg-[#231417] px-4 py-3.5 text-sm text-[#FECACA]'
                    : 'w-full space-y-4'
                }`}
              >
                {msg.isError ? (
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#F87171]" />
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                    {msg.retryPrompt && (
                      <button
                        type="button"
                        onClick={() => onSendMessage(msg.retryPrompt!)}
                        className="inline-flex min-h-[36px] shrink-0 items-center justify-center rounded-lg border border-[#F87171]/40 px-3 py-1.5 text-xs font-medium text-[#FEE2E2] transition-colors hover:bg-[#F87171]/15"
                      >
                        Coba lagi
                      </button>
                    )}
                  </div>
                ) : isUser ? (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <>
                    <div className="rounded-2xl rounded-tl-sm border border-white/8 bg-[#171C27] px-4 py-3.5 text-sm leading-relaxed text-[#DDE3EE]">
                      {msg.text.split('\n\n').map((para, i) => (
                        <p key={i} className={i > 0 ? 'mt-2.5 whitespace-pre-line' : 'whitespace-pre-line'}>
                          {para}
                        </p>
                      ))}
                    </div>

                    {msg.destinations && msg.destinations.length > 0 && (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {msg.destinations.map((dest) => (
                          <DestinationCard
                            key={dest.id}
                            destination={dest}
                            isSaved={savedIds.includes(dest.id)}
                            onToggleSave={onToggleSave}
                            onAskDetail={onAskDestinationDetail}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* Curated Starter Prompts on Initial Turn */}
        {hasOnlyWelcome && !isSending && (
          <div className="pl-11">
            <p className="text-xs font-medium text-[#8C95A8]">
              Mulai dari ide perjalanan ini
            </p>
            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {STARTER_PROMPTS.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => onSendMessage(item.prompt)}
                  className="flex flex-col items-start rounded-xl border border-white/10 bg-[#0E121A] p-3 text-left transition-colors duration-150 hover:border-[#C7F36B]/55 hover:bg-[#161B26] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C7F36B]"
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
        )}

        {/* Loading Skeleton */}
        {isSending && (
          <div className="flex items-start gap-3">
            <div
              aria-hidden="true"
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#C7F36B]/25 bg-[#1B2314] text-[#C7F36B]"
            >
              <Compass className="h-4 w-4 animate-spin" />
            </div>
            <div className="w-full max-w-lg space-y-2.5 rounded-2xl rounded-tl-sm border border-white/8 bg-[#171C27] px-4 py-3.5">
              <p className="text-xs font-medium text-[#A4AEBF]">
                Menyusun rekomendasi wisata sesuai preferensimu...
              </p>
              <div className="h-3 w-4/5 rounded bg-white/8" />
              <div className="h-3 w-3/5 rounded bg-white/6" />
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <form onSubmit={handleSubmit} className="border-t border-white/8 p-4">
        <div className="flex items-end gap-2.5 rounded-xl border border-white/12 bg-[#0C0F14] p-2.5 transition-colors focus-within:border-[#C7F36B]/60">
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
                handleSubmit(e);
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
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#C7F36B] text-[#0F1506] transition-colors duration-150 hover:bg-[#B7E656] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C7F36B]"
          >
            <ArrowUp className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-[#6E778A]">
          <span>Tekan Enter untuk mengirim, Shift+Enter untuk baris baru.</span>
          <span className="hidden sm:inline">Periksa jam buka terbaru sebelum berkunjung.</span>
        </div>
      </form>
    </div>
  );
}
