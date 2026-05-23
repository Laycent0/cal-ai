// ─── State ───────────────────────────────────────────────────────────────────
const state = {
  apiKey: localStorage.getItem('cal_ai_key') || '',
  imageFile: null,
  imageBase64: null,
};

// ─── DOM Refs ─────────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const els = {
  apiBanner: $('api-banner'),
  setupBtn: $('setup-btn'),
  dropZone: $('drop-zone'),
  fileInput: $('file-input'),
  cameraInput: $('camera-input'),
  uploadBtn: $('upload-btn'),
  cameraBtn: $('camera-btn'),
  uploadSection: $('upload-section'),
  previewSection: $('preview-section'),
  previewImg: $('preview-img'),
  changeBtn: $('change-btn'),
  analyzeBtn: $('analyze-btn'),
  analyzeBtnText: document.querySelector('.btn-analyze-text'),
  analyzeBtnLoader: document.querySelector('.btn-analyze-loader'),
  resultsSection: $('results-section'),
  dishName: $('dish-name'),
  confidenceBadge: $('confidence-badge'),
  hiddenNotes: $('hidden-notes'),
  totalCalories: $('total-calories'),
  macroProtein: $('macro-protein'),
  macroFats: $('macro-fats'),
  macroCarbs: $('macro-carbs'),
  segProtein: $('seg-protein'),
  segFats: $('seg-fats'),
  segCarbs: $('seg-carbs'),
  breakdownBody: $('breakdown-body'),
  newPhotoBtn: $('new-photo-btn'),
  errorToast: $('error-toast'),
  errorMessage: $('error-message'),
  modalOverlay: $('modal-overlay'),
  modalClose: $('modal-close'),
  modalCancel: $('modal-cancel'),
  modalSave: $('modal-save'),
  apiKeyInput: $('api-key-input'),
  toggleKey: $('toggle-key'),
  loadingOverlay: $('loading-overlay'),
  step1: $('step-1'),
  step2: $('step-2'),
  step3: $('step-3'),
};

// ─── Init ─────────────────────────────────────────────────────────────────────
function init() {
  updateApiBanner();
  bindEvents();
}

function updateApiBanner() {
  if (state.apiKey) {
    els.apiBanner.classList.add('configured');
    els.apiBanner.querySelector('.api-text strong').textContent = '✅ API ключ настроен';
    els.apiBanner.querySelector('.api-text span').textContent = 'Можешь анализировать блюда';
    els.setupBtn.textContent = 'Изменить';
  }
}

// ─── Events ───────────────────────────────────────────────────────────────────
function bindEvents() {
  els.setupBtn.addEventListener('click', openModal);
  els.modalClose.addEventListener('click', closeModal);
  els.modalCancel.addEventListener('click', closeModal);
  els.modalSave.addEventListener('click', saveApiKey);
  els.modalOverlay.addEventListener('click', (e) => { if (e.target === els.modalOverlay) closeModal(); });

  els.toggleKey.addEventListener('click', () => {
    const inp = els.apiKeyInput;
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });

  els.uploadBtn.addEventListener('click', () => els.fileInput.click());
  els.cameraBtn.addEventListener('click', () => els.cameraInput.click());
  els.dropZone.addEventListener('click', (e) => { if (!e.target.closest('button')) els.fileInput.click(); });

  els.fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
  els.cameraInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

  // Drag & Drop
  els.dropZone.addEventListener('dragover', (e) => { e.preventDefault(); els.dropZone.classList.add('drag-over'); });
  els.dropZone.addEventListener('dragleave', () => els.dropZone.classList.remove('drag-over'));
  els.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    els.dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  els.changeBtn.addEventListener('click', resetToUpload);
  els.newPhotoBtn.addEventListener('click', resetToUpload);
  els.analyzeBtn.addEventListener('click', analyzeImage);
}

// ─── File Handling ────────────────────────────────────────────────────────────
function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    showError('Пожалуйста, загрузи изображение (JPG, PNG, WEBP)');
    return;
  }
  state.imageFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    state.imageBase64 = e.target.result.split(',')[1];
    els.previewImg.src = e.target.result;
    showSection('preview');
  };
  reader.readAsDataURL(file);
}

// ─── Section Management ───────────────────────────────────────────────────────
function showSection(name) {
  els.uploadSection.classList.add('hidden');
  els.previewSection.classList.add('hidden');
  els.resultsSection.classList.add('hidden');
  if (name === 'upload') els.uploadSection.classList.remove('hidden');
  if (name === 'preview') els.previewSection.classList.remove('hidden');
  if (name === 'results') els.resultsSection.classList.remove('hidden');
}

function resetToUpload() {
  state.imageFile = null;
  state.imageBase64 = null;
  els.fileInput.value = '';
  els.cameraInput.value = '';
  showSection('upload');
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function openModal() {
  els.apiKeyInput.value = state.apiKey;
  els.modalOverlay.classList.remove('hidden');
  setTimeout(() => els.apiKeyInput.focus(), 100);
}

function closeModal() {
  els.modalOverlay.classList.add('hidden');
}

function saveApiKey() {
  const key = els.apiKeyInput.value.trim();
  if (!key) { showError('Введи API ключ'); return; }
  state.apiKey = key;
  localStorage.setItem('cal_ai_key', key);
  closeModal();
  updateApiBanner();
}

// ─── AI Analysis ──────────────────────────────────────────────────────────────
async function analyzeImage() {
  if (!state.apiKey) {
    openModal();
    showError('Сначала настрой API ключ');
    return;
  }
  if (!state.imageBase64) return;

  showLoading(true);
  animateLoadingSteps();

  try {
    const result = await callGeminiAPI(state.imageBase64, state.imageFile.type);
    showLoading(false);
    renderResults(result);
    showSection('results');
  } catch (err) {
    showLoading(false);
    showError(err.message || 'Ошибка анализа. Проверь API ключ.');
    console.error(err);
  }
}

async function callGeminiAPI(base64, mimeType) {
  const PROMPT = `You are an elite AI Nutritionist and Food Image Analyzer.

CORE RULES:
1. Deconstruct meals into individual ingredients.
2. Account for hidden calories: cooking oils, butter, sauces, dressings.
3. Estimate portion weights using visual references (plate size, cutlery).
4. Be realistic — for large restaurant portions, do NOT use standard USDA serving sizes.
5. If the image is not food or indeterminate, return 0 for all values.

Chain of thought (internal):
- Step 1: Identify all ingredients and cooking methods.
- Step 2: Estimate weight (grams) of each.
- Step 3: Calculate calories & macros per ingredient.
- Step 4: Sum totals.

Return ONLY a raw valid JSON object (no markdown, no extra text):
{
  "dishName": "Short dish name in Russian",
  "totalCalories": 0,
  "macros": { "protein": 0, "fats": 0, "carbs": 0 },
  "breakdown": [
    {
      "ingredient": "name in Russian",
      "estimatedWeightGrams": 0,
      "calories": 0,
      "protein": 0,
      "fats": 0,
      "carbs": 0
    }
  ],
  "hiddenCaloriesNotes": "Brief note in Russian about oils/sauces assumed",
  "confidence": "High | Medium | Low"
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${state.apiKey}`;

  const body = {
    contents: [{
      parts: [
        { text: PROMPT },
        { inline_data: { mime_type: mimeType, data: base64 } }
      ]
    }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    const msg = errData?.error?.message || `HTTP ${resp.status}`;
    if (resp.status === 400 && msg.includes('API_KEY')) throw new Error('Неверный API ключ');
    if (resp.status === 429) throw new Error('Превышен лимит запросов. Попробуй позже.');
    throw new Error(`Ошибка API: ${msg}`);
  }

  const data = await resp.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Пустой ответ от AI');

  // Clean possible markdown code fences
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    throw new Error('Не удалось распарсить ответ AI');
  }
}

// ─── Render Results ───────────────────────────────────────────────────────────
function renderResults(data) {
  els.dishName.textContent = data.dishName || 'Блюдо';

  // Confidence badge
  const conf = (data.confidence || 'Medium').toLowerCase();
  els.confidenceBadge.textContent = { high: 'Высокая', medium: 'Средняя', low: 'Низкая' }[conf] || data.confidence;
  els.confidenceBadge.className = `confidence-badge ${conf}`;

  els.hiddenNotes.textContent = data.hiddenCaloriesNotes || '';

  // Animate calories counter
  animateNumber(els.totalCalories, 0, Math.round(data.totalCalories || 0), 800);

  const m = data.macros || {};
  els.macroProtein.textContent = `${Math.round(m.protein || 0)}г`;
  els.macroFats.textContent = `${Math.round(m.fats || 0)}г`;
  els.macroCarbs.textContent = `${Math.round(m.carbs || 0)}г`;

  // Macro bar
  const total = (m.protein || 0) * 4 + (m.fats || 0) * 9 + (m.carbs || 0) * 4;
  if (total > 0) {
    els.segProtein.style.width = `${((m.protein || 0) * 4 / total) * 100}%`;
    els.segFats.style.width = `${((m.fats || 0) * 9 / total) * 100}%`;
    els.segCarbs.style.width = `${((m.carbs || 0) * 4 / total) * 100}%`;
  }

  // Breakdown table
  els.breakdownBody.innerHTML = '';
  (data.breakdown || []).forEach((item, i) => {
    const tr = document.createElement('tr');
    tr.style.animationDelay = `${i * 0.06}s`;
    tr.innerHTML = `
      <td><span class="ingredient-name">${escHtml(item.ingredient)}</span></td>
      <td class="td-weight">${Math.round(item.estimatedWeightGrams || 0)}г</td>
      <td class="td-cal">${Math.round(item.calories || 0)}</td>
      <td class="td-protein">${Math.round(item.protein || 0)}г</td>
      <td class="td-fat">${Math.round(item.fats || 0)}г</td>
      <td class="td-carb">${Math.round(item.carbs || 0)}г</td>
    `;
    els.breakdownBody.appendChild(tr);
  });
}

// ─── Loading ──────────────────────────────────────────────────────────────────
let loadingTimer = null;

function showLoading(show) {
  if (show) {
    els.loadingOverlay.classList.remove('hidden');
    els.analyzeBtn.disabled = true;
  } else {
    els.loadingOverlay.classList.add('hidden');
    els.analyzeBtn.disabled = false;
    clearTimeout(loadingTimer);
    [els.step1, els.step2, els.step3].forEach(s => s.classList.remove('active'));
    els.step1.classList.add('active');
  }
}

function animateLoadingSteps() {
  const steps = [els.step1, els.step2, els.step3];
  steps.forEach(s => s.classList.remove('active'));
  steps[0].classList.add('active');
  loadingTimer = setTimeout(() => {
    steps[0].classList.remove('active');
    steps[1].classList.add('active');
  }, 2000);
  loadingTimer = setTimeout(() => {
    steps[1].classList.remove('active');
    steps[2].classList.add('active');
  }, 4500);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function animateNumber(el, from, to, duration) {
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (to - from) * ease);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

let errorTimeout;
function showError(msg) {
  els.errorMessage.textContent = msg;
  els.errorToast.classList.remove('hidden');
  clearTimeout(errorTimeout);
  errorTimeout = setTimeout(() => els.errorToast.classList.add('hidden'), 4000);
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── Start ────────────────────────────────────────────────────────────────────
init();
