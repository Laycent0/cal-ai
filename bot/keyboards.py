from telegram import InlineKeyboardButton as B, InlineKeyboardMarkup as M

def kb(rows): return M(rows)

def goal_kb(): return kb([
    [B("🔥 Похудеть",          callback_data="goal_lose")],
    [B("💪 Набрать мышечную массу", callback_data="goal_muscle")],
    [B("⚡ Набрать вес",        callback_data="goal_gain")],
    [B("⚖️ Поддерживать форму", callback_data="goal_maintain")],
])

def gender_kb(): return kb([[
    B("👨 Мужской", callback_data="gender_male"),
    B("👩 Женский",  callback_data="gender_female"),
]])

def lose_speed_kb(): return kb([
    [B("🐢 Медленно (−0.5 кг/нед)",  callback_data="lose_slow")],
    [B("🏃 Умеренно (−1 кг/нед)",    callback_data="lose_moderate")],
    [B("🚀 Быстро   (−1.5 кг/нед)",  callback_data="lose_fast")],
])

def experience_kb(): return kb([
    [B("🌱 Новичок (< 1 года)",        callback_data="exp_beginner")],
    [B("🏋️ Средний (1–3 года)",        callback_data="exp_intermediate")],
    [B("⚡ Продвинутый (3+ года)",     callback_data="exp_advanced")],
])

def gain_speed_kb(): return kb([
    [B("🐢 Медленно (+0.25 кг/нед)", callback_data="gain_slow")],
    [B("🏃 Умеренно (+0.5 кг/нед)",  callback_data="gain_moderate")],
    [B("🚀 Быстро   (+1 кг/нед)",    callback_data="gain_fast")],
])

def activity_kb(): return kb([
    [B("🛋 Сидячий (офис, нет спорта)",          callback_data="act_sedentary")],
    [B("🚶 Лёгкая (1–2 трен/нед)",               callback_data="act_light")],
    [B("🏃 Умеренная (3–4 трен/нед)",            callback_data="act_moderate")],
    [B("💪 Высокая (5–6 трен/нед)",              callback_data="act_high")],
    [B("🏋️ Экстремальная (каждый день + работа)", callback_data="act_extreme")],
])

def meals_kb(): return kb([[
    B("3", callback_data="meals_3"),
    B("4", callback_data="meals_4"),
    B("5", callback_data="meals_5"),
    B("6", callback_data="meals_6"),
]])

def skip_kb(): return kb([[B("⏭ Пропустить", callback_data="skip")]])

def main_menu_kb(): return kb([
    [B("📸 Анализ фото еды",    callback_data="menu_food")],
    [B("📊 Мой план питания",   callback_data="menu_plan")],
    [B("📝 Дневник сегодня",    callback_data="menu_diary")],
    [B("💧 Добавить воду",      callback_data="menu_water")],
    [B("⚙️ Пересчитать план",   callback_data="menu_reset")],
])

def water_kb(): return kb([[
    B("150 мл", callback_data="water_150"),
    B("250 мл", callback_data="water_250"),
    B("350 мл", callback_data="water_350"),
    B("500 мл", callback_data="water_500"),
]])

def back_kb(): return kb([[B("◀️ Главное меню", callback_data="menu_main")]])
