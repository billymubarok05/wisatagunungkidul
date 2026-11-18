import { useState } from 'react';
import { Bookmark, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import {
  DESTINATIONS,
  filterDestinations,
  type Destination,
  type UserPreferences,
} from '../data/destinations';
import { DestinationCard } from './DestinationCard';

interface ExploreViewProps {
  mode: 'explore' | 'saved';
  preferences: UserPreferences;
  savedIds: string[];
  onToggleSave: (id: string) => void;
  onAskDetail: (destination: Destination) => void;
  onResetPreferences: () => void;
  onSwitchToExplore: () => void;
  onOpenMobilePreferences: () => void;
}

export function ExploreView({
  mode,
  preferences,
  savedIds,
  onToggleSave,
  onAskDetail,
  onResetPreferences,
  onSwitchToExplore,
  onOpenMobilePreferences,
}: ExploreViewProps) {
  const [search, setSearch] = useState('');

  const items =
    mode === 'saved'
      ? DESTINATIONS.filter((d) => savedIds.includes(d.id)).filter((d) => {
          const q = search.trim().toLowerCase();
          if (!q) return true;
          return `${d.nama} ${d.lokasi} ${d.jenis} ${d.aktivitas}`.toLowerCase().includes(q);
        })
      : filterDestinations(preferences, search);

  return (
    <div className="flex h-full min-h-[560px] flex-col rounded-2xl border border-white/10 bg-[#12161F]">
      {/* Header & Search Toolbar */}
      <div className="flex flex-col gap-3 border-b border-white/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#F2F4F8]">
            {mode === 'saved' ? 'Destinasi Tersimpan' : 'Jelajah Destinasi Gunungkidul'}
          </h2>
          <p className="mt-0.5 text-xs text-[#8D96A8]">
            {mode === 'saved'
              ? `${items.length} tempat dipilih untuk rencana perjalananmu.`
              : `Menampilkan ${items.length} dari ${DESTINATIONS.length} destinasi sesuai preferensi aktif.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6F788B]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau aktivitas..."
              className="min-h-[38px] w-full rounded-lg border border-white/12 bg-[#0C0F14] pl-8 pr-3 text-xs text-[#F2F4F8] placeholder-[#6B7487] focus:border-[#C7F36B]/60 focus:outline-none"
            />
          </div>

          {mode === 'explore' && (
            <button
              type="button"
              onClick={onOpenMobilePreferences}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-white/12 bg-[#171C27] px-3 py-1.5 text-xs font-medium text-[#E8ECF4] transition-colors hover:border-[#C7F36B]/50 lg:hidden"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#C7F36B]" />
              <span>Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Grid or Empty State */}
      <div className="wj-scroll flex-1 overflow-y-auto p-5">
        {items.length > 0 ? (
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {items.map((dest) => (
              <DestinationCard
                key={dest.id}
                destination={dest}
                isSaved={savedIds.includes(dest.id)}
                onToggleSave={onToggleSave}
                onAskDetail={onAskDetail}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-white/12 bg-[#0E1219] px-6 py-10 text-center">
            {mode === 'saved' ? (
              <>
                <Bookmark className="h-8 w-8 text-[#6E778A]" />
                <h3 className="font-display mt-3 text-base font-semibold text-[#F2F4F8]">
                  Belum ada destinasi tersimpan
                </h3>
                <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-[#8E98AA]">
                  Klik tombol Simpan pada kartu destinasi di chat atau halaman jelajah untuk menyusun daftar kunjunganmu.
                </p>
                <button
                  type="button"
                  onClick={onSwitchToExplore}
                  className="mt-4 min-h-[40px] rounded-xl bg-[#C7F36B] px-4 py-2 text-xs font-semibold text-[#0F1506] transition-colors hover:bg-[#B7E656]"
                >
                  Jelajahi Destinasi
                </button>
              </>
            ) : (
              <>
                <SlidersHorizontal className="h-8 w-8 text-[#6E778A]" />
                <h3 className="font-display mt-3 text-base font-semibold text-[#F2F4F8]">
                  Tidak ada destinasi yang cocok
                </h3>
                <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-[#8E98AA]">
                  Coba naikkan batas budget, hapus kata kunci pencarian, atau reset filter preferensi untuk melihat pilihan lainnya.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    onResetPreferences();
                  }}
                  className="mt-4 inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-[#F2F4F8] transition-colors hover:bg-white/10"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Semua Filter</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
