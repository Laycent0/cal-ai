"""Handles incoming food photos."""
from telegram import Update
from telegram.ext import ContextTypes
import storage, keyboards as kb
from gemini_api import analyze_food

CONF_EMOJI = {"High": "🟢", "Medium": "🟡", "Low": "🔴"}

async def handle_photo(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    kbju = storage.get_kbju(uid)

    if not kbju:
        await update.message.reply_text(
            "⚠️ Сначала настрой свой профиль — нажми /start",
            reply_markup=kb.back_kb(),
        )
        return

    wait = await update.message.reply_text("🔍 Анализирую блюдо...")

    try:
        photo = update.message.photo[-1]
        file  = await ctx.bot.get_file(photo.file_id)
        data  = await file.download_as_bytearray()
        result = await analyze_food(bytes(data))
    except Exception as e:
        await wait.edit_text(f"❌ Ошибка анализа: {e}\nПопробуй другое фото.")
        return

    cal  = round(result.get("totalCalories", 0))
    m    = result.get("macros", {})
    prot = round(m.get("protein", 0))
    fat  = round(m.get("fats",    0))
    carb = round(m.get("carbs",   0))
    conf = result.get("confidence", "Medium")
    dish = result.get("dishName", "Блюдо")
    note = result.get("hiddenCaloriesNotes", "")

    # Build breakdown lines
    lines = []
    for item in result.get("breakdown", []):
        lines.append(
            f"  • {item['ingredient']} ({item['estimatedWeightGrams']}г) — "
            f"{round(item['calories'])} ккал | "
            f"Б{round(item['protein'])} Ж{round(item['fats'])} У{round(item['carbs'])}"
        )
    breakdown = "\n".join(lines) if lines else "—"

    # Today's diary totals after adding
    storage.add_entry(uid, {"dish": dish, "calories": cal, "protein": prot, "fats": fat, "carbs": carb})
    diary = storage.get_diary(uid)
    eaten_cal  = sum(e['calories'] for e in diary)
    eaten_prot = sum(e['protein']  for e in diary)
    eaten_fat  = sum(e['fats']     for e in diary)
    eaten_carb = sum(e['carbs']    for e in diary)

    goal_cal  = kbju['calories']
    left_cal  = max(0, goal_cal - eaten_cal)
    pct       = min(100, round(eaten_cal / goal_cal * 100)) if goal_cal else 0
    bar       = "█" * (pct // 10) + "░" * (10 - pct // 10)

    text = (
        f"{CONF_EMOJI.get(conf,'🟡')} *{dish}* · {cal} ккал\n\n"
        f"🥩 Белки: *{prot}г*  🥑 Жиры: *{fat}г*  🍞 Углеводы: *{carb}г*\n"
        f"\n*Состав:*\n{breakdown}\n"
        + (f"\n_{note}_\n" if note else "")
        + f"\n━━━━━━━━━━━━━━━━━━━━\n"
        f"📊 *Сегодня съедено:* {eaten_cal} / {goal_cal} ккал\n"
        f"`{bar}` {pct}%\n"
        f"Б {eaten_prot}г · Ж {eaten_fat}г · У {eaten_carb}г\n"
        f"🎯 Осталось: *{left_cal} ккал*"
    )

    await wait.edit_text(text, parse_mode="Markdown", reply_markup=kb.main_menu_kb())
