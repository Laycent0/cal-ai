"""KBJU Calculator — Mifflin-St Jeor formula"""

ACTIVITY = {
    'sedentary': 1.20,
    'light':     1.375,
    'moderate':  1.55,
    'high':      1.725,
    'extreme':   1.90,
}

GOAL_LABELS = {
    'lose':     '🔥 Похудение',
    'muscle':   '💪 Набор мышц',
    'gain':     '⚡ Набор веса',
    'maintain': '⚖️ Поддержание формы',
}

ACTIVITY_LABELS = {
    'sedentary': '🛋 Сидячий',
    'light':     '🚶 Лёгкая',
    'moderate':  '🏃 Умеренная',
    'high':      '💪 Высокая',
    'extreme':   '🏋️ Экстремальная',
}

def bmr(gender, age, height, weight):
    base = 10 * weight + 6.25 * height - 5 * age
    return base + 5 if gender == 'male' else base - 161

def calculate(profile: dict) -> dict:
    _bmr  = bmr(profile['gender'], profile['age'], profile['height'], profile['weight'])
    tdee  = _bmr * ACTIVITY.get(profile['activity'], 1.55)
    goal  = profile['goal']

    # Calorie adjustment
    if goal == 'lose':
        adj = {'slow': -0.10, 'moderate': -0.20, 'fast': -0.25}.get(profile.get('lose_speed','moderate'), -0.20)
    elif goal == 'muscle':
        adj = {'beginner': 0.12, 'intermediate': 0.08, 'advanced': 0.05}.get(profile.get('experience','beginner'), 0.10)
    elif goal == 'gain':
        adj = {'slow': 0.10, 'moderate': 0.15, 'fast': 0.20}.get(profile.get('gain_speed','moderate'), 0.15)
    else:
        adj = 0.0

    calories = round(tdee * (1 + adj))

    # Protein: g per kg bodyweight
    pg = {'lose': 2.0, 'muscle': 2.2, 'gain': 1.8, 'maintain': 1.6}.get(goal, 1.8)
    protein = round(profile['weight'] * pg)

    # Fat: 25-28% of calories
    fat_pct = 0.25 if goal in ('lose', 'muscle') else 0.28
    fats = round(calories * fat_pct / 9)

    # Carbs: remainder
    carbs = round((calories - protein * 4 - fats * 9) / 4)
    carbs = max(carbs, 50)

    actual_cal = protein * 4 + fats * 9 + carbs * 4

    return {
        'calories': actual_cal,
        'protein':  protein,
        'fats':     fats,
        'carbs':    carbs,
        'bmr':      round(_bmr),
        'tdee':     round(tdee),
    }
