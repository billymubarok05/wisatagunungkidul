import { useCallback, useEffect, useState } from 'react';
import {
  Bookmark,
  ChevronDown,
  Compass,
  MessageSquare,
  Plus,
  Signal,
  SlidersHorizontal,
  Trees,
  Wifi,
  X,
} from 'lucide-react';
import {
  BUDGET_MAX_SLIDER,
  DEFAULT_PREFERENCES,
  VIBE_OPTIONS,
  formatRupiah,
  type Destination,
  type UserPreferences,
} from './data/destinations';
import { ChatWorkspace, type ChatMessage } from './components/ChatWorkspace';
import { ExploreView } from './components/ExploreView';
import { DestinationDetailModal } from './components/DestinationDetailModal';
import { PreferencesPanel } from './components/PreferencesPanel';

type ActiveTab = 'chat' | 'explore' | 'saved';

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'bot',
  text:
    'Halo! Saya siap membantumu merencanakan wisata di Kabupaten Gunungkidul sesuai preferensi dan anggaranmu.\n\nAtur budget, jenis wisata, dan kawasan lewat chip di atas atau panel preferensi, lalu ceritakan suasana liburan yang kamu inginkan.',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isSending, setIsSending] = useState(false);
  const [mobilePrefsOpen, setMobilePrefsOpen] = useState(false);
  const [detailDestination, setDetailDestination] = useState<Destination | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('wisatajogja_saved_ids');
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('wisatajogja_saved_ids', JSON.stringify(savedIds));
    } catch {
      return;
    }
  }, [savedIds]);

  const toggleSave = (id: string) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  const updateBudget = (budget: number) => {
    setPreferences((prev) => ({ ...prev, budget }));
  };

  const toggleJenisChip = () => {
    setPreferences((prev) => ({
      ...prev,
      jenis: prev.jenis === 'alam' ? 'semua' : 'alam',
    }));
  };

  const startNewChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setActiveTab('chat');
  };

  const sendChatMessage = async (text: string, customPrefs?: UserPreferences) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const activePrefs = customPrefs ?? preferences;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      waktu: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const historySnapshot = messages
      .filter((m) => !m.isError)
      .slice(-6)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);
    setActiveTab('chat');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          budget:
            activePrefs.budget >= BUDGET_MAX_SLIDER ? null : activePrefs.budget,
          jenis: activePrefs.jenis === 'semua' ? null : activePrefs.jenis,
          lokasi: activePrefs.lokasi === 'semua' ? null : activePrefs.lokasi,
          vibes: activePrefs.vibes,
          history: historySnapshot,
        }),
      });

      const rawBody = await response.text();
      let result: { detail?: string; answer?: string; destinations?: Destination[] } = {};
      try {
        result = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        throw new Error(
          'Server mengembalikan respons non-JSON (HTTP ' +
            response.status +
            '). Pastikan server backend berjalan dan muat ulang halaman.'
        );
      }

      if (!response.ok) {
        throw new Error(result.detail || 'Permintaan gagal diproses.');
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'bot',
        text: result.answer || 'Berikut rekomendasi destinasi yang paling relevan.',
        destinations: Array.isArray(result.destinations) ? result.destinations : [],
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      const errText =
        error instanceof Error
          ? error.message
          : 'Gagal terhubung ke server asisten wisata.';
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'bot',
        text: errText,
        isError: true,
        retryPrompt: trimmed,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleApplyPreferencesToChat = () => {
    const parts: string[] = ['Carikan rekomendasi wisata di Kabupaten Gunungkidul'];
    if (preferences.jenis !== 'semua') {
      parts.push(`kategori ${preferences.jenis}`);
    }
    if (preferences.lokasi !== 'semua') {
      parts.push(`di kawasan ${preferences.lokasi}`);
    }
    if (preferences.budget === 0) {
      parts.push('yang gratis tanpa tiket masuk');
    } else if (preferences.budget < BUDGET_MAX_SLIDER) {
      parts.push(`dengan budget tiket maksimal ${formatRupiah(preferences.budget)}`);
    }
    if (preferences.vibes.length > 0) {
      const vibeNames = preferences.vibes
        .map((id) => VIBE_OPTIONS.find((v) => v.id === id)?.label.toLowerCase())
        .filter(Boolean);
      if (vibeNames.length > 0) {
        parts.push(`dan suasana ${vibeNames.join(', ')}`);
      }
    }
    sendChatMessage(`${parts.join(' ')}.`, preferences);
  };

  const handleAskDestinationDetail = (destination: Destination) => {
    const prompt = `Berikan tips berkunjung, waktu terbaik, dan perkiraan biaya untuk ke ${destination.nama} di ${destination.lokasi}.`;
    sendChatMessage(prompt);
  };

  const openDestinationDetail = (destination: Destination) => {
    setDetailDestination(destination);
  };

  const closeDestinationDetail = useCallback(() => {
    setDetailDestination(null);
  }, []);

  const handleAskFromDetail = (destination: Destination) => {
    setDetailDestination(null);
    handleAskDestinationDetail(destination);
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
    preferences.lokasi === 'semua' ? 'Semua Area' : preferences.lokasi;

  return (
    <div className="min-h-screen bg-[#090e0c] text-[#F2F4F8]">
      <div className="relative mx-auto flex min-h-screen w-full flex-col overflow-x-hidden bg-[#090e0c]">
        <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-dvh w-full overflow-hidden">
          <img
            alt="Pemandangan tebing dan pantai Gunungkidul"
            src="/assets/wisatajogja/hero-gunungkidul.png"
            className="h-full w-full scale-105 object-cover object-top opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#090e0c]/20 via-[#090e0c]/60 to-[#090e0c]" />
          <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-lime-500/10 blur-3xl" />
          <div className="absolute -right-24 top-96 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="relative z-20 flex flex-col lg:hidden">
          <div className="flex items-center justify-between px-6 pt-3 text-xs font-semibold tracking-tight text-white/80">
            <span>9:41</span>
            <div className="flex items-center gap-2">
              <Signal className="h-3.5 w-3.5" />
              <Wifi className="h-3.5 w-3.5" />
              <div className="flex h-2.5 w-5 items-center rounded-[3px] border border-white/70 p-[1px]">
                <div className="h-full w-full rounded-[1.5px] bg-white" />
              </div>
            </div>
          </div>

          <header className="flex items-center justify-between px-5 pb-2 pt-3">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className="flex items-center gap-2 text-left"
            >
              <img
                src="/assets/wisatajogja/logo-wisatajogjaAI.png"
                alt="WisataJogja AI"
                className="h-20 w-20 object-contain"
              />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('saved')}
                aria-label="Buka destinasi tersimpan"
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur-md transition ${
                  activeTab === 'saved'
                    ? 'border-brand-lime/40 bg-brand-lime/15'
                    : 'border-white/10 bg-white/10'
                }`}
              >
                <Bookmark className="h-3.5 w-3.5 fill-brand-lime text-brand-lime" />
                <span>Tersimpan</span>
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-lime text-[10px] font-bold text-black">
                  {savedIds.length}
                </span>
              </button>
              <button
                type="button"
                onClick={startNewChat}
                aria-label="Percakapan baru"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/10 text-slate-200 transition hover:bg-white/15"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </header>

          <nav aria-label="Navigasi utama" className="px-5 pb-1 pt-2">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-1 text-xs font-medium backdrop-blur-xl">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 transition ${
                  activeTab === 'chat'
                    ? 'bg-brand-lime font-semibold text-black shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Asisten Chat</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('explore')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 transition ${
                  activeTab === 'explore'
                    ? 'bg-brand-lime font-semibold text-black shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Jelajah Destinasi</span>
              </button>
            </div>
          </nav>
        </div>

        <header className="relative z-20 hidden border-b border-white/8 bg-white/[0.03] backdrop-blur-xl lg:block">
          <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-8 px-5 py-3 sm:px-8">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className="flex shrink-0 items-center gap-2 text-left"
            >
              <img
                src="/assets/wisatajogja/logo-wisatajogjaAI.png"
                alt="WisataJogja AI"
                className="h-20 w-20 object-contain"
              />
            </button>

            <nav
              aria-label="Navigasi utama desktop"
              className="flex items-center gap-1 rounded-2xl border border-white/10 bg-black/40 p-1 text-xs font-medium backdrop-blur-xl"
            >
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-4 py-1.5 transition ${
                  activeTab === 'chat'
                    ? 'bg-brand-lime font-semibold text-black shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Asisten Chat</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('explore')}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-4 py-1.5 transition ${
                  activeTab === 'explore'
                    ? 'bg-brand-lime font-semibold text-black shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Jelajah Destinasi</span>
              </button>
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('saved')}
                aria-label="Buka destinasi tersimpan"
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur-md transition ${
                  activeTab === 'saved'
                    ? 'border-brand-lime/40 bg-brand-lime/15'
                    : 'border-white/10 bg-white/10'
                }`}
              >
                <Bookmark className="h-3.5 w-3.5 fill-brand-lime text-brand-lime" />
                <span>Tersimpan</span>
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-lime text-[10px] font-bold text-black">
                  {savedIds.length}
                </span>
              </button>
              <button
                type="button"
                onClick={startNewChat}
                aria-label="Percakapan baru"
                title="Percakapan baru"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/10 text-slate-200 transition hover:bg-white/15"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <div className="relative z-20 mx-auto w-full max-w-[1380px] px-5 pt-2 lg:px-5 lg:pt-3 xl:px-8">
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setMobilePrefsOpen(true)}
              className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-brand-lime/30 bg-brand-lime/10 px-2.5 py-1 text-[11px] font-medium text-brand-lime"
            >
              <SlidersHorizontal className="h-3 w-3" />
              <span>{budgetLabel}</span>
            </button>
            <button
              type="button"
              onClick={toggleJenisChip}
              className={`flex flex-shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] ${
                preferences.jenis === 'alam'
                  ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                  : 'border-white/10 bg-white/5 text-zinc-300'
              }`}
            >
              <Trees className="h-3 w-3 text-emerald-400" />
              <span>{jenisLabel}</span>
            </button>
            <button
              type="button"
              onClick={() => setMobilePrefsOpen(true)}
              className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-400"
            >
              <span>{lokasiLabel}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>
            <button
              type="button"
              onClick={resetPreferences}
              className="flex-shrink-0 pr-1 text-[11px] text-zinc-500 underline underline-offset-2 hover:text-brand-lime"
            >
              Reset
            </button>
          </div>
        </div>

        <main className="relative z-10 mx-auto flex w-full max-w-[1380px] flex-1 flex-col px-5 py-4 lg:px-5 lg:py-6 xl:px-8">
          <div className="mb-5 hidden lg:block">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-brand-lime/20 bg-brand-lime/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-lime">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-lime" />
              <span>Panduan Lokal Cerdas</span>
            </div>
            <h1 className="font-display text-3xl font-black tracking-tight text-balance text-white">
              Temukan tempat yang{' '}
              <span className="bg-gradient-to-r from-lime-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
                sesuai ceritamu.
              </span>
            </h1>
            <p className="mt-1.5 text-xs text-zinc-400">
              Patuk, Semanu, Tanjungsari, Tepus & seluruh pesisir eksotis Gunungkidul.
            </p>
          </div>

          <div className="grid flex-1 grid-cols-1 items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="min-w-0 lg:h-[calc(100vh-310px)] lg:min-h-[520px]">
              {activeTab === 'chat' ? (
                <ChatWorkspace
                  messages={messages}
                  preferences={preferences}
                  isSending={isSending}
                  savedIds={savedIds}
                  onSendMessage={(text) => sendChatMessage(text)}
                  onToggleSave={toggleSave}
                  onAskDestinationDetail={handleAskDestinationDetail}
                  onOpenDetail={openDestinationDetail}
                  onOpenMobilePreferences={() => setMobilePrefsOpen(true)}
                  onResetPreferences={resetPreferences}
                  onBudgetChange={updateBudget}
                />
              ) : (
                <ExploreView
                  mode={activeTab}
                  preferences={preferences}
                  savedIds={savedIds}
                  onToggleSave={toggleSave}
                  onAskDetail={handleAskDestinationDetail}
                  onOpenDetail={openDestinationDetail}
                  onResetPreferences={resetPreferences}
                  onSwitchToExplore={() => setActiveTab('explore')}
                  onOpenMobilePreferences={() => setMobilePrefsOpen(true)}
                />
              )}
            </section>

            <aside
              aria-label="Panel preferensi pengguna"
              className="hidden overflow-hidden rounded-2xl border border-white/10 bg-[rgba(17,24,20,0.45)] backdrop-blur-2xl lg:block lg:h-[calc(100vh-310px)] lg:min-h-[520px]"
            >
              <PreferencesPanel
                idPrefix="desktop"
                preferences={preferences}
                onChange={setPreferences}
                onReset={resetPreferences}
                onApplyToChat={handleApplyPreferencesToChat}
                onViewExplore={() => setActiveTab('explore')}
                isBusy={isSending}
              />
            </aside>
          </div>
        </main>

        <footer className="hidden border-t border-white/6 py-3.5 text-center text-xs text-[#6B7487] lg:block">
          WisataJogja AI · Asisten Rekomendasi Wisata Kabupaten Gunungkidul
        </footer>
      </div>

      {mobilePrefsOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Preferensi perjalanan"
        >
          <div className="relative flex h-full w-full max-w-sm flex-col border-l border-white/10 bg-brand-surface">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-3.5">
              <span className="font-display text-sm font-semibold text-[#F2F4F8]">
                Atur Preferensi
              </span>
              <button
                type="button"
                onClick={() => setMobilePrefsOpen(false)}
                aria-label="Tutup panel preferensi"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-[#A7B0C0] hover:bg-white/5 hover:text-[#F2F4F8]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <PreferencesPanel
                idPrefix="drawer"
                preferences={preferences}
                onChange={setPreferences}
                onReset={resetPreferences}
                onApplyToChat={handleApplyPreferencesToChat}
                onViewExplore={() => setActiveTab('explore')}
                isBusy={isSending}
                onCloseMobile={() => setMobilePrefsOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      <DestinationDetailModal
        destination={detailDestination}
        isSaved={detailDestination ? savedIds.includes(detailDestination.id) : false}
        onClose={closeDestinationDetail}
        onToggleSave={toggleSave}
        onAskDetail={handleAskFromDetail}
      />
    </div>
  );
}
