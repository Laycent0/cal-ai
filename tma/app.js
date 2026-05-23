// ─── Navigation ───────────────────────────────────────────
let curTab = 'home';
function showApp() {
  document.getElementById('screen-ob').classList.add('hidden');
  document.getElementById('screen-app').classList.remove('hidden');
  switchTab('home');
}
function switchTab(name) {
  curTab = name;
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('panel-'+name).classList.add('active');
  document.querySelector(`.nav-btn[data-tab="${name}"]`).classList.add('active');
  if(name==='home') renderHome();
  if(name==='analyze') renderAnalyze();
  if(name==='profile') renderProfile();
}
document.querySelectorAll('.nav-btn').forEach(b=>{
  b.addEventListener('click',()=>{ haptic(); switchTab(b.dataset.tab); });
});

// ─── HOME (Дневник + План + Вода) ─────────────────────────
function renderHome() {
  const kbju  = S.kbju||{calories:2000,protein:150,fats:60,carbs:220};
  const diary = getDiary();
  const eaten = diary.reduce((a,e)=>({cal:a.cal+e.cal,p:a.p+(e.p||0),f:a.f+(e.f||0),c:a.c+(e.c||0)}),{cal:0,p:0,f:0,c:0});
  const left  = Math.max(0, kbju.calories - eaten.cal);
  const pct   = Math.min(100, kbju.calories ? Math.round(eaten.cal/kbju.calories*100) : 0);
  const R=52, circ=2*Math.PI*R, dash=circ-(pct/100)*circ;

  const days=['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
  const months=['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
  const now=new Date();

  const MEALS=[
    {key:'breakfast',icon:'☕',name:'Завтрак'},
    {key:'lunch',icon:'🍱',name:'Обед'},
    {key:'dinner',icon:'🍽',name:'Ужин'},
    {key:'snack',icon:'🍎',name:'Перекус'},
  ];
  const mealCal=Math.round(kbju.calories/4);

  const mealCards=MEALS.map(m=>{
    const entries=diary.filter(e=>e.meal===m.key);
    const total=entries.reduce((a,e)=>a+e.cal,0);
    const rows=entries.map((e,i)=>`
      <div class="meal-entry">
        <span class="meal-entry-name">${e.name}</span>
        <span class="meal-entry-cal">${e.cal} ккал</span>
        <button class="meal-entry-del" data-meal="${m.key}" data-idx="${diary.indexOf(e)}">✕</button>
      </div>`).join('');
    return `<div class="meal-card">
      <div class="meal-header">
        <div class="meal-icon">${m.icon}</div>
        <div class="meal-info">
          <div class="meal-name">${m.name}</div>
          <div class="meal-cal">${total} / ${mealCal} ккал</div>
        </div>
        <button class="meal-add" data-meal="${m.key}">+</button>
      </div>
      ${rows?`<div class="meal-entries">${rows}</div>`:''}
    </div>`;
  }).join('');

  // Вода
  const ml=getWater(), wPct=Math.min(100,Math.round(ml/2000*100));

  // План (макросы)
  const p=S.profile||{};
  const gls={lose:'🔥 Похудение',muscle:'💪 Набор мышц',gain:'⚡ Набор веса',maintain:'⚖️ Поддержание'};
  const planHtml=S.kbju?`
    <div class="plan-mini-card">
      <div class="plan-mini-title">📊 Мой план</div>
      <div class="plan-macro-list">
        ${miniMacro('🥩 Белки',eaten.p,kbju.protein,'#3b82f6')}
        ${miniMacro('🥑 Жиры',eaten.f,kbju.fats,'#f97316')}
        ${miniMacro('🍞 Углеводы',eaten.c,kbju.carbs,'#a855f7')}
      </div>
      <div style="margin-top:14px">
        ${planRow2('Цель',gls[p.goal]||'—')}
        ${planRow2('Норма',kbju.calories+' ккал/день')}
        ${planRow2('BMR',kbju.bmr+' ккал')}
        ${planRow2('TDEE',kbju.tdee+' ккал')}
      </div>
    </div>`:
    `<div class="plan-mini-card"><p style="color:var(--muted);font-size:.9rem">Заполни профиль для расчёта плана</p></div>`;

  document.getElementById('panel-home').innerHTML=`
    <div class="home-date">${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}</div>
    <div class="home-title">Сегодня</div>

    <!-- Кольцо калорий -->
    <div class="cal-card">
      <div class="cal-ring-wrap">
        <svg class="cal-ring-svg" width="120" height="120" viewBox="0 0 120 120">
          <circle class="cal-ring-bg" cx="60" cy="60" r="${R}"/>
          <circle class="cal-ring-fill" cx="60" cy="60" r="${R}"
            stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="${dash.toFixed(2)}"
            stroke="#22c55e" style="filter:drop-shadow(0 0 6px rgba(34,197,94,.7))"/>
        </svg>
        <div class="cal-info">
          <div class="cal-eaten-label">Съедено</div>
          <div class="cal-eaten-num">${eaten.cal}</div>
          <div class="cal-eaten-unit">ккал</div>
          <div class="cal-left-label">Осталось</div>
          <div class="cal-left-num">${left} ккал</div>
        </div>
      </div>
      <div class="macros-grid">
        ${macroCard('Белки',eaten.p,kbju.protein,'p')}
        ${macroCard('Жиры',eaten.f,kbju.fats,'f')}
        ${macroCard('Углеводы',eaten.c,kbju.carbs,'c')}
      </div>
    </div>

    <!-- Питание -->
    <div class="section-title">Питание</div>
    ${mealCards}

    <!-- Вода -->
    <div class="section-title">Вода</div>
    <div class="water-mini-card">
      <div class="water-mini-header">
        <div class="water-mini-title">💧 Вода</div>
        <div class="water-mini-num">${(ml/1000).toFixed(2)} / 2.0 л</div>
      </div>
      <div class="water-bar-bg"><div class="water-bar-fill" style="width:${wPct}%"></div></div>
      <div class="water-btns-mini">
        <button class="water-btn-mini" data-ml="150">+150 мл</button>
        <button class="water-btn-mini" data-ml="250">+250 мл</button>
        <button class="water-btn-mini" data-ml="350">+350 мл</button>
        <button class="water-btn-mini" data-ml="500">+500 мл</button>
      </div>
    </div>

    <!-- План -->
    <div class="section-title">План</div>
    ${planHtml}
  `;

  // Обработчики
  document.querySelectorAll('.meal-add').forEach(btn=>{
    btn.addEventListener('click',()=>{ haptic(); openAddModal(btn.dataset.meal); });
  });
  document.querySelectorAll('.meal-entry-del').forEach(btn=>{
    btn.addEventListener('click',()=>{ haptic(); deleteMealEntry(+btn.dataset.idx); });
  });
  document.querySelectorAll('.water-btn-mini').forEach(b=>{
    b.addEventListener('click',()=>{ haptic(); addWater(+b.dataset.ml); toast(`+${b.dataset.ml} мл 💧`); renderHome(); });
  });
}

function macroCard(name,eaten,goal,cls){
  const pct=Math.min(100,goal?Math.round(eaten/goal*100):0);
  return `<div class="macro-card">
    <div class="macro-name">${name}</div>
    <div class="macro-nums">${eaten}г <span>/ ${goal}г</span></div>
    <div class="macro-bar-bg"><div class="macro-bar-fill ${cls}" style="width:${pct}%"></div></div>
  </div>`;
}
function miniMacro(name,eaten,goal,color){
  const pct=Math.min(100,goal?Math.round(eaten/goal*100):0);
  return `<div class="plan-macro-row">
    <span class="plan-macro-name">${name}</span>
    <div class="plan-macro-bar"><div class="plan-macro-bar-fill" style="width:${pct}%;background:${color}"></div></div>
    <span class="plan-macro-num" style="color:${color}">${eaten}/${goal}г</span>
  </div>`;
}
function planRow2(l,v){return `<div class="plan-summary-row"><span class="plan-summary-label">${l}</span><span class="plan-summary-val">${v}</span></div>`;}

// ─── MANUAL ADD MODAL ──────────────────────────────────────
let _addMeal='snack';
function openAddModal(meal='snack') {
  _addMeal=meal;
  const modal=document.getElementById('modal-add');
  modal.classList.remove('hidden');
  // highlight meal button
  modal.querySelectorAll('.meal-sel-btn').forEach(b=>{
    b.classList.toggle('selected', b.dataset.meal===meal);
  });
  document.getElementById('m-name').value='';
  document.getElementById('m-cal').value='';
  document.getElementById('m-p').value='';
  document.getElementById('m-f').value='';
  document.getElementById('m-c').value='';
  setTimeout(()=>document.getElementById('m-name').focus(),300);
}
function closeModal() { document.getElementById('modal-add').classList.add('hidden'); }

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay') && document.getElementById('modal-overlay').addEventListener('click', closeModal);

document.querySelectorAll('.meal-sel-btn').forEach(b=>{
  b.addEventListener('click',()=>{
    _addMeal=b.dataset.meal;
    document.querySelectorAll('.meal-sel-btn').forEach(x=>x.classList.remove('selected'));
    b.classList.add('selected');
  });
});

document.getElementById('modal-save').addEventListener('click',()=>{
  const name=document.getElementById('m-name').value.trim();
  const cal=+document.getElementById('m-cal').value||0;
  if(!name){ toast('Введи название блюда'); return; }
  if(!cal){ toast('Введи калории'); return; }
  addMeal({
    meal:_addMeal, name,
    cal, p:+(document.getElementById('m-p').value)||0,
    f:+(document.getElementById('m-f').value)||0,
    c:+(document.getElementById('m-c').value)||0
  });
  haptic('success'); toast('✅ Добавлено!'); closeModal();
  if(curTab==='home') renderHome();
});

function deleteMealEntry(idx) {
  const d=today();
  if(!S.diary||!S.diary[d]) return;
  S.diary[d].splice(idx,1); saveState();
  renderHome();
}

// ─── ANALYZE TAB ──────────────────────────────────────────
let _analyzeMeal='snack';
function renderAnalyze() {
  document.getElementById('panel-analyze').innerHTML=`
    <div class="analyze-title">📸 Анализ еды</div>
    <div class="analyze-sub">Сфотографируй блюдо — AI посчитает КБЖУ</div>
    <div class="meal-pick-row" id="meal-pick">
      <button class="meal-pick-btn active" data-meal="breakfast">☕ Завтрак</button>
      <button class="meal-pick-btn" data-meal="lunch">🍱 Обед</button>
      <button class="meal-pick-btn" data-meal="dinner">🍽 Ужин</button>
      <button class="meal-pick-btn" data-meal="snack">🍎 Перекус</button>
    </div>
    <img class="preview-img" id="prev-img"/>
    <div class="upload-zone" id="upload-zone">
      <div class="upload-zone-icon">🍽</div>
      <div class="upload-zone-text">Нажми для выбора фото</div>
      <div class="upload-zone-hint">или сделай снимок камерой</div>
    </div>
    <button class="btn-sec" id="btn-cam">📷 Открыть камеру</button>
    <button class="btn-main hidden" id="btn-analyze" style="margin-top:12px">Анализировать блюдо</button>
    <div class="analyze-result" id="analyze-result"></div>
    <button class="btn-main hidden" id="btn-add-diary" style="margin-top:12px">+ Добавить в дневник</button>`;

  const zone=document.getElementById('upload-zone');
  const fi=document.getElementById('file-input');
  const ci=document.getElementById('cam-input');
  const prev=document.getElementById('prev-img');
  const btnA=document.getElementById('btn-analyze');
  let lastResult=null;

  // meal pick
  document.querySelectorAll('.meal-pick-btn').forEach(b=>{
    b.addEventListener('click',()=>{
      _analyzeMeal=b.dataset.meal;
      document.querySelectorAll('.meal-pick-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
    });
  });

  zone.addEventListener('click',()=>fi.click());
  document.getElementById('btn-cam').addEventListener('click',()=>ci.click());

  function onFile(file){
    if(!file||!file.type.startsWith('image/')) return;
    const reader=new FileReader();
    reader.onload=e=>{
      prev.src=e.target.result; prev.style.display='block';
      zone.classList.add('hidden');
      btnA.classList.remove('hidden');
      prev._b64=e.target.result.split(',')[1]; prev._mime=file.type;
    };
    reader.readAsDataURL(file);
  }
  fi.addEventListener('change',e=>onFile(e.target.files[0]));
  ci.addEventListener('change',e=>onFile(e.target.files[0]));

  btnA.addEventListener('click',async()=>{
    haptic('medium');
    const key=S.geminiKey;
    if(!key){ toast('⚠️ Укажи Gemini API Key в Профиле'); switchTab('profile'); return; }
    if(!prev._b64){ toast('Сначала выбери фото'); return; }
    btnA.innerHTML='<span class="spinner"></span>Анализирую...'; btnA.disabled=true;
    try{
      lastResult=await callGemini(prev._b64,prev._mime,key);
      renderResult(lastResult);
      document.getElementById('btn-add-diary').classList.remove('hidden');
    } catch(e){
      toast('❌ Ошибка: '+e.message);
      console.error(e);
    }
    btnA.innerHTML='🔄 Анализировать ещё раз'; btnA.disabled=false;
  });

  document.getElementById('btn-add-diary').addEventListener('click',()=>{
    if(!lastResult) return;
    const m=lastResult.macros||{};
    addMeal({
      meal:_analyzeMeal,
      name:lastResult.dishName||'Блюдо',
      cal:Math.round(lastResult.totalCalories||0),
      p:Math.round(m.protein||0),
      f:Math.round(m.fats||0),
      c:Math.round(m.carbs||0)
    });
    haptic('success'); toast('✅ Добавлено в дневник!');
    setTimeout(()=>switchTab('home'),800);
  });
}

function renderResult(r){
  const m=r.macros||{};
  const el=document.getElementById('analyze-result');
  el.style.display='block';
  el.innerHTML=`
    <div class="result-dish">${r.dishName||'Блюдо'}</div>
    <div class="result-cal">${Math.round(r.totalCalories||0)} ккал · ${r.confidence||'—'}</div>
    <div class="result-macros">
      <div class="result-macro" style="background:rgba(59,130,246,.1);color:#3b82f6">
        <span class="val">${Math.round(m.protein||0)}г</span><span class="key">Белки</span>
      </div>
      <div class="result-macro" style="background:rgba(249,115,22,.1);color:#f97316">
        <span class="val">${Math.round(m.fats||0)}г</span><span class="key">Жиры</span>
      </div>
      <div class="result-macro" style="background:rgba(168,85,247,.1);color:#a855f7">
        <span class="val">${Math.round(m.carbs||0)}г</span><span class="key">Углеводы</span>
      </div>
    </div>
    <div class="breakdown-list">${(r.breakdown||[]).map(b=>`
      <div class="breakdown-item">
        <div>
          <div class="breakdown-name">${b.ingredient}</div>
          <div style="font-size:.75rem;color:var(--muted)">${b.estimatedWeightGrams}г</div>
        </div>
        <div class="breakdown-meta">
          <div>${Math.round(b.calories)} ккал</div>
          <div>Б${Math.round(b.protein)} Ж${Math.round(b.fats)} У${Math.round(b.carbs)}</div>
        </div>
      </div>`).join('')}
    </div>
    ${r.hiddenCaloriesNotes?`<p style="font-size:.78rem;color:var(--muted);font-style:italic">${r.hiddenCaloriesNotes}</p>`:''}`;
}

// ─── OPENROUTER API (с фоллбэком) ───────────────────────────
const VISION_MODELS=[
  'google/gemini-2.5-flash-lite',
  'google/gemini-2.0-flash-001',
  'google/gemini-2.5-flash-preview',
  'openai/gpt-4o-mini'
];

async function callGemini(b64, mime, key) {
  const PROMPT=`Ты профессиональный нутрициолог. Проанализируй фото еды и ответь ТОЛЬКО валидным JSON без markdown:
{"dishName":"название на русском","totalCalories":0,"macros":{"protein":0,"fats":0,"carbs":0},"breakdown":[{"ingredient":"","estimatedWeightGrams":0,"calories":0,"protein":0,"fats":0,"carbs":0}],"hiddenCaloriesNotes":"","confidence":"High"}`;

  const msgs=[{
    role:'user',
    content:[
      {type:'text',text:PROMPT},
      {type:'image_url',image_url:{url:`data:${mime};base64,${b64}`}}
    ]
  }];

  let lastErr='';
  for(const model of VISION_MODELS){
    try {
      console.log(`[Cal AI] Пробую модель: ${model}`);
      const res=await fetch('https://openrouter.ai/api/v1/chat/completions',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization':`Bearer ${key}`,
          'HTTP-Referer':'https://cal-ai.app',
          'X-Title':'Cal AI'
        },
        body:JSON.stringify({model,messages:msgs,temperature:0.1,max_tokens:2048})
      });

      const data=await res.json();
      if(!res.ok){
        lastErr=data.error?.message||`HTTP ${res.status}`;
        console.warn(`[Cal AI] ${model} не сработала: ${lastErr}`);
        continue;
      }

      const raw=(data.choices?.[0]?.message?.content||'').trim();
      if(!raw){console.warn(`[Cal AI] ${model} вернула пустой ответ`);continue;}

      const clean=raw.replace(/^```json\s*/i,'').replace(/^```\s*/,'').replace(/\s*```$/,'').trim();
      try {
        return JSON.parse(clean);
      } catch(e) {
        const match=clean.match(/\{[\s\S]*\}/);
        if(match) return JSON.parse(match[0]);
        console.warn(`[Cal AI] ${model} вернула не-JSON`);
        continue;
      }
    } catch(e){
      lastErr=e.message;
      console.warn(`[Cal AI] ${model} ошибка сети: ${lastErr}`);
      continue;
    }
  }
  throw new Error(`Все модели недоступны. Последняя ошибка: ${lastErr}`);
}

// ─── PROFILE TAB ──────────────────────────────────────────
function renderProfile() {
  const p=S.profile||{};
  const gls={lose:'🔥 Похудение',muscle:'💪 Набор мышц',gain:'⚡ Набор веса',maintain:'⚖️ Поддержание'};
  const notifGranted=('Notification' in window && Notification.permission==='granted');

  document.getElementById('panel-profile').innerHTML=`
    <div class="profile-title">👤 Профиль</div>
    <div class="profile-card">
      <div class="profile-card-title">Данные</div>
      ${pRow('Цель',gls[p.goal]||'—')}
      ${pRow('Вес',p.weight?p.weight+' кг':'—')}
      ${pRow('Рост',p.height?p.height+' см':'—')}
      ${pRow('Возраст',p.age?p.age+' лет':'—')}
      ${pRow('Пол',p.gender==='male'?'Мужской':'Женский')}
    </div>
    <div class="profile-card">
      <div class="profile-card-title">OpenRouter API Key</div>
      <p style="font-size:.8rem;color:var(--muted);margin-bottom:12px">
        Бесплатно на <a href="https://openrouter.ai/keys" target="_blank" style="color:var(--green)">openrouter.ai</a>
      </p>
      <div class="api-input-wrap">
        <input class="api-input" id="api-inp" type="password" placeholder="sk-or-..." value="${S.geminiKey||''}"/>
      </div>
      <div class="key-ok" id="key-ok" style="${S.geminiKey?'display:block':''}">✅ Ключ сохранён</div>
      <button class="btn-save-key" id="btn-save-key">Сохранить ключ</button>
    </div>
    <div class="profile-card">
      <div class="profile-card-title">Действия</div>
      <button class="btn-notif${notifGranted?' on':''}" id="btn-notif">
        🔔 ${notifGranted?'Уведомления включены':'Включить уведомления'}
      </button>
      <br/><br/>
      <button class="btn-edit-profile" id="btn-edit">✏️ Редактировать профиль</button>
      <br/><br/>
      <button class="btn-reset" id="btn-reset">🔄 Сбросить и пройти заново</button>
    </div>`;

  document.getElementById('btn-save-key').addEventListener('click',()=>{
    const v=document.getElementById('api-inp').value.trim();
    if(!v){toast('Введи ключ');return;}
    S.geminiKey=v; saveState(); haptic('success');
    document.getElementById('key-ok').style.display='block';
    toast('✅ Ключ сохранён');
  });

  document.getElementById('btn-notif').addEventListener('click',async()=>{
    if(!('Notification' in window)){toast('Браузер не поддерживает уведомления');return;}
    const perm=await Notification.requestPermission();
    if(perm==='granted'){
      haptic('success'); toast('🔔 Уведомления включены!');
      scheduleReminders();
      renderProfile();
    } else {
      toast('❌ Доступ к уведомлениям запрещён');
    }
  });

  document.getElementById('btn-edit').addEventListener('click',()=>{
    if(confirm('Редактировать профиль? Данные дневника сохранятся.')){
      obStep=0; obProfile=Object.assign({},S.profile||{});
      document.getElementById('screen-ob').classList.remove('hidden');
      document.getElementById('screen-app').classList.add('hidden');
      showOb();
    }
  });

  document.getElementById('btn-reset').addEventListener('click',()=>{
    if(confirm('Сбросить всё и пройти настройку заново?')){
      const k=S.geminiKey;
      Object.keys(S).forEach(key=>delete S[key]);
      if(k) S.geminiKey=k;
      saveState(); obStep=0; obProfile={};
      document.getElementById('screen-ob').classList.remove('hidden');
      document.getElementById('screen-app').classList.add('hidden');
      showOb();
    }
  });
}
function pRow(l,v){return `<div class="profile-row"><span class="profile-row-label">${l}</span><span class="profile-row-val">${v}</span></div>`;}

// ─── NOTIFICATIONS ─────────────────────────────────────────
function scheduleReminders() {
  if(Notification.permission!=='granted') return;
  // Напоминание каждые 4 часа (через setInterval для TMA)
  const times=['08:00','12:00','16:00','20:00'];
  const now=new Date();
  times.forEach(t=>{
    const [h,m]=t.split(':').map(Number);
    const next=new Date(); next.setHours(h,m,0,0);
    if(next<=now) next.setDate(next.getDate()+1);
    const delay=next-now;
    setTimeout(()=>{
      new Notification('Cal AI 🍽️',{body:'Не забудь записать приём пищи!',icon:'/favicon.ico'});
    }, delay);
  });
}

// ─── INIT ─────────────────────────────────────────────────
(function init(){
  if(S.profile && S.kbju) showApp();
  else showOb();
})();
