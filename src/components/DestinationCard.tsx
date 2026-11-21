import { ArrowRight, Bookmark, Camera, MapPin, Share2, Star } from 'lucide-react';
import {
  VIBE_OPTIONS,
  formatRupiah,
  type Destination,
  type JenisWisata,
} from '../data/destinations';

interface DestinationCardProps {
  destination: Destination;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onAskDetail: (destination: Destination) => void;
  onOpenDetail: (destination: Destination) => void;
}

const JENIS_GRADIENT: Record<JenisWisata, string> = {
  alam: 'bg-gradient-to-br from-emerald-500/45 via-teal-500/25 to-brand-dark',
  sejarah: 'bg-gradient-to-br from-amber-500/40 via-orange-500/20 to-brand-dark',
  budaya: 'bg-gradient-to-br from-fuchsia-500/35 via-violet-500/20 to-brand-dark',
  petualangan: 'bg-gradient-to-br from-lime-500/40 via-cyan-500/20 to-brand-dark',
};

export function DestinationCard({
  destination,
  isSaved,
  onToggleSave,
  onAskDetail,
  onOpenDetail,
}: DestinationCardProps) {
  const areaBadge = destination.kecamatan.replace(/^Kec\. /, '').split(',')[0];
  const tags =
    destination.highlightTags && destination.highlightTags.length > 0
      ? destination.highlightTags
      : destination.vibes
          .slice(0, 3)
          .map((vibe) => VIBE_OPTIONS.find((option) => option.id === vibe)?.label)
          .filter((label): label is string => Boolean(label));

  const handleShare = async () => {
    const url = window.location.href;
    const text = `${destination.nama} — ${formatRupiah(destination.harga)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: destination.nama, text, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text} ${url}`);
      }
    } catch {
      return;
    }
  };

  return (
    <article className="glass-card group overflow-hidden rounded-2xl border border-brand-lime/30 shadow-lg transition-transform duration-150 hover:-translate-y-0.5">
      <button
        type="button"
        onClick={() => onOpenDetail(destination)}
        className="block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-lime"
      >
        <div className="relative h-28 w-full overflow-hidden">
          {destination.gambarUrls?.[0] ? (
            <img
              alt={destination.nama}
              src={destination.gambarUrls[0]}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className={`h-full w-full ${JENIS_GRADIENT[destination.jenis]}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
            <span className="rounded-full bg-brand-lime px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
              {destination.badge ?? 'Rekomendasi'}
            </span>
            <span className="flex items-center gap-1 rounded-full border border-white/10 bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
              <MapPin className="h-2.5 w-2.5" />
              {areaBadge}
            </span>
          </div>

          {destination.gambarUrls && destination.gambarUrls.length > 1 && (
            <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full border border-white/10 bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
              <Camera className="h-2.5 w-2.5" />
              {destination.gambarUrls.length}
            </span>
          )}

          <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold tracking-wide text-white">
                {destination.nama}
              </h3>
              {destination.rating !== undefined && destination.jumlahUlasan !== undefined && (
                <div
                  className="flex items-center gap-1 text-[11px] text-zinc-300"
                  title="Data contoh"
                >
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-white">
                    {destination.rating.toFixed(1)}
                  </span>
                  <span className="text-zinc-400">
                    ({destination.jumlahUlasan}+ ulasan)
                  </span>
                </div>
              )}
            </div>
            <div className="flex-shrink-0 text-right">
              <span className="block text-[10px] text-zinc-300">Tiket Masuk</span>
              <span className="text-xs font-bold text-brand-lime">
                {formatRupiah(destination.harga)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2 border-t border-white/5 bg-zinc-900/60 p-3 backdrop-blur-md">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-white/5 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </button>

      <div className="flex items-center justify-between gap-2 border-t border-white/5 bg-zinc-900/60 px-3 py-2 backdrop-blur-md">
        <button
          type="button"
          onClick={() => onAskDetail(destination)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-lime transition hover:text-lime-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-lime"
        >
          <span>Tanya Asisten</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onToggleSave(destination.id)}
            aria-pressed={isSaved}
            aria-label={isSaved ? 'Hapus dari tersimpan' : 'Simpan destinasi'}
            className={`flex h-7 w-7 items-center justify-center rounded-lg border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-lime ${
              isSaved
                ? 'border-brand-lime/40 bg-brand-lime/15 text-brand-lime'
                : 'border-white/5 bg-white/5 text-zinc-300 hover:bg-white/10'
            }`}
          >
            <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleShare}
            aria-label="Bagikan destinasi"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/5 bg-white/5 text-zinc-300 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-lime"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
