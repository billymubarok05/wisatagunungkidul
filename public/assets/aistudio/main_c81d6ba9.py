import os
from pathlib import Path
from typing import Optional

import chromadb
import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

load_dotenv()

ROOT = Path(__file__).resolve().parent
DATA_FILE = ROOT / "wisata.csv"
STATIC_DIR = ROOT / "static"
API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
EMBED_MODEL = os.getenv("GEMINI_EMBED_MODEL", "gemini-embedding-001")

app = FastAPI(title="WisataJogja AI", version="0.1.0")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

client = genai.Client(api_key=API_KEY) if API_KEY and API_KEY != "isi_api_key_di_sini" else None
chroma_client = chromadb.PersistentClient(path=str(ROOT / "chroma_db"))
collection = chroma_client.get_or_create_collection(
    name="destinasi_wisata_jogja",
    metadata={"hnsw:space": "cosine"}
)
data = pd.read_csv(DATA_FILE).fillna("")

def destination_text(row) -> str:
    return (
        f"Nama: {row['nama']}. Lokasi: {row['lokasi']}. Jenis: {row['jenis']}. "
        f"Harga tiket (data contoh): Rp{row['harga']}. Aktivitas: {row['aktivitas']}. "
        f"Deskripsi: {row['deskripsi']}. Sumber: {row['sumber']}."
    )

def embed_texts(texts: list[str], task_type: str) -> list[list[float]]:
    """Embedding dari Gemini. Membutuhkan GEMINI_API_KEY."""
    if not client:
        raise RuntimeError("GEMINI_API_KEY belum diatur.")
    response = client.models.embed_content(
        model=EMBED_MODEL,
        contents=texts,
        config=types.EmbedContentConfig(task_type=task_type)
    )
    return [item.values for item in response.embeddings]

def index_dataset():
    """Indeks ulang dataset ketika aplikasi mulai; API key diperlukan untuk embedding RAG."""
    if not client:
        return
    docs, ids, metas = [], [], []
    for i, row in data.iterrows():
        docs.append(destination_text(row))
        ids.append(str(i))
        metas.append({
            "nama": str(row["nama"]),
            "lokasi": str(row["lokasi"]),
            "jenis": str(row["jenis"]),
            "harga": int(float(row["harga"] or 0)),
            "aktivitas": str(row["aktivitas"]),
            "deskripsi": str(row["deskripsi"]),
            "sumber": str(row["sumber"])
        })
    if docs:
        vectors = embed_texts(docs, "RETRIEVAL_DOCUMENT")
        collection.upsert(ids=ids, documents=docs, metadatas=metas, embeddings=vectors)

@app.on_event("startup")
def startup():
    try:
        index_dataset()
    except Exception as exc:
        print(f"[Peringatan] Dataset belum diindeks ke ChromaDB: {exc}")

class ChatRequest(BaseModel):
    message: str = Field(min_length=2, max_length=1500)
    budget: Optional[int] = Field(default=None, ge=0)
    jenis: Optional[str] = None
    lokasi: Optional[str] = None

def simple_filter_and_rank(message: str, budget, jenis, lokasi, limit=5):
    """Fallback tanpa API: filter preferensi dan pencocokan kata sederhana."""
    terms = set(message.lower().replace(",", " ").replace(".", " ").split())
    results = []
    for _, row in data.iterrows():
        price = int(float(row["harga"] or 0))
        if budget is not None and price > budget:
            continue
        if jenis and jenis.lower() != "semua" and jenis.lower() not in str(row["jenis"]).lower():
            continue
        if lokasi and lokasi.lower() != "semua" and lokasi.lower() not in str(row["lokasi"]).lower():
            continue
        searchable = destination_text(row).lower()
        score = sum(1 for term in terms if len(term) > 2 and term in searchable)
        results.append((score, row))
    results.sort(key=lambda item: item[0], reverse=True)
    return [row for _, row in results[:limit]]

def retrieve_rag(query: str, budget, jenis, lokasi, limit=5):
    if not client or collection.count() == 0:
        return simple_filter_and_rank(query, budget, jenis, lokasi, limit)
    vector = embed_texts([query], "RETRIEVAL_QUERY")[0]
    where = None
    # Filter metadata di ChromaDB hanya memakai satu kondisi pada versi sederhana ini.
    filters = []
    if budget is not None:
        filters.append({"harga": {"$lte": budget}})
    if jenis and jenis.lower() != "semua":
        filters.append({"jenis": {"$eq": jenis.lower()}})
    if lokasi and lokasi.lower() != "semua":
        filters.append({"lokasi": {"$eq": lokasi}})
    if len(filters) == 1:
        where = filters[0]
    elif len(filters) > 1:
        where = {"$and": filters}
    result = collection.query(
        query_embeddings=[vector],
        n_results=min(limit, max(collection.count(), 1)),
        where=where,
        include=["documents", "metadatas", "distances"]
    )
    rows = []
    for meta in result.get("metadatas", [[]])[0]:
        if budget is not None and int(meta["harga"]) > budget:
            continue
        if jenis and jenis.lower() != "semua" and str(meta["jenis"]).lower() != jenis.lower():
            continue
        if lokasi and lokasi.lower() != "semua" and str(meta["lokasi"]).lower() != lokasi.lower():
            continue
        rows.append(meta)
    return rows[:limit]

def fallback_answer(message, places):
    if not places:
        return ("Saya belum menemukan destinasi yang cocok dengan filter tersebut. "
                "Coba naikkan anggaran atau ubah jenis wisata/lokasi.")
    lines = ["Berikut destinasi yang mungkin sesuai dengan preferensimu:"]
    for p in places:
        get = (lambda key: p.get(key, "") if isinstance(p, dict) else str(p[key]))
        lines.append(
            f"- **{get('nama')}** — {get('lokasi')}. Jenis: {get('jenis')}. "
            f"Estimasi tiket pada dataset: Rp{get('harga')}. Aktivitas: {get('aktivitas')}. "
            f"Catatan: verifikasi harga dan jam operasional pada sumber resmi sebelum berkunjung."
        )
    return "\n\n".join(lines)

@app.get("/")
def home():
    return FileResponse(STATIC_DIR / "index.html")

@app.get("/api/health")
def health():
    return {"status": "ok", "gemini_enabled": bool(client), "destinations": len(data)}

@app.post("/api/chat")
def chat(req: ChatRequest):
    try:
        places = retrieve_rag(req.message, req.budget, req.jenis, req.lokasi)
        if client and places:
            context = "\n\n".join(
                destination_text(p) if not isinstance(p, dict) else
                (f"Nama: {p.get('nama')}. Lokasi: {p.get('lokasi')}. Jenis: {p.get('jenis')}. "
                 f"Harga tiket (data contoh): Rp{p.get('harga')}. Aktivitas: {p.get('aktivitas')}. "
                 f"Deskripsi: {p.get('deskripsi')}. Sumber: {p.get('sumber')}.")
                for p in places
            )
            prompt = f"""Kamu adalah WisataJogja AI, asisten pencarian destinasi wisata Yogyakarta.
Jawab dalam bahasa Indonesia yang ramah. Gunakan HANYA konteks destinasi di bawah ini.
Jangan mengarang harga, fasilitas, jam buka, atau fakta yang tidak ada di konteks.
Jika data tidak tersedia, katakan bahwa pengguna perlu memverifikasinya pada sumber resmi.
Jelaskan singkat mengapa tiap destinasi cocok dengan preferensi pengguna.
Pertanyaan pengguna: {req.message}
Filter budget maksimum: {req.budget if req.budget is not None else 'tidak ditentukan'}
Filter jenis: {req.jenis or 'tidak ditentukan'}
Filter lokasi: {req.lokasi or 'tidak ditentukan'}
Konteks hasil retrieval:
{context}
Berikan rekomendasi yang mudah dibaca."""
            response = client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
            answer = response.text or fallback_answer(req.message, places)
        else:
            answer = fallback_answer(req.message, places)
        result_places = []
        for p in places:
            if isinstance(p, dict):
                result_places.append(p)
            else:
                result_places.append({
                    "nama": str(p["nama"]), "lokasi": str(p["lokasi"]),
                    "jenis": str(p["jenis"]), "harga": int(float(p["harga"] or 0)),
                    "aktivitas": str(p["aktivitas"]), "deskripsi": str(p["deskripsi"]),
                    "sumber": str(p["sumber"])
                })
        return {"answer": answer, "destinations": result_places, "rag_enabled": bool(client)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Gagal memproses permintaan: {exc}")
