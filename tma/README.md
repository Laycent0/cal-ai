# Cal AI — Telegram Mini App

## Как задеплоить бесплатно на GitHub Pages

### 1. Создай репозиторий на GitHub
Залей папку `tma/` в новый публичный репо.

### 2. Включи GitHub Pages
Settings → Pages → Branch: main → Folder: / (root) → Save

### 3. Зарегистрируй Mini App в BotFather
```
/newapp → выбери бота → вставь URL: https://ИМЯ.github.io/РЕПО/
```

### 4. Открой в Telegram
Пользователь нажимает кнопку в боте → открывается TMA

## Структура файлов
```
tma/
├── index.html      # Основной HTML
├── style.css       # Тёмный дизайн
├── core.js         # Стейт, хранилище, калькулятор КБЖУ
├── onboarding.js   # Онбординг (11 шагов)
└── app.js          # Дневник, анализ, план, вода, профиль
```

## Для анализа фото
Gemini API Key вводится в разделе **Профиль** → хранится в localStorage.
Бесплатно: https://aistudio.google.com/apikey
