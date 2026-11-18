import {
  Check,
  Compass,
  Landmark,
  MapPin,
  Mountain,
  Palette,
  RotateCcw,
  Sparkles,
  Trees,
} from 'lucide-react';
import {
  BUDGET_MAX_SLIDER,
  DEFAULT_PREFERENCES,
  DESTINATIONS,
  VIBE_OPTIONS,
  filterDestinations,
  formatRupiah,
  type AreaDestinasi,
  type JenisWisata,
  type UserPreferences,
  type VibeTag,
} from '../data/destinations';

interface PreferencesPanelProps {
  preferences: UserPreferences;
  onChange: (next: UserPreferences) => void;
  onReset: () => void;
  onApplyToChat: () => void;
  onViewExplore: () => void;
  isBusy?: boolean;
  onCloseMobile?: () => void;
}

const BUDGET_PRESETS: { label: string; value: number }[] = [
  { label: 'Gratis', value: 0 },
  { label: '≤ 25rb', value: 25000 },
  { label: '≤ 50rb', value: 50000 },
  { label: '≤ 100rb', value: 100000 },
  { label: 'Bebas', value: BUDGET_MAX_SLIDER },
];

const JENIS_OPTIONS: {
  id: JenisWisata;
  label: string;
  hint: string;
  Icon: typeof Trees;
}[] = [
  { id: 'alam', label: 'Alam', hint: 'Pantai, bukit, hutan', Icon: Trees },
  { id: 'sejarah', label: 'Sejarah', hint: 'Candi & keraton', Icon: Landmark },
  { id: 'budaya', label: 'Budaya', hint: 'Seni, museum, desa', Icon: Palette },
  { id: 'petualangan', label: 'Petualangan', hint: 'Gua, jeep, trekking', Icon: Mountain },
];

const AREA_OPTIONS: (AreaDestinasi | 'semua')[] = [
  'semua',
  'Patuk & Playen',
  'Karangmojo & Semanu',
  'Tanjungsari & Baron',
  'Tepus & Girisubo',
];

function getBudgetTierNote(budget: number): string {
  if (budget === 0) return 'Khusus akses gratis';
  if (budget <= 25000) return 'Sangat hemat';
  if (budget <= 75000) return 'Tiket reguler';
  if (budget < BUDGET_MAX_SLIDER) return 'Menengah & fleksibel';
  return 'Semua rentang harga';
}

export function PreferencesPanel({
  preferences,
  onChange,
  onReset,
  onApplyToChat,
  onViewExplore,
  isBusy = false,
  onCloseMobile,
}: PreferencesPanelProps) {
  const matchedDestinations = filterDestinations(preferences);

  const isModified =
    preferences.budget !== DEFAULT_PREFERENCES.budget ||
    preferences.jenis !== DEFAULT_PREFERENCES.jenis ||
    preferences.lokasi !== DEFAULT_PREFERENCES.lokasi ||
    preferences.vibes.length > 0;

  const sliderPercent = Math.min(
    100,
    Math.max(0, Math.round((preferences.budget / BUDGET_MAX_SLIDER) * 100))
  );

  const countForJenis = (jenis: JenisWisata) =>
    filterDestinations({
      ...preferences,
      jenis,
    }).length;

  const countForArea = (area: AreaDestinasi | 'semua') =>
    filterDestinations({
      ...preferences,
      lokasi: area,
    }).length;

  const toggleVibe = (vibe: VibeTag) => {
    const exists = preferences.vibes.includes(vibe);
    const nextVibes = exists
      ? preferences.vibes.filter((v) => v !== vibe)
      : [...preferences.vibes, vibe];
    onChange({ ...preferences, vibes: nextVibes });
  };

  return (
    <div className="flex h-full flex-col justify-between bg-[#12161F]">
      <div className="wj-scroll flex-1 space-y-6 overflow-y-auto p-5">
        {/* Panel Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-[#F2F4F8]">
              Preferensi kamu
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[#8E98AA]">
              Sesuaikan budget, gaya wisata, dan wilayah untuk hasil lebih tepat.
            </p>
          </div>
          <button
            type="button"
            onClick={onReset}
            disabled={!isModified}
            className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C7F36B] ${
              isModified
                ? 'border-white/15 bg-white/5 text-[#E1E6EF] hover:border-white/25 hover:bg-white/10'
                : 'cursor-not-allowed border-transparent text-[#576072]'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* 1. Budget Section */}
        <section className="border-t border-white/8 pt-5" aria-labelledby="pref-budget-heading">
          <div className="flex items-baseline justify-between gap-2">
            <label
              id="pref-budget-heading"
              htmlFor="budgetRange"
              className="text-xs font-medium text-[#C8D0DF]"
            >
              Budget tiket per orang
            </label>
            <span className="text-[11px] text-[#8E98AA]">
              {getBudgetTierNote(preferences.budget)}
            </span>
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono-tabular text-2xl font-semibold tracking-tight text-[#F2F4F8]">
              {preferences.budget >= BUDGET_MAX_SLIDER
                ? 'Rp200.000+'
                : formatRupiah(preferences.budget)}
            </span>
            <span className="font-mono-tabular text-[11px] text-[#7F889B]">
              {matchedDestinations.length} dari {DESTINATIONS.length} tempat
            </span>
          </div>

          {/* Segmented Budget Presets */}
          <div
            className="mt-3 grid grid-cols-5 gap-1 rounded-xl border border-white/8 bg-[#0C0F14] p-1"
            role="group"
            aria-label="Pilihan cepat budget"
          >
            {BUDGET_PRESETS.map((preset) => {
              const isActive =
                preset.value === BUDGET_MAX_SLIDER
                  ? preferences.budget >= BUDGET_MAX_SLIDER
                  : preferences.budget === preset.value;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onChange({ ...preferences, budget: preset.value })}
                  className={`min-h-[34px] rounded-lg px-1 text-[11px] font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#C7F36B] ${
                    isActive
                      ? 'bg-[#C7F36B] font-semibold text-[#0F1506]'
                      : 'text-[#9BA4B5] hover:bg-white/5 hover:text-[#F2F4F8]'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Custom Precision Slider */}
          <div className="relative mt-4 flex items-center">
            <div className="pointer-events-none absolute inset-x-0 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#C7F36B] transition-all duration-100"
                style={{ width: `${sliderPercent}%` }}
              />
            </div>
            <input
              id="budgetRange"
              type="range"
              min={0}
              max={BUDGET_MAX_SLIDER}
              step={5000}
              value={preferences.budget}
              onChange={(e) =>
                onChange({ ...preferences, budget: Number(e.target.value) })
              }
              className="wj-slider relative z-10 w-full bg-transparent"
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-[#747D90]">
            <span>Gratis</span>
            <span>Rp100rb</span>
            <span>Rp200rb+</span>
          </div>
        </section>

        {/* 2. Jenis Wisata Visual Tiles */}
        <section className="border-t border-white/8 pt-5" aria-labelledby="pref-jenis-heading">
          <div className="flex items-center justify-between gap-2">
            <h3 id="pref-jenis-heading" className="text-xs font-medium text-[#C8D0DF]">
              Jenis wisata
            </h3>
            <button
              type="button"
              onClick={() => onChange({ ...preferences, jenis: 'semua' })}
              className={`text-[11px] font-medium transition-colors ${
                preferences.jenis === 'semua'
                  ? 'text-[#C7F36B]'
                  : 'text-[#8E98AA] hover:text-[#F2F4F8]'
              }`}
            >
              Semua jenis
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {JENIS_OPTIONS.map(({ id, label, hint, Icon }) => {
              const active = preferences.jenis === id;
              const count = countForJenis(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...preferences,
                      jenis: active ? 'semua' : id,
                    })
                  }
                  aria-pressed={active}
                  className={`group flex flex-col items-start rounded-xl border p-3 text-left transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C7F36B] ${
                    active
                      ? 'border-[#C7F36B]/65 bg-[#C7F36B]/10'
                      : 'border-white/8 bg-[#0D1017] hover:border-white/20 hover:bg-[#161B26]'
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        active ? 'text-[#C7F36B]' : 'text-[#8C96A8] group-hover:text-[#D5DCE8]'
                      }`}
                    />
                    <span
                      className={`font-mono-tabular text-[11px] ${
                        active ? 'font-semibold text-[#C7F36B]' : 'text-[#6F788A]'
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                  <span
                    className={`mt-2.5 text-xs font-semibold ${
                      active ? 'text-[#F2F4F8]' : 'text-[#D6DCE8]'
                    }`}
                  >
                    {label}
                  </span>
                  <span className="mt-0.5 text-[11px] leading-tight text-[#7E8799]">
                    {hint}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. Kawasan Gunungkidul */}
        <section className="border-t border-white/8 pt-5" aria-labelledby="pref-area-heading">
          <h3 id="pref-area-heading" className="text-xs font-medium text-[#C8D0DF]">
            Kawasan Gunungkidul
          </h3>
          <div className="mt-2.5 space-y-1.5">
            {AREA_OPTIONS.map((area) => {
              const active = preferences.lokasi === area;
              const count = countForArea(area);
              const label = area === 'semua' ? 'Semua kawasan Gunungkidul' : area;
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => onChange({ ...preferences, lokasi: area })}
                  aria-pressed={active}
                  className={`flex min-h-[40px] w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C7F36B] ${
                    active
                      ? 'border-[#C7F36B]/60 bg-[#C7F36B]/10 text-[#F2F4F8]'
                      : 'border-white/6 bg-[#0D1017]/80 text-[#A7B0C0] hover:border-white/15 hover:bg-[#161B26] hover:text-[#F2F4F8]'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    {area === 'semua' ? (
                      <Compass
                        className={`h-3.5 w-3.5 shrink-0 ${
                          active ? 'text-[#C7F36B]' : 'text-[#7A8396]'
                        }`}
                      />
                    ) : (
                      <MapPin
                        className={`h-3.5 w-3.5 shrink-0 ${
                          active ? 'text-[#C7F36B]' : 'text-[#7A8396]'
                        }`}
                      />
                    )}
                    <span className="truncate text-xs font-medium">{label}</span>
                  </span>

                  <span className="flex items-center gap-2 shrink-0">
                    <span
                      className={`font-mono-tabular text-[11px] ${
                        count === 0
                          ? 'text-[#5A6273]'
                          : active
                          ? 'font-semibold text-[#C7F36B]'
                          : 'text-[#7E8799]'
                      }`}
                    >
                      {count}
                    </span>
                    {active && <Check className="h-3.5 w-3.5 text-[#C7F36B]" />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. Suasana & Gaya Liburan */}
        <section className="border-t border-white/8 pt-5" aria-labelledby="pref-vibe-heading">
          <div className="flex items-center justify-between gap-2">
            <h3 id="pref-vibe-heading" className="text-xs font-medium text-[#C8D0DF]">
              Suasana favorit
            </h3>
            {preferences.vibes.length > 0 && (
              <button
                type="button"
                onClick={() => onChange({ ...preferences, vibes: [] })}
                className="text-[11px] text-[#8E98AA] hover:text-[#F2F4F8]"
              >
                Hapus ({preferences.vibes.length})
              </button>
            )}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {VIBE_OPTIONS.map((vibe) => {
              const active = preferences.vibes.includes(vibe.id);
              return (
                <button
                  key={vibe.id}
                  type="button"
                  onClick={() => toggleVibe(vibe.id)}
                  aria-pressed={active}
                  className={`min-h-[34px] rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C7F36B] ${
                    active
                      ? 'border-[#C7F36B]/60 bg-[#C7F36B]/14 text-[#E6F8BC]'
                      : 'border-white/10 bg-[#0D1017] text-[#9BA4B5] hover:border-white/20 hover:text-[#F2F4F8]'
                  }`}
                >
                  {vibe.label}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Live Match Preview & Apply Footer */}
      <div className="border-t border-white/10 bg-[#10141D] p-5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs text-[#C7CFDD]">
            <span className="font-mono-tabular font-semibold text-[#C7F36B]">
              {matchedDestinations.length}
            </span>{' '}
            destinasi cocok
          </p>
          <button
            type="button"
            onClick={() => {
              onViewExplore();
              onCloseMobile?.();
            }}
            className="text-xs font-medium text-[#9BC8FF] hover:underline"
          >
            Lihat daftar
          </button>
        </div>

        {matchedDestinations.length > 0 ? (
          <p className="mt-1.5 truncate text-[11px] text-[#838C9E]">
            {matchedDestinations
              .slice(0, 3)
              .map((d) => d.nama)
              .join(' · ')}
          </p>
        ) : (
          <p className="mt-1.5 text-[11px] text-[#E6A267]">
            Belum ada kecocokan persis — naikkan budget atau ubah area.
          </p>
        )}

        <button
          type="button"
          disabled={isBusy}
          onClick={() => {
            onApplyToChat();
            onCloseMobile?.();
          }}
          className="mt-3.5 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#C7F36B] px-4 py-2.5 text-xs font-semibold text-[#0F1506] transition-colors duration-150 hover:bg-[#B7E656] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C7F36B]"
        >
          <Sparkles className="h-4 w-4" />
          <span>Cari Rekomendasi Sesuai Filter</span>
        </button>
      </div>
    </div>
  );
}
