// ─── Onboarding steps definition ─────────────────────────────────────────
const STEPS = [
  { id:'welcome' },
  { id:'goal', q:'🎯 Какая твоя главная цель?', choices:[
    { val:'lose',     icon:'🔥', label:'Похудеть',            desc:'Дефицит калорий, жиросжигание' },
    { val:'muscle',   icon:'💪', label:'Набрать мышечную массу', desc:'Профицит + высокий белок' },
    { val:'gain',     icon:'⚡', label:'Набрать вес',          desc:'Профицит калорий' },
    { val:'maintain', icon:'⚖️', label:'Поддерживать форму',  desc:'Баланс КБЖУ' },
  ]},
  { id:'gender', q:'👤 Твой пол?', choices:[
    { val:'male',   icon:'👨', label:'Мужской' },
    { val:'female', icon:'👩', label:'Женский'  },
  ]},
  { id:'age',    q:'🎂 Сколько тебе лет?',    type:'num', key:'age',    unit:'лет',  min:10, max:100, def:25 },
  { id:'height', q:'📏 Твой рост?',            type:'num', key:'height', unit:'см',   min:100,max:250, def:170 },
  { id:'weight', q:'⚖️ Текущий вес?',          type:'num', key:'weight', unit:'кг',  min:30, max:300, def:70  },
  { id:'lose_speed', q:'🔥 Скорость похудения?', showIf:p=>p.goal==='lose', choices:[
    { val:'slow',     icon:'🐢', label:'−0.5 кг/нед',  desc:'Комфортно, меньше стресса' },
    { val:'moderate', icon:'🏃', label:'−1 кг/нед',    desc:'Оптимальный вариант' },
    { val:'fast',     icon:'🚀', label:'−1.5 кг/нед',  desc:'Жёсткий дефицит' },
  ]},
  { id:'experience', q:'💪 Опыт тренировок?', showIf:p=>p.goal==='muscle', choices:[
    { val:'beginner',     icon:'🌱', label:'Новичок',      desc:'Менее 1 года' },
    { val:'intermediate', icon:'🏋️', label:'Средний',      desc:'1–3 года' },
    { val:'advanced',     icon:'⚡', label:'Продвинутый',  desc:'3+ лет' },
  ]},
  { id:'gain_speed', q:'⚡ Скорость набора?', showIf:p=>p.goal==='gain', choices:[
    { val:'slow',     icon:'🐢', label:'+0.25 кг/нед', desc:'Минимум жира' },
    { val:'moderate', icon:'🏃', label:'+0.5 кг/нед',  desc:'Классический булк' },
    { val:'fast',     icon:'🚀', label:'+1 кг/нед',    desc:'Агрессивный набор' },
  ]},
  { id:'activity', q:'🏃 Уровень активности?', choices:[
    { val:'sedentary', icon:'🛋', label:'Сидячий',     desc:'Офис, почти без спорта' },
    { val:'light',     icon:'🚶', label:'Лёгкая',      desc:'1–2 тренировки в неделю' },
    { val:'moderate',  icon:'🏃', label:'Умеренная',   desc:'3–4 тренировки' },
    { val:'high',      icon:'💪', label:'Высокая',     desc:'5–6 тренировок' },
    { val:'extreme',   icon:'🏋️', label:'Экстремальная', desc:'Каждый день + физ. работа' },
  ]},
  { id:'meals', q:'🍽 Сколько приёмов пищи в день?', choices:[
    { val:3, icon:'3️⃣', label:'3 приёма' },
    { val:4, icon:'4️⃣', label:'4 приёма' },
    { val:5, icon:'5️⃣', label:'5 приёмов' },
    { val:6, icon:'6️⃣', label:'6 приёмов' },
  ]},
  { id:'restrictions', q:'🥦 Пищевые ограничения?', type:'text',
    hint:'Например: вегетарианство, без глютена, аллергия... (необязательно)' },
  { id:'result' },
];

let obStep=0; let obProfile={};

function visibleSteps() {
  return STEPS.filter(s => !s.showIf || s.showIf(obProfile));
}

function showOb() {
  document.getElementById('screen-ob').classList.remove('hidden');
  document.getElementById('screen-app').classList.add('hidden');
  renderObStep();
}

function renderObStep() {
  const vis = visibleSteps();
  const s   = vis[obStep];
  const pct = Math.round((obStep / (vis.length-1)) * 100);
  document.getElementById('ob-prog').style.width = pct+'%';
  document.getElementById('ob-back').classList.toggle('hidden', obStep===0);

  const body = document.getElementById('ob-body');
  const next = document.getElementById('ob-next');

  if (s.id === 'welcome') {
    body.innerHTML = `<div class="ob-welcome">
      <div class="ob-logo">🔥</div>
      <div class="ob-welcome-title">Cal AI</div>
      <div class="ob-welcome-sub">Твой персональный нутрициолог.\nНастроим КБЖУ под твои цели и будем анализировать каждый приём пищи.</div>
    </div>`;
    next.textContent='Начать →'; next.disabled=false; return;
  }

  if (s.id === 'result') {
    const kbju = calcKBJU(obProfile);
    S.profile=obProfile; S.kbju=kbju; saveState();
    const gl={lose:'🔥 Похудение',muscle:'💪 Набор мышц',gain:'⚡ Набор веса',maintain:'⚖️ Поддержание'};
    body.innerHTML=`
      <h2 class="ob-title">✅ Твой план готов!</h2>
      <p class="ob-sub">${gl[obProfile.goal]||''} · ${obProfile.weight}кг · ${obProfile.height}см</p>
      <div class="ob-result-card">
        <div class="ob-cal-num">${kbju.calories}</div>
        <div class="ob-cal-label">калорий в день</div>
        <div class="ob-macros-row">
          <div class="ob-macro p"><span class="ob-macro-val">${kbju.protein}г</span><span class="ob-macro-key">Белки</span></div>
          <div class="ob-macro f"><span class="ob-macro-val">${kbju.fats}г</span><span class="ob-macro-key">Жиры</span></div>
          <div class="ob-macro c"><span class="ob-macro-val">${kbju.carbs}г</span><span class="ob-macro-key">Углеводы</span></div>
        </div>
      </div>`;
    next.textContent='Открыть дневник 🎉'; next.disabled=false; return;
  }

  if (s.choices) {
    const sel = obProfile[s.key||s.id];
    body.innerHTML=`<h2 class="ob-title">${s.q}</h2>
      <div class="ob-choices">${s.choices.map(c=>`
        <div class="ob-choice${sel===c.val?' selected':''}" data-val='${JSON.stringify(c.val)}'>
          <span class="ob-choice-icon">${c.icon}</span>
          <div class="ob-choice-label">
            <div>${c.label}</div>
            ${c.desc?`<div class="ob-choice-desc">${c.desc}</div>`:''}
          </div>
        </div>`).join('')}
      </div>`;
    next.textContent='Далее →';
    next.disabled = sel===undefined;
    body.querySelectorAll('.ob-choice').forEach(el=>{
      el.addEventListener('click',()=>{
        haptic();
        const key = s.key||s.id;
        const raw = JSON.parse(el.dataset.val);
        obProfile[key]=raw;
        body.querySelectorAll('.ob-choice').forEach(e=>e.classList.remove('selected'));
        el.classList.add('selected');
        next.disabled=false;
      });
    });
    return;
  }

  if (s.type==='num') {
    const cur = obProfile[s.key]??s.def;
    body.innerHTML=`<h2 class="ob-title">${s.q}</h2>
      <div class="ob-num-wrap">
        <button class="ob-num-btn" id="ob-minus">−</button>
        <input class="ob-num-val" id="ob-num-inp" type="number" value="${cur}" min="${s.min}" max="${s.max}"/>
        <span class="ob-num-unit">${s.unit}</span>
        <button class="ob-num-btn" id="ob-plus">+</button>
      </div>`;
    next.textContent='Далее →'; next.disabled=false;
    const inp=body.querySelector('#ob-num-inp');
    inp.addEventListener('input',()=>{ obProfile[s.key]=+inp.value; });
    body.querySelector('#ob-minus').addEventListener('click',()=>{ inp.value=Math.max(s.min,+inp.value-1); obProfile[s.key]=+inp.value; haptic(); });
    body.querySelector('#ob-plus').addEventListener('click',()=> { inp.value=Math.min(s.max,+inp.value+1); obProfile[s.key]=+inp.value; haptic(); });
    obProfile[s.key]=cur;
    return;
  }

  if (s.type==='text') {
    body.innerHTML=`<h2 class="ob-title">${s.q}</h2>
      <p class="ob-sub">${s.hint||''}</p>
      <textarea class="ob-textarea" id="ob-txt" placeholder="Введи или оставь пустым..."></textarea>`;
    next.textContent='Далее →'; next.disabled=false;
    const ta=body.querySelector('#ob-txt');
    if(obProfile.restrictions) ta.value=obProfile.restrictions;
    ta.addEventListener('input',()=>{ obProfile.restrictions=ta.value; });
  }
}

document.getElementById('ob-next').addEventListener('click',()=>{
  haptic();
  const vis=visibleSteps();
  if(obStep<vis.length-1){ obStep++; renderObStep(); }
  else { showApp(); }
});
document.getElementById('ob-back').addEventListener('click',()=>{
  haptic();
  if(obStep>0){ obStep--; renderObStep(); }
});
