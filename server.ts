import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  DESTINATIONS,
  filterDestinations,
  formatRupiah,
  type AreaDestinasi,
  type Destination,
  type JenisWisata,
  type VibeTag,
} from './src/data/destinations.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY belum dikonfigurasi. Silakan atur GEMINI_API_KEY pada panel Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function rankDestinationsForQuery(
  candidates: Destination[],
  query: string,
  vibes: VibeTag[]
): Destination[] {
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3);

  const scored = candidates.map((dest) => {
    const text = `${dest.nama} ${dest.lokasi} ${dest.kecamatan} ${dest.jenis} ${dest.aktivitas} ${dest.deskripsi}`.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (text.includes(token)) score += 2;
      if (dest.nama.toLowerCase().includes(token)) score += 3;
    }
    for (const v of vibes) {
      if (dest.vibes.includes(v)) score += 2;
    }
    return { dest, score };
  });

  scored.sort((a, b) => b.score - a.score || a.dest.harga - b.dest.harga);
  return scored.slice(0, 4).map((item) => item.dest);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/destinations', (req, res) => {
    const budgetRaw = req.query.budget;
    const budget =
      budgetRaw !== undefined && budgetRaw !== '' && !Number.isNaN(Number(budgetRaw))
        ? Number(budgetRaw)
        : undefined;
    const jenis = (req.query.jenis as JenisWisata | 'semua' | undefined) ?? 'semua';
    const lokasi = (req.query.lokasi as AreaDestinasi | 'semua' | undefined) ?? 'semua';
    const vibesRaw = typeof req.query.vibes === 'string' && req.query.vibes ? req.query.vibes.split(',') : [];
    const vibes = vibesRaw as VibeTag[];
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;

    const results = filterDestinations({ budget, jenis, lokasi, vibes }, q);
    res.json({
      total: DESTINATIONS.length,
      count: results.length,
      destinations: results,
    });
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const body = req.body ?? {};
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      if (!message) {
        res.status(400).json({ detail: 'Pesan tidak boleh kosong.' });
        return;
      }

      const budget =
        typeof body.budget === 'number' && !Number.isNaN(body.budget) ? body.budget : undefined;
      const jenis =
        typeof body.jenis === 'string' && body.jenis !== 'semua'
          ? (body.jenis as JenisWisata)
          : 'semua';
      const lokasi =
        typeof body.lokasi === 'string' && body.lokasi !== 'semua'
          ? (body.lokasi as AreaDestinasi)
          : 'semua';
      const vibes: VibeTag[] = Array.isArray(body.vibes) ? body.vibes : [];
      const history: { role: 'user' | 'bot'; text: string }[] = Array.isArray(body.history)
        ? body.history.slice(-6)
        : [];

      const strictCandidates = filterDestinations({ budget, jenis, lokasi, vibes });
      const pool = strictCandidates.length > 0 ? strictCandidates : DESTINATIONS;
      const topDestinations = rankDestinationsForQuery(pool, message, vibes);

      const contextText = topDestinations
        .map(
          (d, idx) =>
            `[${idx + 1}] ID: ${d.id} | Nama: ${d.nama} | Area: ${d.lokasi} (${d.kecamatan}) | Jenis: ${d.jenis} | Harga tiket: ${formatRupiah(d.harga)} | Jam buka: ${d.jam_buka} | Aktivitas: ${d.aktivitas} | Waktu terbaik: ${d.waktu_terbaik} | Deskripsi: ${d.deskripsi}`
        )
        .join('\n');

      const activePrefSummary = [
        budget !== undefined && budget < 200000
          ? `Budget maksimal ${formatRupiah(budget)}`
          : 'Budget fleksibel',
        jenis !== 'semua' ? `Jenis wisata: ${jenis}` : 'Semua jenis wisata',
        lokasi !== 'semua' ? `Kawasan Gunungkidul: ${lokasi}` : 'Semua kawasan Kabupaten Gunungkidul',
        vibes.length > 0 ? `Suasana favorit: ${vibes.join(', ')}` : null,
      ]
        .filter(Boolean)
        .join(' · ');

      const conversationContext = history
        .map((h) => `${h.role === 'user' ? 'Pengguna' : 'Asisten'}: ${h.text}`)
        .join('\n');

      const prompt = `Preferensi pengguna saat ini: ${activePrefSummary}
${strictCandidates.length === 0 ? 'Catatan: Tidak ada destinasi Gunungkidul yang memenuhi kombinasi filter secara persis, sehingga sistem menyediakan alternatif terdekat dari dataset Kabupaten Gunungkidul.' : ''}

Data destinasi Kabupaten Gunungkidul yang relevan:
${contextText}

${conversationContext ? `Riwayat percakapan singkat:\n${conversationContext}\n` : ''}Pertanyaan pengguna: "${message}"

Berikan jawaban rekomendasi wisata di Kabupaten Gunungkidul yang hangat, ringkas, terstruktur, dan praktis dalam bahasa Indonesia berdasarkan data di atas. Jelaskan secara spesifik mengapa destinasi tersebut cocok dengan preferensi pengguna (budget, jenis, kawasan Gunungkidul, atau waktu terbaik), dan pilih ID destinasi yang paling relevan dari daftar di atas untuk ditampilkan sebagai kartu rekomendasi.`;

      const ai = getGeminiClient();
      const systemInstruction =
        'Kamu adalah WisataJogja AI, asisten rekomendasi perjalanan lokal khusus Kabupaten Gunungkidul yang ramah, akurat, dan selalu mendasarkan fakta harga serta jam operasional dari konteks dataset Kabupaten Gunungkidul yang diberikan. Jangan menyarankan destinasi di luar Kabupaten Gunungkidul atau di luar dataset. Gunakan bahasa Indonesia yang natural dan ringkas.';

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          answer: {
            type: Type.STRING,
            description:
              'Penjelasan rekomendasi dalam bahasa Indonesia yang ramah, jelas, dan informatif.',
          },
          recommendedIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description:
              'Daftar ID destinasi dari konteks yang paling direkomendasikan (maksimal 3 ID).',
          },
        },
        required: ['answer', 'recommendedIds'],
      };

      const callModel = (model: string, thinkingLevel: ThinkingLevel) =>
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel },
            responseMimeType: 'application/json',
            responseSchema,
          },
        });

      const isTransientError = (err: unknown): boolean => {
        const msg = err instanceof Error ? err.message : String(err);
        return (
          msg.includes('503') ||
          msg.includes('UNAVAILABLE') ||
          msg.toLowerCase().includes('high demand') ||
          msg.includes('429') ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('ECONNRESET') ||
          msg.includes('ETIMEDOUT')
        );
      };

      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      const modelChain: { model: string; thinkingLevel: ThinkingLevel; attempts: number }[] = [
        { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW, attempts: 3 },
        { model: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL, attempts: 2 },
      ];

      let response: Awaited<ReturnType<typeof callModel>> | null = null;
      let lastError: unknown = null;

      for (const entry of modelChain) {
        for (let attempt = 1; attempt <= entry.attempts; attempt++) {
          try {
            response = await callModel(entry.model, entry.thinkingLevel);
            break;
          } catch (err) {
            lastError = err;
            if (!isTransientError(err)) {
              throw err;
            }
            if (attempt < entry.attempts) {
              const backoffMs = 700 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250);
              await sleep(backoffMs);
            }
          }
        }
        if (response) break;
      }

      if (!response) {
        throw lastError ?? new Error('Model AI tidak merespons.');
      }

      const rawText = (response.text ?? '{}').trim();
      let parsed: { answer?: string; recommendedIds?: string[] } = {};
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = { answer: rawText, recommendedIds: topDestinations.slice(0, 3).map((d) => d.id) };
      }

      const selectedIds = Array.isArray(parsed.recommendedIds) ? parsed.recommendedIds : [];
      const selectedDestinations =
        selectedIds.length > 0
          ? topDestinations.filter((d) => selectedIds.includes(d.id))
          : topDestinations.slice(0, 3);

      const finalDestinations =
        selectedDestinations.length > 0 ? selectedDestinations : topDestinations.slice(0, 3);

      res.json({
        answer:
          parsed.answer ||
          'Berikut beberapa destinasi Kabupaten Gunungkidul yang paling sesuai dengan preferensimu.',
        destinations: finalDestinations,
        rag_enabled: true,
        exact_match_count: strictCandidates.length,
      });
    } catch (error) {
      const rawMessage =
        error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses permintaan AI.';

      let statusCode = 500;
      let friendlyDetail = rawMessage;

      if (rawMessage.includes('GEMINI_API_KEY')) {
        statusCode = 503;
      } else if (
        rawMessage.includes('503') ||
        rawMessage.includes('UNAVAILABLE') ||
        rawMessage.toLowerCase().includes('high demand')
      ) {
        statusCode = 503;
        friendlyDetail =
          'Server AI sedang mengalami lonjakan permintaan sementara (503). Silakan klik "Coba lagi" beberapa detik lagi.';
      } else if (rawMessage.includes('429') || rawMessage.includes('RESOURCE_EXHAUSTED')) {
        statusCode = 429;
        friendlyDetail =
          'Kuota permintaan API sedang penuh sementara (429). Tunggu sebentar lalu coba lagi, atau periksa API key di Settings > Secrets.';
      } else if (
        rawMessage.includes('API_KEY_INVALID') ||
        rawMessage.includes('PERMISSION_DENIED') ||
        rawMessage.includes('403')
      ) {
        statusCode = 403;
        friendlyDetail =
          'API key Gemini tidak valid atau ditolak. Silakan periksa konfigurasi GEMINI_API_KEY pada panel Settings > Secrets.';
      }

      res.status(statusCode).json({ detail: friendlyDetail });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WisataJogja AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
