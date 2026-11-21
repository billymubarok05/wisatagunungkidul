# WisataJogja AI — Prototype RAG

## Prasyarat
- Python 3.10 atau lebih baru
- Internet saat memasang dependensi dan memakai Gemini API
- API key Gemini (opsional untuk mode demo; dibutuhkan untuk embedding + generasi RAG)

## Menjalankan di Windows
1. Ekstrak ZIP, lalu buka folder `wisatajogja-rag` di VS Code.
2. Buka terminal di folder proyek.
3. Buat virtual environment:
   `py -m venv .venv`
4. Aktifkan:
   PowerShell: `.\.venv\Scripts\Activate.ps1`
   CMD: `.venv\Scripts\activate.bat`
5. Pasang dependensi:
   `python -m pip install -r requirements.txt`
6. (Opsional tapi disarankan untuk RAG Gemini) Salin `.env.example` menjadi `.env`, lalu masukkan API key Gemini di `GEMINI_API_KEY`.
7. Jalankan server:
   `uvicorn main:app --reload`
8. Buka `http://127.0.0.1:8000` di browser.

## Penting
- `wisata.csv` berisi DATA CONTOH untuk demonstrasi, bukan dataset penelitian yang telah diverifikasi.
- Verifikasi harga, aktivitas, alamat, dan sumber setiap destinasi dari sumber resmi sebelum digunakan dalam skripsi.
- Tanpa API key, aplikasi berjalan dalam mode demo dengan filter dan pencocokan kata dasar; ini bukan embedding RAG penuh.
- Dengan API key, aplikasi memakai Gemini Embeddings + ChromaDB untuk retrieval dan Gemini untuk menyusun jawaban berdasarkan konteks.
- Lindungi API key: jangan mengunggah file `.env` ke GitHub.
- Versi ini merupakan prototipe awal. Sebelum eksperimen skripsi, dokumentasikan sumber data, tanggal pengambilan, parameter model, dan metrik evaluasi retrieval.
