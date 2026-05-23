"""Menu callback handlers: plan, diary, water, reset."""
from telegram import Update
from telegram.ext import ContextTypes
import storage, keyboards as kb
from calculator import GOAL_LABELS, ACTIVITY_LABELS


async def handle_menu(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query; await q.answer()
    uid = q.from_user.id
    action = q.data

    # ── Main Menu ────────────────────────────────────────────────────────────
    if action == "menu_main":
        await q.edit_message_text(
            "🏠 *Главное меню*\nВыбери действие:",
            parse_mode="Markdown", reply_markup=kb.main_menu_kb(),
        )

    # ── My Plan ──────────────────────────────────────────────────────────────
    elif action == "menu_plan":
        profile = storage.get_profile(uid)
        kbju    = storage.get_kbju(uid)
        if not profile or not kbju:
            await q.edit_message_text("⚠️ Профиль не найден. Нажми /start", reply_markup=kb.back_kb())
            return
        g  = GOAL_LABELS.get(profile['goal'], profile['goal'])
        ac = ACTIVITY_LABELS.get(profile['activity'], profile['activity'])
        text = (
            "📊 *Твой план питания*\n\n"
            f"🎯 Цель: {g}\n"
            f"🏃 Активность: {ac}\n"
            f"⚖️ Вес: {profile['weight']} кг  📏 Рост: {profile['height']} см\n"
            f"🎂 Возраст: {profile['age']} лет\n"
            f"🍽 Приёмов: {profile.get('meals',3)}/день\n\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            f"🔥 Норма калорий: *{kbju['calories']} ккал*\n"
            f"🥩 Белки: *{kbju['protein']} г*\n"
            f"🥑 Жиры: *{kbju['fats']} г*\n"
            f"🍞 Углеводы: *{kbju['carbs']} г*\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            f"📈 Базальный метаболизм: {kbju['bmr']} ккал\n"
            f"⚡ TDEE (с активностью): {kbju['tdee']} ккал"
        )
        await q.edit_message_text(text, parse_mode="Markdown", reply_markup=kb.back_kb())

    # ── Diary ────────────────────────────────────────────────────────────────
    elif action == "menu_diary":
        kbju  = storage.get_kbju(uid)
        diary = storage.get_diary(uid)
        if not kbju:
            await q.edit_message_text("⚠️ Профиль не найден. Нажми /start", reply_markup=kb.back_kb())
            return
        goal_cal = kbju['calories']
        if not diary:
            await q.edit_message_text(
                "📝 *Дневник сегодня*\n\nПока пусто 🍽\nОтправь *фото еды*, чтобы добавить приём!",
                parse_mode="Markdown", reply_markup=kb.back_kb(),
            )
            return
        eaten_cal  = sum(e['calories'] for e in diary)
        eaten_prot = sum(e['protein']  for e in diary)
        eaten_fat  = sum(e['fats']     for e in diary)
        eaten_carb = sum(e['carbs']    for e in diary)
        left = max(0, goal_cal - eaten_cal)
        pct  = min(100, round(eaten_cal / goal_cal * 100)) if goal_cal else 0
        bar  = "█" * (pct // 10) + "░" * (10 - pct // 10)

        lines = [f"  {i+1}. {e['dish']} — {e['calories']} ккал" for i, e in enumerate(diary)]
        entries_text = "\n".join(lines)

        text = (
            f"📝 *Дневник — сегодня*\n\n{entries_text}\n\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            f"🔥 Съедено: *{eaten_cal}* / {goal_cal} ккал\n"
            f"`{bar}` {pct}%\n"
            f"🥩 Б {eaten_prot}г  🥑 Ж {eaten_fat}г  🍞 У {eaten_carb}г\n"
            f"🎯 Осталось: *{left} ккал*"
        )
        await q.edit_message_text(text, parse_mode="Markdown", reply_markup=kb.back_kb())

    # ── Water ────────────────────────────────────────────────────────────────
    elif action == "menu_water":
        water_ml = storage.get_water(uid)
        text = (
            f"💧 *Вода сегодня:* {water_ml/1000:.2f} л / 2.00 л\n\n"
            "Сколько выпил?"
        )
        await q.edit_message_text(text, parse_mode="Markdown", reply_markup=kb.water_kb())

    elif action.startswith("water_"):
        ml = int(action.split("_")[1])
        total = storage.add_water(uid, ml)
        pct   = min(100, round(total / 2000 * 100))
        bar   = "💧" * (pct // 10) + "░" * (10 - pct // 10)
        await q.edit_message_text(
            f"✅ Добавлено *{ml} мл*!\n\n"
            f"💧 Сегодня: *{total/1000:.2f} л* / 2.00 л\n"
            f"`{bar}` {pct}%",
            parse_mode="Markdown", reply_markup=kb.back_kb(),
        )

    # ── Food hint ────────────────────────────────────────────────────────────
    elif action == "menu_food":
        await q.edit_message_text(
            "📸 *Анализ еды*\n\nПросто отправь мне *фото блюда* прямо в чат!\nЯ мгновенно распознаю состав и калории 🔍",
            parse_mode="Markdown", reply_markup=kb.back_kb(),
        )

    # ── Reset ────────────────────────────────────────────────────────────────
    elif action == "menu_reset":
        await q.edit_message_text(
            "⚙️ Хочешь пересчитать план?\nНажми /start — пройдём настройку заново.",
            reply_markup=kb.back_kb(),
        )
