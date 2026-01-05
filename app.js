/**
 * Paws & Preferences
 * Robust swipe/drag implementation:
 * - Drag works even if the user drags on the image
 * - Uses Pointer Events when available
 * - Touch + mouse fallback included
 *
 * Images: https://cataas.com/
 */

//  Config 
const TOTAL_CATS = 12;
const SWIPE_THRESHOLD = 120;
const ROTATE_MAX = 14;
const ANIM_MS = 220;

function catUrl(seed) {
  return `https://cataas.com/cat?width=800&height=1000&v=${seed}`;
}

// DOM 
const deckEl = document.getElementById("deck");
const statusEl = document.getElementById("status");

const summaryEl = document.getElementById("summary");
const summaryTextEl = document.getElementById("summaryText");
const likedGridEl = document.getElementById("likedGrid");

const btnLike = document.getElementById("btnLike");
const btnDislike = document.getElementById("btnDislike");
const btnRestart = document.getElementById("btnRestart");

// State 
let cats = [];
let currentIndex = 0;
let liked = [];

// Drag session
const drag = {
  active: false,
  startX: 0,
  startY: 0,
  dx: 0,
  dy: 0,
  pointerId: null,
  card: null,
};

init();

function init() {
  resetApp();
  bindButtons();
  bindDeckDrag();
  updateStatus();
}

// Setup 
function resetApp() {
  const baseSeed = Date.now();

  cats = Array.from({ length: TOTAL_CATS }, (_, i) => ({
    id: i + 1,
    url: catUrl(baseSeed + i),
  }));

  currentIndex = 0;
  liked = [];

  deckEl.innerHTML = "";
  summaryEl.classList.add("hidden");
  likedGridEl.innerHTML = "";

  btnLike.disabled = false;
  btnDislike.disabled = false;

  renderDeck();
  updateStatus();
}

function renderDeck() {
  for (let i = cats.length - 1; i >= 0; i--) {
    deckEl.appendChild(makeCard(cats[i], i));
  }
}

// Card creation 
function makeCard(cat, index) {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.index = String(index);

  // stacked look
  const depth = cats.length - 1 - index;
  const offsetY = Math.min(10, depth * 3);
  const scale = 1 - Math.min(0.06, depth * 0.01);
  card.style.transform = `translateY(${offsetY}px) scale(${scale})`;

  const likeStamp = document.createElement("div");
  likeStamp.className = "stamp like";
  likeStamp.textContent = "LIKE";

  const nopeStamp = document.createElement("div");
  nopeStamp.className = "stamp nope";
  nopeStamp.textContent = "NOPE";

  const img = document.createElement("img");
  img.src = cat.url;
  img.alt = `Cat ${cat.id}`;
  img.loading = "lazy";

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.innerHTML = `<span class="badge">#${cat.id}</span><span>Swipe → like | ← dislike</span>`;

  card.appendChild(likeStamp);
  card.appendChild(nopeStamp);
  card.appendChild(img);
  card.appendChild(meta);

  return card;
}

function topCardEl() {
  return deckEl.querySelector(`.card[data-index="${currentIndex}"]`);
}

// Drag binding (Deck-level: works even if image is touched)
function bindDeckDrag() {
  if (window.PointerEvent) {
    deckEl.addEventListener("pointerdown", onPointerDown, { passive: false });
    deckEl.addEventListener("pointermove", onPointerMove, { passive: false });
    deckEl.addEventListener("pointerup", onPointerUp, { passive: false });
    deckEl.addEventListener("pointercancel", onPointerUp, { passive: false });
    return;
  }

  deckEl.addEventListener("touchstart", onTouchStart, { passive: false });
  deckEl.addEventListener("touchmove", onTouchMove, { passive: false });
  deckEl.addEventListener("touchend", onTouchEnd, { passive: true });

  deckEl.addEventListener("mousedown", onMouseDown);
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}

// Pointer Events 
function onPointerDown(e) {
  const card = topCardEl();
  if (!card) return;

  // Only start if user pressed on the top card area
  const hit = e.target.closest(".card");
  if (!hit || hit !== card) return;

  // Only left click for mouse
  if (e.pointerType === "mouse" && e.button !== 0) return;

  e.preventDefault();
  startDrag(e.clientX, e.clientY, card, e.pointerId);

  // Capture pointer so drag stays stable
  card.setPointerCapture(e.pointerId);
}

function onPointerMove(e) {
  if (!drag.active) return;
  if (drag.pointerId !== null && e.pointerId !== drag.pointerId) return;

  if (e.cancelable) e.preventDefault();
  updateDrag(e.clientX, e.clientY);
}

function onPointerUp(e) {
  if (!drag.active) return;
  if (drag.pointerId !== null && e.pointerId !== drag.pointerId) return;

  finishDrag();
}

// Touch fallback 
function onTouchStart(e) {
  const card = topCardEl();
  if (!card) return;

  const hit = e.target.closest(".card");
  if (!hit || hit !== card) return;

  e.preventDefault();
  const t = e.touches[0];
  startDrag(t.clientX, t.clientY, card, null);
}

function onTouchMove(e) {
  if (!drag.active) return;
  e.preventDefault();

  const t = e.touches[0];
  updateDrag(t.clientX, t.clientY);
}

function onTouchEnd() {
  if (!drag.active) return;
  finishDrag();
}

// Mouse fallback 
let mouseDown = false;

function onMouseDown(e) {
  const card = topCardEl();
  if (!card) return;

  const hit = e.target.closest(".card");
  if (!hit || hit !== card) return;

  if (e.button !== 0) return;

  mouseDown = true;
  startDrag(e.clientX, e.clientY, card, null);
}

function onMouseMove(e) {
  if (!mouseDown || !drag.active) return;
  updateDrag(e.clientX, e.clientY);
}

function onMouseUp() {
  if (!mouseDown) return;
  mouseDown = false;
  if (!drag.active) return;
  finishDrag();
}

// Drag core 
function startDrag(x, y, card, pointerId) {
  drag.active = true;
  drag.startX = x;
  drag.startY = y;
  drag.dx = 0;
  drag.dy = 0;
  drag.pointerId = pointerId;
  drag.card = card;

  card.style.transition = "none";
}

function updateDrag(x, y) {
  const card = drag.card;
  if (!card) return;

  drag.dx = x - drag.startX;
  drag.dy = y - drag.startY;

  const rot = clamp((drag.dx / 300) * ROTATE_MAX, -ROTATE_MAX, ROTATE_MAX);
  card.style.transform = `translate(${drag.dx}px, ${drag.dy}px) rotate(${rot}deg)`;

  const likeStamp = card.querySelector(".stamp.like");
  const nopeStamp = card.querySelector(".stamp.nope");
  const fade = clamp(Math.abs(drag.dx) / SWIPE_THRESHOLD, 0, 1);

  if (drag.dx > 0) {
    likeStamp.style.opacity = String(fade);
    nopeStamp.style.opacity = "0";
  } else {
    nopeStamp.style.opacity = String(fade);
    likeStamp.style.opacity = "0";
  }
}

function finishDrag() {
  const card = drag.card;
  if (!card) {
    clearDrag();
    return;
  }

  const dx = drag.dx;

  clearDrag();

  if (dx > SWIPE_THRESHOLD) {
    swipe("like");
  } else if (dx < -SWIPE_THRESHOLD) {
    swipe("dislike");
  } else {
    snapBack(card);
  }
}

function clearDrag() {
  drag.active = false;
  drag.pointerId = null;
  drag.card = null;
  drag.dx = 0;
  drag.dy = 0;
}

// Swipe actions 
function swipe(action) {
  const card = topCardEl();
  if (!card) return;

  const cat = cats[currentIndex];
  if (action === "like") liked.push(cat.url);

  const outX = action === "like" ? window.innerWidth * 1.2 : -window.innerWidth * 1.2;
  const outY = 0;
  const outRot = action === "like" ? 18 : -18;

  card.style.transition = `transform ${ANIM_MS}ms ease`;
  card.style.transform = `translate(${outX}px, ${outY}px) rotate(${outRot}deg)`;

  setTimeout(() => {
    card.remove();
    currentIndex++;
    updateStatus();

    if (currentIndex >= cats.length) {
      showSummary();
    }
  }, ANIM_MS + 10);
}

function snapBack(card) {
  const index = Number(card.dataset.index);
  const depth = cats.length - 1 - index;
  const offsetY = Math.min(10, depth * 3);
  const scale = 1 - Math.min(0.06, depth * 0.01);

  card.style.transition = "transform 180ms ease";
  card.style.transform = `translateY(${offsetY}px) scale(${scale})`;

  const likeStamp = card.querySelector(".stamp.like");
  const nopeStamp = card.querySelector(".stamp.nope");
  if (likeStamp) likeStamp.style.opacity = "0";
  if (nopeStamp) nopeStamp.style.opacity = "0";
}

// Summary 
function showSummary() {
  btnLike.disabled = true;
  btnDislike.disabled = true;

  summaryEl.classList.remove("hidden");
  summaryTextEl.textContent = `You liked ${liked.length} out of ${cats.length} cats.`;

  likedGridEl.innerHTML = "";

  if (liked.length === 0) {
    likedGridEl.innerHTML = `<p style="color: rgba(255,255,255,.7); margin:0;">No liked cats this time 😿</p>`;
    return;
  }

  liked.forEach((url, i) => {
    const img = document.createElement("img");
    img.src = url;
    img.alt = `Liked cat ${i + 1}`;
    likedGridEl.appendChild(img);
  });
}

// Buttons 
function bindButtons() {
  btnLike.addEventListener("click", () => swipe("like"));
  btnDislike.addEventListener("click", () => swipe("dislike"));
  btnRestart.addEventListener("click", resetApp);
}

// UI 
function updateStatus() {
  const remaining = cats.length - currentIndex;
  statusEl.textContent = remaining > 0
    ? `Remaining: ${remaining} | Liked: ${liked.length}`
    : "";
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
