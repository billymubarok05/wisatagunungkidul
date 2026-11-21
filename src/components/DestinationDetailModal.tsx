import { useEffect, useRef, useState } from 'react';
import {
  Bike,
  Bookmark,
  Car,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Sparkles,
  Ticket,
  X,
} from 'lucide-react';
import { formatRupiah, type Destination } from '../data/destinations';

interface DestinationDetailModalProps {
  destination: Destination | null;
  isSaved: boolean;
  onClose: () => void;
  onToggleSave: (id: string) => void;
  onAskDetail: (destination: Destination) => void;
}

const formatOptionalRupiah = (value?: number) =>
  value === undefined ? 'Perlu diverifikasi' : formatRupiah(value);

export function DestinationDetailModal({
  destination,
  isSaved,
  onClose,
  onToggleSave,
  onAskDetail,
}: DestinationDetailModalProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [imageIndex, setImageIndex] = useState(0);

  const gallery = destination?.gambarUrls ?? [];
  const hasGallery = gallery.length > 0;

  useEffect(() => {
    setImageIndex(0);
  }, [destination]);

  useEffect(() => {
    if (!destination) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (gallery.length > 1 && event.key === 'ArrowLeft') {
        setImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
      }
      if (gallery.length > 1 && event.key === 'ArrowRight') {
        setImageIndex((prev) => (prev + 1) % gallery.length);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    titleRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [destination, onClose, gallery.length]);

  if (!destination) return null;

  const safeIndex = hasGallery ? Math.min(imageIndex, gallery.length - 1) : 0;

  const areaBadge = destination.kecamatan.replace(/^Kec\. /, '').split(',')[0];
  const tags =
    destination.highlightTags && destination.highlightTags.length > 0
      ? destination.highlightTags
      : destination.vibes.slice(0, 4);

  const infoItems = [
    {
      label: 'Tiket Masuk',
      value: formatRupiah(destination.harga),
      icon: Ticket,
      accent: true,
    },
    {
      label: 'Jam Buka',
      value: destination.jam_buka,
      icon: Clock,
      accent: false,
    },
    {
      label: 'Parkir Motor',
      value: formatOptionalRupiah(destination.parkirMotor),
      icon: Bike,
      accent: false,
    },
    {
      label: 'Parkir Mobil',
      value: formatOptionalRupiah(destination.parkirMobil),
      icon: Car,
      accent: false,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="destination-detail-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="wj-scroll relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-white/10 bg-[rgba(17,24,20,0.9)] shadow-2xl backdrop-blur-2xl sm:max-h-[88vh] sm:rounded-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup detail destinasi"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/60 text-zinc-300 backdrop-blur-md transition hover:bg-black/80 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-lime"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative h-44 w-full overflow-hidden sm:h-48">
          {hasGallery ? (
            <>
              <img
                alt={destination.nama}
                src={gallery[safeIndex]}
                className="h-full w-full object-cover"
              />
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length)
                    }
                    aria-label="Gambar sebelumnya"
                    className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur-md transition hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-lime"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageIndex((prev) => (prev + 1) % gallery.length)}
                    aria-label="Gambar berikutnya"
                    className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur-md transition hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-lime"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5">
                    {gallery.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setImageIndex(index)}
                        aria-label={`Tampilkan gambar ${index + 1}`}
                        aria-current={index === safeIndex}
                        className={`h-1.5 rounded-full transition-all ${
                          index === safeIndex
                            ? 'w-4 bg-brand-lime'
                            : 'w-1.5 bg-white/50 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-lime-500/35 via-emerald-500/20 to-brand-dark" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090e0c] via-[#090e0c]/55 to-transparent" />

          <div className="absolute bottom-3 left-4 right-12">
            <span className="inline-flex rounded-full bg-brand-lime px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
              {destination.badge ?? 'Rekomendasi'}
            </span>
            <h2
              ref={titleRef}
              id="destination-detail-title"
              tabIndex={-1}
              className="mt-1.5 text-xl font-bold tracking-wide text-white focus:outline-none"
            >
              {destination.nama}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-300">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-brand-lime" />
                {destination.kecamatan} · {areaBadge}
              </span>
              {destination.rating !== undefined && destination.jumlahUlasan !== undefined && (
                <span title="Data contoh">
                  {destination.rating.toFixed(1)} · {destination.jumlahUlasan}+ ulasan
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-2.5">
            {infoItems.map(({ label, value, icon: Icon, accent }) => (
              <div
                key={label}
                className={`rounded-xl border p-3 ${
                  accent
                    ? 'border-brand-lime/30 bg-brand-lime/10'
                    : 'border-white/8 bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                  <Icon className={`h-3.5 w-3.5 ${accent ? 'text-brand-lime' : 'text-zinc-500'}`} />
                  <span>{label}</span>
                </div>
                <p
                  className={`mt-1.5 text-sm font-semibold ${
                    accent ? 'text-brand-lime' : 'text-zinc-100'
                  }`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-lime">
              <MapPin className="h-3.5 w-3.5" />
              <span>Alamat</span>
            </div>
            <p className="text-sm leading-relaxed text-zinc-200">
              {destination.alamatLengkap ?? destination.kecamatan}
            </p>
            {!destination.alamatLengkap && (
              <p className="text-[11px] text-zinc-500">
                Alamat lengkap belum tersedia; menampilkan lokasi kecamatan terdekat.
              </p>
            )}
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Deskripsi
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-200">
              {destination.deskripsi}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Aktivitas
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-200">
              {destination.aktivitas}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Waktu terbaik
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-200">
              {destination.waktu_terbaik}
            </p>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-white/8 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center gap-2 border-t border-white/8 bg-[#0c120f]/92 px-5 py-4 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => onToggleSave(destination.id)}
            aria-pressed={isSaved}
            className={`inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-lime ${
              isSaved
                ? 'border-brand-lime/40 bg-brand-lime/15 text-brand-lime'
                : 'border-white/12 bg-white/5 text-zinc-200 hover:bg-white/10'
            }`}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            <span>{isSaved ? 'Tersimpan' : 'Simpan'}</span>
          </button>
          <button
            type="button"
            onClick={() => onAskDetail(destination)}
            className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl bg-brand-lime px-4 py-2 text-xs font-semibold text-[#0F1506] transition hover:bg-[#84cc16] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-lime"
          >
            <Sparkles className="h-4 w-4" />
            <span>Tanya Asisten</span>
          </button>
        </div>
      </div>
    </div>
  );
}
