import { ArrowUpRight, Bookmark, Clock, MapPin } from 'lucide-react';
import { formatRupiah, type Destination } from '../data/destinations';

interface DestinationCardProps {
  destination: Destination;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onAskDetail: (destination: Destination) => void;
}

const JENIS_LABEL: Record<Destination['jenis'], string> = {
  alam: 'Alam',
  sejarah: 'Sejarah',
  budaya: 'Budaya',
  petualangan: 'Petualangan',
};

export function DestinationCard({
  destination,
  isSaved,
  onToggleSave,
  onAskDetail,
}: DestinationCardProps) {
  return (
    <article className="group flex flex-col justify-between rounded-xl border border-white/10 bg-[#151A24] p-4 transition-colors duration-150 hover:border-white/20">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[#959EB0]">
            <span className="font-medium text-[#C2C9D6]">
              {JENIS_LABEL[destination.jenis]}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 shrink-0 text-[#7D879A]" />
              {destination.kecamatan}
            </span>
          </div>
          <span className="font-mono-tabular shrink-0 text-sm font-semibold text-[#C7F36B]">
            {formatRupiah(destination.harga)}
          </span>
        </div>

        <h3 className="font-display mt-2 text-[15px] font-semibold leading-snug text-[#F2F4F8]">
          {destination.nama}
        </h3>

        <p className="mt-1.5 text-xs leading-relaxed text-[#A3ACBE]">
          {destination.aktivitas}
        </p>

        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[#7F889B]">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{destination.jam_buka}</span>
        </div>
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-white/8 pt-3">
        <button
          type="button"
          onClick={() => onAskDetail(destination)}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-[#C7F36B] transition-colors hover:bg-[#C7F36B]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C7F36B]"
        >
          <span>Tanya rute & tips</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onToggleSave(destination.id)}
          aria-pressed={isSaved}
          className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C7F36B] ${
            isSaved
              ? 'border-[#C7F36B]/40 bg-[#C7F36B]/12 text-[#C7F36B]'
              : 'border-white/10 bg-transparent text-[#9EA7B8] hover:border-white/20 hover:text-[#F2F4F8]'
          }`}
        >
          <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} />
          <span>{isSaved ? 'Tersimpan' : 'Simpan'}</span>
        </button>
      </div>
    </article>
  );
}
