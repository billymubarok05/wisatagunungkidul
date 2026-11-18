import os
import random
import time
from pathlib import Path
from typing import Optional

import chromadb
import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
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
GEMINI_FALLBACK_MODEL = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-2.5-flash-lite")
EMBED_MODEL = os.getenv("GEMINI_EMBED_MODEL", "gemini-embedding-001")

app = FastAPI(title="WisataJogja AI — Kabupaten Gunungkidul", version="1.0.0")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

client = (
    genai.Client(api_key=API_KEY)
    if API_KEY and API_KEY != "ISI_API_KEY_GEMINI_ANDA"
    else None
)
chroma_client = chromadb.PersistentClient(path=str(ROOT / "chroma_db"))
collection = chroma_client.get_or_create_collection(
    name="destinasi_wisata_gunungkidul",
    metadata={"hnsw:space": "cosine"},
)


def load_csv_safe(path: Path) -> pd.DataFrame:
    for enc in ("utf-8-sig", "utf-8", "cp1252", "latin1"):
        try:
            return pd.read_csv(path, encoding=enc).fillna("")
        except UnicodeDecodeError:
            continue
    return pd.read_csv(path, encoding="utf-8", encoding_errors="replace").fillna("")


data = load_csv_safe(DATA_FILE)


def row_to_dict(row) -> dict:
    vibes_raw = str(row.get("vibes", "")).strip()
    vibes = [v.strip() for v in vibes_raw.split(";") if v.strip()]
    return {
        "id": str(row.get("id", "")),
        "nama": str(row.get("nama", "")),
        "lokasi": str(row.get("lokasi", "")),
        "kecamatan": str(row.get("kecamatan", "Kabupaten Gunungkidul")),
        "jenis": str(row.get("jenis", "")),
        "harga": int(float(row.get("harga", 0) or 0)),
        "jam_buka": str(row.get("jam_buka", "-")),
        "aktivitas": str(row.get("aktivitas", "")).replace(";", ", "),
        "deskripsi": str(row.get("deskripsi", "")),
        "vibes": vibes,
        "waktu_terbaik": str(row.get("waktu_terbaik", "")),
        "sumber": str(row.get("sumber", "")),
    }


ALL_DESTINATIONS = [row_to_dict(row) for _, row in data.iterrows()]


def is_transient_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    return any(
        token in msg
        for token in ("503", "unavailable", "high demand", "429", "resource_exhausted", "timed out")
    )


def generate_with_retry(prompt: str) -> str:
    if not client:
        raise RuntimeError("GEMINI_API_KEY belum diatur.")

    model_chain = [
        (GEMINI_MODEL, 3),
        (GEMINI_FALLBACK_MODEL, 2),
    ]
    last_exc: Optional[Exception] = None

    for model_name, attempts in model_chain:
        for attempt in range(1, attempts + 1):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )
                return (response.text or "").strip()
            except Exception as exc:
                last_exc = exc
                if not is_transient_error(exc):
                    raise
                if attempt < attempts:
                    backoff = (0.7 * (2 ** (attempt - 1))) + random.uniform(0, 0.25)
                    time.sleep(backoff)

    raise last_exc or RuntimeError("Model AI gagal merespons.")


def destination_text(item: dict) -> str:
    return (
        f"Nama: {item['nama']}. Kawasan: {item['lokasi']} ({item['kecamatan']}). "
        f"Jenis: {item['jenis']}. Harga tiket: Rp{item['harga']}. "
        f"Jam buka: {item['jam_buka']}. Aktivitas: {item['aktivitas']}. "
        f"Waktu terbaik: {item['waktu_terbaik']}. Deskripsi: {item['deskripsi']}."
    )


def embed_texts(texts: list[str], task_type: str) -> list[list[float]]:
    if not client:
        raise RuntimeError("GEMINI_API_KEY belum diatur.")
    last_exc: Optional[Exception] = None
    for attempt in range(1, 4):
        try:
            response = client.models.embed_content(
                model=EMBED_MODEL,
                contents=texts,
                config=types.EmbedContentConfig(task_type=task_type),
            )
            return [item.values for item in response.embeddings]
        except Exception as exc:
            last_exc = exc
            if not is_transient_error(exc) or attempt == 3:
                raise
            time.sleep(0.7 * (2 ** (attempt - 1)))
    raise last_exc or RuntimeError("Gagal membuat embedding.")


def index_dataset():
    if not client:
        return
    docs, ids, metas = [], [], []
    for item in ALL_DESTINATIONS:
        docs.append(destination_text(item))
        ids.append(item["id"])
        metas.append({
            "id": item["id"],
            "nama": item["nama"],
            "lokasi": item["lokasi"],
            "kecamatan": item["kecamatan"],
            "jenis": item["jenis"],
            "harga": item["harga"],
            "jam_buka": item["jam_buka"],
            "aktivitas": item["aktivitas"],
            "deskripsi": item["deskripsi"],
            "vibes": ";".join(item["vibes"]),
            "waktu_terbaik": item["waktu_terbaik"],
            "sumber": item["sumber"],
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
    vibes: Optional[list[str]] = None


def filter_destinations(
    budget: Optional[int] = None,
    jenis: Optional[str] = None,
    lokasi: Optional[str] = None,
    vibes: Optional[list[str]] = None,
    query: str = "",
) -> list[dict]:
    q = query.strip().lower()
    vibe_list = vibes or []
    results = []
    for item in ALL_DESTINATIONS:
        if budget is not None and item["harga"] > budget:
            continue
        if jenis and jenis.lower() != "semua" and item["jenis"].lower() != jenis.lower():
            continue
        if lokasi and lokasi.lower() != "semua" and item["lokasi"].lower() != lokasi.lower():
            continue
        if vibe_list and not any(v in item["vibes"] for v in vibe_list):
            continue
        if q:
            haystack = (
                f"{item['nama']} {item['lokasi']} {item['kecamatan']} "
                f"{item['jenis']} {item['aktivitas']} {item['deskripsi']}"
            ).lower()
            if q not in haystack:
                continue
        results.append(item)
    return results


def rank_candidates(candidates: list[dict], message: str, vibes: list[str], limit=4) -> list[dict]:
    terms = [t for t in message.lower().replace(",", " ").replace(".", " ").split() if len(t) > 2]
    scored = []
    for item in candidates:
        searchable = destination_text(item).lower()
        score = sum(2 for term in terms if term in searchable)
        score += sum(3 for term in terms if term in item["nama"].lower())
        score += sum(2 for v in vibes if v in item["vibes"])
        scored.append((score, -item["harga"], item))
    scored.sort(key=lambda x: (x[0], x[1]), reverse=True)
    return [x[2] for x in scored[:limit]]


def retrieve_rag(query: str, budget, jenis, lokasi, vibes: list[str], limit=4) -> list[dict]:
    filtered = filter_destinations(budget=budget, jenis=jenis, lokasi=lokasi, vibes=vibes)
    pool = filtered if filtered else ALL_DESTINATIONS

    if not client or collection.count() == 0:
        return rank_candidates(pool, query, vibes, limit)

    try:
        vector = embed_texts([query], "RETRIEVAL_QUERY")[0]
        filters = []
        if budget is not None:
            filters.append({"harga": {"$lte": budget}})
        if jenis and jenis.lower() != "semua":
            filters.append({"jenis": {"$eq": jenis.lower()}})
        if lokasi and lokasi.lower() != "semua":
            filters.append({"lokasi": {"$eq": lokasi}})
        where = filters[0] if len(filters) == 1 else ({"$and": filters} if len(filters) > 1 else None)

        res = collection.query(
            query_embeddings=[vector],
            n_results=min(limit * 2, max(collection.count(), 1)),
            where=where,
            include=["metadatas"],
        )
        raw_metas = res.get("metadatas", [[]])[0]
        parsed = []
        for meta in raw_metas:
            item_vibes = [v for v in str(meta.get("vibes", "")).split(";") if v]
            if vibes and not any(v in item_vibes for v in vibes):
                continue
            parsed.append({**meta, "vibes": item_vibes, "harga": int(meta.get("harga", 0))})
        if parsed:
            return parsed[:limit]
    except Exception:
        pass

    return rank_candidates(pool, query, vibes, limit)


def fallback_answer(places: list[dict]) -> str:
    if not places:
        return (
            "Belum ada destinasi Kabupaten Gunungkidul yang cocok dengan filter tersebut. "
            "Coba naikkan budget atau ubah jenis wisata dan kawasan."
        )
    lines = ["Berikut rekomendasi destinasi di Kabupaten Gunungkidul yang sesuai preferensimu:"]
    for p in places:
        harga_str = "Gratis" if p["harga"] == 0 else f"Rp{p['harga']:,}".replace(",", ".")
        lines.append(
            f"• {p['nama']} ({p['kecamatan']}) — {p['jenis'].title()}, tiket {harga_str}. "
            f"Aktivitas: {p['aktivitas']}."
        )
    return "\n\n".join(lines)


@app.get("/")
def home():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/destinations")
def get_destinations(
    budget: Optional[int] = Query(default=None, ge=0),
    jenis: Optional[str] = None,
    lokasi: Optional[str] = None,
    vibes: Optional[str] = None,
    q: str = "",
):
    vibe_list = [v for v in (vibes or "").split(",") if v]
    results = filter_destinations(budget=budget, jenis=jenis, lokasi=lokasi, vibes=vibe_list, query=q)
    return {"total": len(ALL_DESTINATIONS), "count": len(results), "destinations": results}


@app.get("/api/health")
def health():
    return {"status": "ok", "gemini_enabled": bool(client), "destinations": len(ALL_DESTINATIONS)}


@app.post("/api/chat")
def chat(req: ChatRequest):
    try:
        vibes = req.vibes or []
        places = retrieve_rag(req.message, req.budget, req.jenis, req.lokasi, vibes)
        if client and places:
            context = "\n\n".join(destination_text(p) for p in places)
            prompt = f"""Kamu adalah WisataJogja AI, asisten wisata lokal khusus Kabupaten Gunungkidul.
Jawab dalam bahasa Indonesia yang ramah, ringkas, dan mudah dibaca (tanpa simbol markdown berlebihan).
Gunakan HANYA data destinasi Kabupaten Gunungkidul di bawah ini; jangan mengarang destinasi lain.

Preferensi pengguna:
- Budget maksimum: {f'Rp{req.budget}' if req.budget is not None else 'Fleksibel'}
- Jenis wisata: {req.jenis or 'Semua jenis'}
- Kawasan Gunungkidul: {req.lokasi or 'Semua kawasan'}
- Suasana favorit: {', '.join(vibes) if vibes else 'Semua suasana'}

Pertanyaan pengguna: {req.message}

Data destinasi relevan:
{context}"""
            answer = generate_with_retry(prompt) or fallback_answer(places)
        else:
            answer = fallback_answer(places)

        return {"answer": answer, "destinations": places, "rag_enabled": bool(client)}
    except Exception as exc:
        if is_transient_error(exc):
            raise HTTPException(
                status_code=503,
                detail="Server AI sedang mengalami lonjakan permintaan sementara (503). Silakan coba lagi beberapa detik lagi.",
            )
        raise HTTPException(status_code=500, detail=f"Gagal memproses permintaan: {exc}")