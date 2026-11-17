import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
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
import { PreferencesPanel } from './components/PreferencesPanel';

type ActiveTab = 'chat' | 'explore' | 'saved';

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'bot',
  text:
    'Halo! Saya siap membantumu merencanakan wisata di Kabupaten Gunungkidul sesuai preferensi dan anggaranmu.\n\nAtur budget, jenis wisata, dan kawasan Gunungkidul di panel sebelah kanan, atau langsung ceritakan suasana liburan yang kamu inginkan.',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isSending, setIsSending] = useState(false);
  const [mobilePrefsOpen, setMobilePrefsOpen] = useState(false);
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
      // Ignore storage quota errors
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

      const result = await response.json();
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
    const prompt = `${parts.join(' ')}.`;
    sendChatMessage(prompt, preferences);
  };

  const handleAskDestinationDetail = (destination: Destination) => {
    const prompt = `Berikan tips berkunjung, waktu terbaik, dan perkiraan biaya untuk ke ${destination.nama} di ${destination.lokasi}.`;
    sendChatMessage(prompt);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0C0F14] text-[#F2F4F8]">
      {/* 3-Zone Top Bar */}
      <header className="border-b border-white/8 bg-[#0C0F14]">
        <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-8 px-5 py-3.5 sm:px-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('chat');
            }}
            className="font-display text-lg font-bold tracking-tight text-[#F2F4F8] whitespace-nowrap shrink-0"
          >
            WisataJogja <span className="text-[#C7F36B]">AI</span>
          </a>

          {/* Zone 2: Clean Text Navigation Links */}
          <nav
            aria-label="Navigasi utama"
            className="hidden items-center gap-7 md:flex"
          >
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'chat'
                  ? 'text-[#F2F4F8] after:absolute after:inset-x-0 after:-bottom-3.5 after:h-0.5 after:bg-[#C7F36B]'
                  : 'text-[#8D96A8] hover:text-[#F2F4F8]'
              }`}
            >
              Asisten Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('explore')}
              className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'explore'
                  ? 'text-[#F2F4F8] after:absolute after:inset-x-0 after:-bottom-3.5 after:h-0.5 after:bg-[#C7F36B]'
                  : 'text-[#8D96A8] hover:text-[#F2F4F8]'
              }`}
            >
              Jelajah Destinasi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('saved')}
              className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'saved'
                  ? 'text-[#F2F4F8] after:absolute after:inset-x-0 after:-bottom-3.5 after:h-0.5 after:bg-[#C7F36B]'
                  : 'text-[#8D96A8] hover:text-[#F2F4F8]'
              }`}
            >
              Tersimpan{' '}
              <span className="font-mono-tabular text-xs text-[#C7F36B]">
                ({savedIds.length})
              </span>
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={startNewChat}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#C7F36B] px-3.5 py-2 text-xs font-semibold text-[#0F1506] transition-colors hover:bg-[#B7E656] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C7F36B]"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Percakapan Baru</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Tabs (below header, non-sticky so mobile chrome stays compact) */}
      <div className="border-b border-white/8 bg-[#0E1219] px-5 py-2 md:hidden">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`min-h-[36px] text-xs font-medium whitespace-nowrap ${
              activeTab === 'chat' ? 'text-[#C7F36B]' : 'text-[#8D96A8]'
            }`}
          >
            Asisten Chat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('explore')}
            className={`min-h-[36px] text-xs font-medium whitespace-nowrap ${
              activeTab === 'explore' ? 'text-[#C7F36B]' : 'text-[#8D96A8]'
            }`}
          >
            Jelajah Destinasi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`min-h-[36px] text-xs font-medium whitespace-nowrap ${
              activeTab === 'saved' ? 'text-[#C7F36B]' : 'text-[#8D96A8]'
            }`}
          >
            Tersimpan ({savedIds.length})
          </button>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="mx-auto flex w-full max-w-[1380px] flex-1 flex-col px-5 py-6 sm:px-8">
        {/* Compact Workspace Heading */}
        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-balance text-[#F2F4F8] sm:text-3xl">
              Temukan tempat yang{' '}
              <span className="text-[#C7F36B]">sesuai ceritamu.</span>
            </h1>
          </div>
          <p className="text-xs text-[#8D96A8]">
            Panduan wisata Kabupaten Gunungkidul · Patuk, Semanu, Tanjungsari, Tepus & sekitarnya
          </p>
        </div>

        {/* Workspace 2-Column Grid: Chat/Explore + Preferences Studio */}
        <div className="grid flex-1 grid-cols-1 items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0 lg:h-[calc(100vh-220px)] lg:min-h-[600px]">
            {activeTab === 'chat' ? (
              <ChatWorkspace
                messages={messages}
                preferences={preferences}
                isSending={isSending}
                savedIds={savedIds}
                onSendMessage={(text) => sendChatMessage(text)}
                onToggleSave={toggleSave}
                onAskDestinationDetail={handleAskDestinationDetail}
                onOpenMobilePreferences={() => setMobilePrefsOpen(true)}
                onResetPreferences={resetPreferences}
              />
            ) : (
              <ExploreView
                mode={activeTab}
                preferences={preferences}
                savedIds={savedIds}
                onToggleSave={toggleSave}
                onAskDetail={handleAskDestinationDetail}
                onResetPreferences={resetPreferences}
                onSwitchToExplore={() => setActiveTab('explore')}
                onOpenMobilePreferences={() => setMobilePrefsOpen(true)}
              />
            )}
          </section>

          {/* Desktop Preferences Panel */}
          <aside
            aria-label="Panel preferensi pengguna"
            className="hidden overflow-hidden rounded-2xl border border-white/10 bg-[#12161F] lg:block lg:h-[calc(100vh-220px)] lg:min-h-[600px]"
          >
            <PreferencesPanel
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

      {/* Mobile / Tablet Preferences Drawer */}
      {mobilePrefsOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Preferensi perjalanan"
        >
          <div className="relative flex h-full w-full max-w-sm flex-col border-l border-white/10 bg-[#12161F]">
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

      {/* Clean Minimal Footer */}
      <footer className="border-t border-white/6 py-3.5 text-center text-xs text-[#6B7487]">
        WisataJogja AI · Asisten Rekomendasi Wisata Kabupaten Gunungkidul
      </footer>
    </div>
  );
}
