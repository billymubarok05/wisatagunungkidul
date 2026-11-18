const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatMessages = document.getElementById("chatMessages");
const budgetRange = document.getElementById("budgetRange");
const budgetLabel = document.getElementById("budgetLabel");
const jenisSelect = document.getElementById("jenisSelect");
const lokasiSelect = document.getElementById("lokasiSelect");
const clearBudget = document.getElementById("clearBudget");
const sendButton = chatForm.querySelector("button[type=submit]");

function formatRupiah(value) {
  return Number(value).toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
}
function updateBudgetLabel() {
  budgetLabel.firstChild.textContent = budgetRange.value >= 200000
    ? "Rp200.000+" : formatRupiah(budgetRange.value);
}
budgetRange.addEventListener("input", updateBudgetLabel);
clearBudget.addEventListener("click", () => {
  budgetRange.value = 200000;
  updateBudgetLabel();
});
updateBudgetLabel();

function addMessage(text, role = "bot", isError = false) {
  const wrapper = document.createElement("div");
  wrapper.className = `message ${role === "user" ? "user-message" : "bot-message"}`;
  if (role !== "user") {
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "✦";
    wrapper.appendChild(avatar);
  }
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  if (isError) bubble.classList.add("error");
  // Render teks sebagai teks biasa agar respons API tidak disisipkan sebagai HTML.
  bubble.textContent = text;
  wrapper.appendChild(bubble);
  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}

function addDestinationCards(destinations, parentBubble) {
  if (!destinations || !destinations.length) return;
  const cards = document.createElement("div");
  cards.className = "destinations";
  destinations.forEach(place => {
    const card = document.createElement("article");
    card.className = "destination-card";
    const title = document.createElement("h3");
    title.textContent = place.nama || "Destinasi";
    const details = document.createElement("p");
    details.textContent = `${place.lokasi || "Lokasi belum tersedia"} · ${place.jenis || "Jenis belum tersedia"}`;
    const price = document.createElement("p");
    price.textContent = `Harga pada dataset: ${formatRupiah(place.harga || 0)}`;
    const activity = document.createElement("p");
    activity.textContent = `Aktivitas: ${place.aktivitas || "Belum tersedia"}`;
    card.append(title, details, price, activity);
    if (place.sumber && !place.sumber.startsWith("Isi dengan")) {
      const source = document.createElement("p");
      source.className = "source-link";
      source.textContent = `Sumber: ${place.sumber}`;
      card.appendChild(source);
    }
    cards.appendChild(card);
  });
  parentBubble.appendChild(cards);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage(text) {
  const message = text.trim();
  if (!message) return;
  addMessage(message, "user");
  const loading = addMessage("Sedang mencari destinasi yang relevan…");
  loading.classList.add("loading");
  sendButton.disabled = true;

  try {
    const budgetValue = Number(budgetRange.value);
    const payload = {
      message,
      budget: budgetValue >= 200000 ? null : budgetValue,
      jenis: jenisSelect.value === "semua" ? null : jenisSelect.value,
      lokasi: lokasiSelect.value === "semua" ? null : lokasiSelect.value
    };
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    loading.remove();
    if (!response.ok) throw new Error(result.detail || "Permintaan gagal diproses.");
    const bubble = addMessage(result.answer || "Belum ada jawaban.");
    addDestinationCards(result.destinations, bubble);
    if (!result.rag_enabled) {
      const note = document.createElement("p");
      note.className = "loading";
      note.textContent = "Mode demo: retrieval dasar aktif. Isi GEMINI_API_KEY untuk mengaktifkan embedding dan generasi jawaban Gemini.";
      bubble.appendChild(note);
    }
  } catch (error) {
    loading.remove();
    addMessage(`Maaf, terjadi masalah: ${error.message}. Pastikan server Python berjalan.`, "bot", true);
  } finally {
    sendButton.disabled = false;
    messageInput.focus();
  }
}
chatForm.addEventListener("submit", event => {
  event.preventDefault();
  const value = messageInput.value;
  messageInput.value = "";
  sendMessage(value);
});
document.querySelectorAll(".suggestion").forEach(button => {
  button.addEventListener("click", () => sendMessage(button.dataset.prompt || ""));
});
messageInput.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});
