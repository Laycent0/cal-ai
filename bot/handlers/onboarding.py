"""Onboarding conversation: collects user data → calculates KBJU."""
from telegram import Update
from telegram.ext import (
    ContextTypes, ConversationHandler, CommandHandler, CallbackQueryHandler, MessageHandler, filters,
)
import storage, calculator, keyboards as kb
from calculator import GOAL_LABELS, ACTIVITY_LABELS

# States
(GOAL, GENDER, AGE, HEIGHT, WEIGHT,
 GOAL_SPEC, ACTIVITY, MEALS, RESTRICTIONS, CONFIRM) = range(10)


# ── /start ──────────────────────────────────────────────────────────────────
async def start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    ctx.user_data.clear()
    await update.message.reply_text(
        "👋 Привет! Я *Cal AI* — твой персональный нутрициолог.\n\n"
        "Я рассчитаю точные КБЖУ под твои цели и буду анализировать фото еды 📸\n\n"
        "Давай начнём! *Какая у тебя главная цель?*",
        parse_mode="Markdown",
        reply_markup=kb.goal_kb(),
    )
    return GOAL


# ── GOAL ────────────────────────────────────────────────────────────────────
async def on_goal(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query; await q.answer()
    ctx.user_data['goal'] = q.data.replace("goal_", "")
    await q.edit_message_text(
        "Отлично! Теперь скажи, *какой у тебя пол?*",
        parse_mode="Markdown", reply_markup=kb.gender_kb(),
    )
    return GENDER


# ── GENDER ──────────────────────────────────────────────────────────────────
async def on_gender(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query; await q.answer()
    ctx.user_data['gender'] = q.data.replace("gender_", "")
    await q.edit_message_text("📅 Сколько тебе *лет*?", parse_mode="Markdown")
    return AGE


# ── AGE ─────────────────────────────────────────────────────────────────────
async def on_age(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    try:
        age = int(update.message.text.strip())
        if not 10 <= age <= 100: raise ValueError
    except ValueError:
        await update.message.reply_text("❌ Введи возраст числом (например: 25)")
        return AGE
    ctx.user_data['age'] = age
    await update.message.reply_text("📏 Твой *рост* в сантиметрах?", parse_mode="Markdown")
    return HEIGHT


# ── HEIGHT ──────────────────────────────────────────────────────────────────
async def on_height(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    try:
        h = float(update.message.text.strip())
        if not 100 <= h <= 250: raise ValueError
    except ValueError:
        await update.message.reply_text("❌ Введи рост в см (например: 175)")
        return HEIGHT
    ctx.user_data['height'] = h
    await update.message.reply_text("⚖️ Текущий *вес* в килограммах?", parse_mode="Markdown")
    return WEIGHT


# ── WEIGHT ──────────────────────────────────────────────────────────────────
async def on_weight(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    try:
        w = float(update.message.text.strip())
        if not 30 <= w <= 300: raise ValueError
    except ValueError:
        await update.message.reply_text("❌ Введи вес в кг (например: 75)")
        return WEIGHT
    ctx.user_data['weight'] = w
    goal = ctx.user_data['goal']

    if goal == 'lose':
        await update.message.reply_text(
            "🔥 С какой *скоростью* хочешь худеть?\n\n"
            "Медленно = меньше стресса для тела\n"
            "Быстро = больше дефицит калорий",
            parse_mode="Markdown", reply_markup=kb.lose_speed_kb(),
        )
    elif goal == 'muscle':
        await update.message.reply_text(
            "💪 Какой у тебя *опыт тренировок*?\n\n"
            "Это важно — новичкам нужен больший профицит для роста.",
            parse_mode="Markdown", reply_markup=kb.experience_kb(),
        )
    elif goal == 'gain':
        await update.message.reply_text(
            "⚡ С какой *скоростью* хочешь набирать вес?",
            parse_mode="Markdown", reply_markup=kb.gain_speed_kb(),
        )
    else:  # maintain
        await update.message.reply_text(
            "🏃 Какой у тебя *уровень активности*?",
            parse_mode="Markdown", reply_markup=kb.activity_kb(),
        )
        return ACTIVITY
    return GOAL_SPEC


# ── GOAL_SPEC ────────────────────────────────────────────────────────────────
async def on_goal_spec(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query; await q.answer()
    data = q.data
    goal = ctx.user_data['goal']

    if goal == 'lose':
        ctx.user_data['lose_speed'] = data.replace("lose_", "")
    elif goal == 'muscle':
        ctx.user_data['experience'] = data.replace("exp_", "")
    elif goal == 'gain':
        ctx.user_data['gain_speed'] = data.replace("gain_", "")

    await q.edit_message_text(
        "🏃 Выбери *уровень физической активности*:",
        parse_mode="Markdown", reply_markup=kb.activity_kb(),
    )
    return ACTIVITY


# ── ACTIVITY ─────────────────────────────────────────────────────────────────
async def on_activity(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query; await q.answer()
    ctx.user_data['activity'] = q.data.replace("act_", "")
    await q.edit_message_text(
        "🍽 Сколько *приёмов пищи* в день тебе удобно?",
        parse_mode="Markdown", reply_markup=kb.meals_kb(),
    )
    return MEALS


# ── MEALS ────────────────────────────────────────────────────────────────────
async def on_meals(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query; await q.answer()
    ctx.user_data['meals'] = int(q.data.replace("meals_", ""))
    await q.edit_message_text(
        "🥦 Есть ли у тебя *пищевые ограничения или предпочтения*?\n\n"
        "Например: вегетарианство, непереносимость лактозы, без глютена...\n"
        "Или нажми «Пропустить».",
        parse_mode="Markdown", reply_markup=kb.skip_kb(),
    )
    return RESTRICTIONS


# ── RESTRICTIONS ─────────────────────────────────────────────────────────────
async def on_restrictions_text(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    ctx.user_data['restrictions'] = update.message.text.strip()
    return await _finish(update.message, ctx)

async def on_restrictions_skip(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query; await q.answer()
    ctx.user_data['restrictions'] = None
    return await _finish(q.message, ctx)


# ── FINISH ───────────────────────────────────────────────────────────────────
async def _finish(msg, ctx: ContextTypes.DEFAULT_TYPE):
    uid = msg.chat.id
    profile = {k: ctx.user_data[k] for k in (
        'goal','gender','age','height','weight','activity','meals','restrictions'
    ) if k in ctx.user_data}
    # Optional goal-specific fields
    for key in ('lose_speed','experience','gain_speed'):
        if key in ctx.user_data:
            profile[key] = ctx.user_data[key]

    kbju = calculator.calculate(profile)
    storage.save_profile(uid, profile)
    storage.save_kbju(uid, kbju)

    g  = GOAL_LABELS.get(profile['goal'], profile['goal'])
    ac = ACTIVITY_LABELS.get(profile['activity'], profile['activity'])
    m  = profile['meals']
    r  = profile.get('restrictions') or 'нет'

    text = (
        "✅ *Твой персональный план готов!*\n\n"
        f"🎯 Цель: {g}\n"
        f"🏃 Активность: {ac}\n"
        f"🍽 Приёмов пищи: {m}/день\n"
        f"🥦 Ограничения: {r}\n\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        f"🔥 *Калории:* {kbju['calories']} ккал\n"
        f"🥩 *Белки:* {kbju['protein']} г\n"
        f"🥑 *Жиры:* {kbju['fats']} г\n"
        f"🍞 *Углеводы:* {kbju['carbs']} г\n"
        "━━━━━━━━━━━━━━━━━━━━\n\n"
        "📸 Теперь отправь мне *фото еды* — я мгновенно распознаю состав и калории!"
    )
    await msg.reply_text(text, parse_mode="Markdown", reply_markup=kb.main_menu_kb())
    return ConversationHandler.END


def get_handler():
    return ConversationHandler(
        entry_points=[CommandHandler("start", start), CommandHandler("setup", start)],
        states={
            GOAL:         [CallbackQueryHandler(on_goal,             pattern="^goal_")],
            GENDER:       [CallbackQueryHandler(on_gender,           pattern="^gender_")],
            AGE:          [MessageHandler(filters.TEXT & ~filters.COMMAND, on_age)],
            HEIGHT:       [MessageHandler(filters.TEXT & ~filters.COMMAND, on_height)],
            WEIGHT:       [MessageHandler(filters.TEXT & ~filters.COMMAND, on_weight)],
            GOAL_SPEC:    [CallbackQueryHandler(on_goal_spec,        pattern="^(lose_|exp_|gain_)")],
            ACTIVITY:     [CallbackQueryHandler(on_activity,         pattern="^act_")],
            MEALS:        [CallbackQueryHandler(on_meals,            pattern="^meals_")],
            RESTRICTIONS: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, on_restrictions_text),
                CallbackQueryHandler(on_restrictions_skip, pattern="^skip$"),
            ],
        },
        fallbacks=[CommandHandler("start", start)],
    )
