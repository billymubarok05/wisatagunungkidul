export type JenisWisata = 'alam' | 'sejarah' | 'budaya' | 'petualangan';
export type AreaDestinasi =
  | 'Patuk & Playen'
  | 'Karangmojo & Semanu'
  | 'Tanjungsari & Baron'
  | 'Tepus & Girisubo';
export type VibeTag =
  | 'ramah-keluarga'
  | 'sunrise-sunset'
  | 'kuliner-nongkrong'
  | 'edukasi'
  | 'akses-mudah';

export interface Destination {
  id: string;
  nama: string;
  lokasi: AreaDestinasi;
  kecamatan: string;
  jenis: JenisWisata;
  harga: number;
  jam_buka: string;
  aktivitas: string;
  deskripsi: string;
  vibes: VibeTag[];
  waktu_terbaik: string;
  sumber: string;
}

export interface UserPreferences {
  budget: number; // 200000 means 200.000+ (unlimited / bebas)
  jenis: JenisWisata | 'semua';
  lokasi: AreaDestinasi | 'semua';
  vibes: VibeTag[];
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  budget: 100000,
  jenis: 'semua',
  lokasi: 'semua',
  vibes: [],
};

export const BUDGET_MAX_SLIDER = 200000;

export const VIBE_OPTIONS: { id: VibeTag; label: string }[] = [
  { id: 'ramah-keluarga', label: 'Ramah keluarga' },
  { id: 'sunrise-sunset', label: 'Sunrise & sunset' },
  { id: 'kuliner-nongkrong', label: 'Kuliner & santai' },
  { id: 'edukasi', label: 'Edukasi & heritage' },
  { id: 'akses-mudah', label: 'Akses mudah' },
];

export const DESTINATIONS: Destination[] = [
  {
    id: 'gunung-api-purba-nglanggeran',
    nama: 'Gunung Api Purba & Embung Nglanggeran',
    lokasi: 'Patuk & Playen',
    kecamatan: 'Kec. Patuk, Gunungkidul',
    jenis: 'alam',
    harga: 20000,
    jam_buka: '06.00 – 18.00 WIB (Camping 24 jam)',
    aktivitas: 'Mendaki jalur bebatuan andesit raksasa, menikmati embung di atas bukit, mencicipi cokelat lokal Nglanggeran',
    deskripsi: 'Kawasan geopark gunung api purba berusia jutaan tahun dengan panorama kabut pagi dan senja khas perbukitan Patuk.',
    vibes: ['sunrise-sunset', 'edukasi', 'ramah-keluarga'],
    waktu_terbaik: 'Pagi hari (05.30–08.30 WIB) atau sore menjelang matahari terbenam',
    sumber: 'gunungkidulkab.go.id',
  },
  {
    id: 'air-terjun-sri-gethuk',
    nama: 'Air Terjun Sri Gethuk',
    lokasi: 'Patuk & Playen',
    kecamatan: 'Kec. Playen, Gunungkidul',
    jenis: 'alam',
    harga: 15000,
    jam_buka: '08.00 – 16.00 WIB',
    aktivitas: 'Menyusuri Sungai Oyo dengan perahu rakit, berenang di kolam tebing kapur, menikmati derasnya air terjun bertingkat',
    deskripsi: 'Air terjun abadi di tepi tebing karst Sungai Oyo yang mengalir jernih di tengah lembah hijau Desa Bleberan.',
    vibes: ['ramah-keluarga', 'akses-mudah'],
    waktu_terbaik: 'Pagi hingga siang hari (08.30–12.00 WIB) saat cahaya masuk ke lembah',
    sumber: 'visitingjogja.jogjaprov.go.id',
  },
  {
    id: 'gua-rancang-kencono',
    nama: 'Situs Gua Rancang Kencono',
    lokasi: 'Patuk & Playen',
    kecamatan: 'Kec. Playen, Gunungkidul',
    jenis: 'sejarah',
    harga: 10000,
    jam_buka: '08.00 – 16.30 WIB',
    aktivitas: 'Menelusuri gua purbakala tempat ditemukannya artefak manusia purba, melihat pohon klumpit raksasa berusia ratusan tahun',
    deskripsi: 'Situs sejarah dan arkeologi di Desa Bleberan yang dahulu menjadi lokasi musyawarah Laskar Mataram melawan penjajah.',
    vibes: ['edukasi', 'ramah-keluarga', 'akses-mudah'],
    waktu_terbaik: 'Pagi hari (09.00–11.30 WIB) sebelum menuju Air Terjun Sri Gethuk',
    sumber: 'gunungkidulkab.go.id',
  },
  {
    id: 'desa-wisata-bobung',
    nama: 'Desa Wisata Topeng Kayu Bobung',
    lokasi: 'Patuk & Playen',
    kecamatan: 'Kec. Patuk, Gunungkidul',
    jenis: 'budaya',
    harga: 25000,
    jam_buka: '08.00 – 17.00 WIB',
    aktivitas: 'Workshop membatik topeng kayu bersama perajin lokal, tur sanggar seni ukir, melihat pertunjukan tari topeng tradisional',
    deskripsi: 'Sentra kerajinan topeng batik kayu legendaris di lereng Patuk yang memadukan seni pahat kayu dan motif batik klasik.',
    vibes: ['edukasi', 'ramah-keluarga', 'akses-mudah'],
    waktu_terbaik: 'Pagi hingga siang hari (09.00–14.00 WIB) saat perajin aktif berkarya',
    sumber: 'gunungkidulkab.go.id',
  },
  {
    id: 'desa-wisata-jelok',
    nama: 'Kampung Wisata Jelok',
    lokasi: 'Patuk & Playen',
    kecamatan: 'Kec. Patuk, Gunungkidul',
    jenis: 'budaya',
    harga: 10000,
    jam_buka: '07.00 – 18.00 WIB',
    aktivitas: 'Menyeberangi jembatan gantung tepi Sungai Oyo, mencicipi kuliner tradisional sego abang dan sayur lombok ijo, wisata edukasi tani',
    deskripsi: 'Desa budaya asri di tepi Sungai Oyo dengan pendopo tradisional, hidangan khas Gunungkidul, dan suasana pedesaan tenang.',
    vibes: ['kuliner-nongkrong', 'ramah-keluarga', 'edukasi'],
    waktu_terbaik: 'Siang menjelang sore untuk makan siang tradisional dan bersantai',
    sumber: 'visitingjogja.jogjaprov.go.id',
  },
  {
    id: 'cave-tubing-pindul',
    nama: 'Cave Tubing Gua Pindul & Sungai Oyo',
    lokasi: 'Karangmojo & Semanu',
    kecamatan: 'Kec. Karangmojo, Gunungkidul',
    jenis: 'petualangan',
    harga: 65000,
    jam_buka: '07.00 – 16.00 WIB',
    aktivitas: 'Menyusuri sungai bawah tanah dengan ban pelampung, melihat stalaktit raksasa di zona gelap abadi, body rafting di Sungai Oyo',
    deskripsi: 'Petualangan air menyusuri gua berair tenang sepanjang 350 meter dengan pemandu resmi, ramah untuk pemula dan keluarga.',
    vibes: ['ramah-keluarga', 'akses-mudah'],
    waktu_terbaik: 'Pagi hari (08.00–11.00 WIB) saat debit air stabil dan belum terlalu ramai',
    sumber: 'gunungkidulkab.go.id',
  },
  {
    id: 'gua-jomblang',
    nama: 'Gua Jomblang (Cahaya Surga)',
    lokasi: 'Karangmojo & Semanu',
    kecamatan: 'Kec. Semanu, Gunungkidul',
    jenis: 'petualangan',
    harga: 180000,
    jam_buka: '08.00 – 14.00 WIB',
    aktivitas: 'Single rope rappelling menuruni lubang vertikal 60 meter, trekking hutan purba bawah tanah, menyaksikan sorot cahaya surga',
    deskripsi: 'Gua vertikal karst ikonik dunia dengan fenomena tiang cahaya matahari menembus lorong gelap di bawah permukaan.',
    vibes: ['edukasi'],
    waktu_terbaik: 'Registrasi pagi pukul 08.30 WIB agar tepat di dasar gua pukul 10.30–12.00 WIB',
    sumber: 'visitingjogja.jogjaprov.go.id',
  },
  {
    id: 'gua-kalisuci',
    nama: 'Cave Tubing Kali Suci',
    lokasi: 'Karangmojo & Semanu',
    kecamatan: 'Kec. Semanu, Gunungkidul',
    jenis: 'petualangan',
    harga: 75000,
    jam_buka: '08.00 – 15.30 WIB',
    aktivitas: 'Mengarungi jeram sungai bawah tanah karst menggunakan ban, melewati dua gua berturut-turut dengan peralatan helm dan pelampung',
    deskripsi: 'Destinasi cave tubing bernuansa lebih menantang dengan kombinasi arus sungai terbuka dan lorong gua karst alami.',
    vibes: ['edukasi'],
    waktu_terbaik: 'Pagi hari (08.30–11.00 WIB) pada musim kemarau atau debit aman',
    sumber: 'gunungkidulkab.go.id',
  },
  {
    id: 'situs-megalitikum-sokoliman',
    nama: 'Situs Megalitikum Sokoliman',
    lokasi: 'Karangmojo & Semanu',
    kecamatan: 'Kec. Karangmojo, Gunungkidul',
    jenis: 'sejarah',
    harga: 0,
    jam_buka: '08.00 – 16.00 WIB',
    aktivitas: 'Mengamati menhir, kubur batu, dan arca prasejarah peninggalan abad ke-2 SM, belajar sejarah peradaban awal Gunungkidul',
    deskripsi: 'Taman purbakala terbuka yang menyimpan ratusan koleksi batu menhir dan peti kubur batu prasejarah yang terjaga rapi.',
    vibes: ['edukasi', 'akses-mudah', 'ramah-keluarga'],
    waktu_terbaik: 'Pagi atau sore hari agar teduh saat berkeliling taman situs',
    sumber: 'gunungkidulkab.go.id',
  },
  {
    id: 'watu-giring-semanu',
    nama: 'Tebing Watu Giring & Batu Kapur Semanu',
    lokasi: 'Karangmojo & Semanu',
    kecamatan: 'Kec. Semanu, Gunungkidul',
    jenis: 'sejarah',
    harga: 10000,
    jam_buka: '06.00 – 17.30 WIB',
    aktivitas: 'Menjelajahi undakan batu kapur raksasa menyerupai benteng kuno, fotografi lanskap karst, menikmati suasana tenang pedesaan',
    deskripsi: 'Formasi bekas tambang batu kapur berundak yang membentuk terasering monumental mirip situs reruntuhan purba.',
    vibes: ['sunrise-sunset', 'akses-mudah'],
    waktu_terbaik: 'Pagi hari (06.30–08.30 WIB) atau sore (15.30–17.00 WIB)',
    sumber: 'visitingjogja.jogjaprov.go.id',
  },
  {
    id: 'pantai-drini',
    nama: 'Pantai Drini & Pulau Karang',
    lokasi: 'Tanjungsari & Baron',
    kecamatan: 'Kec. Tanjungsari, Gunungkidul',
    jenis: 'alam',
    harga: 15000,
    jam_buka: '24 jam',
    aktivitas: 'Mendayung kano di laguna tenang sisi timur, naik ke puncak pulau karang saat air surut, menyantap seafood segar tepi pantai',
    deskripsi: 'Pantai berpasir putih dengan karakter unik: sisi timur berupa teluk tenang ramah anak, sisi barat berombak laut selatan.',
    vibes: ['ramah-keluarga', 'kuliner-nongkrong', 'sunrise-sunset', 'akses-mudah'],
    waktu_terbaik: 'Pagi hari (06.30–10.00 WIB) atau sore menjelang sunset',
    sumber: 'gunungkidulkab.go.id',
  },
  {
    id: 'pantai-baron-mercusuar',
    nama: 'Pantai Baron & Mercusuar Tanjung',
    lokasi: 'Tanjungsari & Baron',
    kecamatan: 'Kec. Tanjungsari, Gunungkidul',
    jenis: 'alam',
    harga: 15000,
    jam_buka: '24 jam (Mercusuar 08.00 – 17.00)',
    aktivitas: 'Melihat pertemuan sungai bawah tanah dengan laut, naik ke bukit mercusuar untuk panorama 360 derajat, kuliner ikan bakar',
    deskripsi: 'Teluk pelabuhan nelayan tradisional yang diapit dua bukit karang tinggi serta dilengkapi jalur pejalan kaki menuju mercusuar.',
    vibes: ['kuliner-nongkrong', 'ramah-keluarga', 'akses-mudah'],
    waktu_terbaik: 'Sore hari (15.00–17.30 WIB) untuk naik ke area mercusuar dan makan malam',
    sumber: 'gunungkidulkab.go.id',
  },
  {
    id: 'pantai-sepanjang',
    nama: 'Pantai Sepanjang',
    lokasi: 'Tanjungsari & Baron',
    kecamatan: 'Kec. Tanjungsari, Gunungkidul',
    jenis: 'alam',
    harga: 15000,
    jam_buka: '24 jam',
    aktivitas: 'Jalan santai di garis pantai pasir putih terpanjang di Gunungkidul, piknik di bawah gazebo pandan, menikmati sunset',
    deskripsi: 'Pantai berpasir landai dengan garis pantai panjang dan suasana lebih lega untuk bersantai bersama keluarga atau rombongan.',
    vibes: ['ramah-keluarga', 'sunrise-sunset', 'kuliner-nongkrong', 'akses-mudah'],
    waktu_terbaik: 'Sore hari (15.30–18.00 WIB) saat air surut dan matahari turun',
    sumber: 'visitingjogja.jogjaprov.go.id',
  },
  {
    id: 'pantai-nguyahan-ngobaran',
    nama: 'Pantai Ngobaran & Budaya Pesisir',
    lokasi: 'Tanjungsari & Baron',
    kecamatan: 'Kec. Saptosari / Tanjungsari, Gunungkidul',
    jenis: 'budaya',
    harga: 10000,
    jam_buka: '06.00 – 18.00 WIB',
    aktivitas: 'Mengunjungi pura dan bangunan berarsitektur Jawa-Bali di tebing pantai, melihat hamparan rumput laut saat surut, kuliner landak laut',
    deskripsi: 'Pantai karang eksotis yang menjadi simbol harmoni budaya dengan tempat ibadah berdampingan di atas tebing samudra.',
    vibes: ['edukasi', 'sunrise-sunset', 'kuliner-nongkrong'],
    waktu_terbaik: 'Pagi saat air laut surut agar terumbu karang dan kolam pasang terlihat',
    sumber: 'gunungkidulkab.go.id',
  },
  {
    id: 'pantai-indrayanti',
    nama: 'Pantai Pulang Syawal (Indrayanti)',
    lokasi: 'Tepus & Girisubo',
    kecamatan: 'Kec. Tepus, Gunungkidul',
    jenis: 'alam',
    harga: 15000,
    jam_buka: '24 jam',
    aktivitas: 'Bersantai di kafe dan gazebo tepi pantai, berfoto di bukit karang sisi timur, menikmati makan malam seafood tepi ombak',
    deskripsi: 'Salah satu pantai paling tertata di pesisir Tepus dengan pasir putih bersih, fasilitas lengkap, dan deretan restoran pesisir.',
    vibes: ['kuliner-nongkrong', 'ramah-keluarga', 'akses-mudah', 'sunrise-sunset'],
    waktu_terbaik: 'Sore hingga malam hari (16.00–20.00 WIB)',
    sumber: 'gunungkidulkab.go.id',
  },
  {
    id: 'pantai-timang',
    nama: 'Pantai Timang & Pulau Batu Karang',
    lokasi: 'Tepus & Girisubo',
    kecamatan: 'Kec. Tepus, Gunungkidul',
    jenis: 'petualangan',
    harga: 15000,
    jam_buka: '06.00 – 17.30 WIB',
    aktivitas: 'Menyeberang ke Pulau Timang via gondola tradisional atau jembatan gantung, naik jeep akses berbatu, menikmati olahan lobster segar',
    deskripsi: 'Tebing karang terjal tempat nelayan tradisional mencari lobster dengan gondola kayu di atas deburan ombak Samudra Hindia.',
    vibes: ['kuliner-nongkrong'],
    waktu_terbaik: 'Pagi hari (07.30–10.30 WIB) sebelum angin laut bertiup kencang',
    sumber: 'visitingjogja.jogjaprov.go.id',
  },
  {
    id: 'bukit-pengilon-siung',
    nama: 'Bukit Pengilon & Pantai Siung',
    lokasi: 'Tepus & Girisubo',
    kecamatan: 'Kec. Tepus, Gunungkidul',
    jenis: 'petualangan',
    harga: 15000,
    jam_buka: '06.00 – 18.00 WIB',
    aktivitas: 'Trekking melintasi sabana hijau di atas tebing karang, panjat tebing di Pantai Siung, berkemah menghadap lautan lepas',
    deskripsi: 'Perpaduan jalur trekking bukit rumput hijau dan tebing panjat berstandar internasional yang menghadap langsung ke samudra.',
    vibes: ['sunrise-sunset'],
    waktu_terbaik: 'Pagi (06.00–09.00 WIB) atau sore (15.30–17.45 WIB) untuk trekking nyaman',
    sumber: 'visitingjogja.jogjaprov.go.id',
  },
  {
    id: 'pantai-wediombo',
    nama: 'Pantai Wediombo & Laguna Alami',
    lokasi: 'Tepus & Girisubo',
    kecamatan: 'Kec. Girisubo, Gunungkidul',
    jenis: 'alam',
    harga: 15000,
    jam_buka: '24 jam',
    aktivitas: 'Berendam di kolam laguna batu karang alami, belajar selancar pemula, menyaksikan matahari terbenam dari teluk vulkanik',
    deskripsi: 'Teluk pantai berformasi batuan vulkanik purba dengan laguna alami berair jernih yang terlindung dari ombak besar.',
    vibes: ['sunrise-sunset', 'ramah-keluarga'],
    waktu_terbaik: 'Sore hari (15.00–17.45 WIB) ketika arah matahari menghadap teluk',
    sumber: 'visitingjogja.jogjaprov.go.id',
  },
];

export function formatRupiah(value: number): string {
  if (value === 0) return 'Gratis';
  return Number(value).toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  });
}

export function filterDestinations(
  prefs: Partial<UserPreferences>,
  searchQuery?: string
): Destination[] {
  const budget = prefs.budget;
  const jenis = prefs.jenis;
  const lokasi = prefs.lokasi;
  const vibes = prefs.vibes ?? [];
  const q = (searchQuery ?? '').trim().toLowerCase();

  return DESTINATIONS.filter((d) => {
    if (budget !== undefined && budget !== null && budget < BUDGET_MAX_SLIDER) {
      if (d.harga > budget) return false;
    }
    if (jenis && jenis !== 'semua' && d.jenis !== jenis) {
      return false;
    }
    if (lokasi && lokasi !== 'semua' && d.lokasi !== lokasi) {
      return false;
    }
    if (vibes.length > 0) {
      const hasAnyVibe = vibes.some((v) => d.vibes.includes(v));
      if (!hasAnyVibe) return false;
    }
    if (q) {
      const haystack =
        `${d.nama} ${d.lokasi} ${d.kecamatan} ${d.jenis} ${d.aktivitas} ${d.deskripsi}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}
