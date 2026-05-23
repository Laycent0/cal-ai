// ─── Storage ──────────────────────────────────────────────────────────────
const SK = 'calai_v1';
function loadState() {
  try { return JSON.parse(localStorage.getItem(SK)) || {}; } catch { return {}; }
}
function saveState() { localStorage.setItem(SK, JSON.stringify(S)); }

const S = loadState();

// ─── Utils ────────────────────────────────────────────────────────────────
function today() { return new Date().toISOString().slice(0,10); }
function getDiary() { return (S.diary||{})[today()]||[]; }
function addMeal(meal) {
  if (!S.diary) S.diary={};
  if (!S.diary[today()]) S.diary[today()]=[];
  S.diary[today()].push(meal); saveState();
}
function getWater() { return (S.water||{})[today()]||0; }
function addWater(ml) {
  if (!S.water) S.water={};
  S.water[today()] = (S.water[today()]||0)+ml; saveState();
}
function toast(msg) {
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.remove('hidden');
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.add('hidden'),2500);
}

// ─── TMA ─────────────────────────────────────────────────────────────────
const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }
function haptic(type='light') { tg?.HapticFeedback?.impactOccurred(type); }

// ─── Calculator (Mifflin-St Jeor) ────────────────────────────────────────
const ACT_F = { sedentary:1.2, light:1.375, moderate:1.55, high:1.725, extreme:1.9 };
function calcKBJU(p) {
  const base = 10*p.weight + 6.25*p.height - 5*p.age;
  const bmr  = p.gender==='male' ? base+5 : base-161;
  const tdee = bmr * (ACT_F[p.activity]||1.55);
  const adj  = { lose:{slow:-0.1,moderate:-0.2,fast:-0.25},
                  muscle:{beginner:0.12,intermediate:0.08,advanced:0.05},
                  gain:{slow:0.1,moderate:0.15,fast:0.2},
                  maintain:{_:0} }[p.goal];
  const key  = p.lose_speed||p.experience||p.gain_speed||'_';
  const cal  = Math.round(tdee*(1+(adj?.[key]??0)));
  const pg   = {lose:2.0,muscle:2.2,gain:1.8,maintain:1.6}[p.goal]||1.8;
  const prot = Math.round(p.weight*pg);
  const fats = Math.round(cal*0.25/9);
  const carbs= Math.max(50, Math.round((cal-prot*4-fats*9)/4));
  return { calories:prot*4+fats*9+carbs*4, protein:prot, fats, carbs,
           bmr:Math.round(bmr), tdee:Math.round(tdee) };
}
