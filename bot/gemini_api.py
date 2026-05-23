"""Gemini Vision API wrapper for food analysis (google-genai SDK)."""
import json, re
from google import genai
from google.genai import types
from config import GEMINI_API_KEY

_client = genai.Client(api_key=GEMINI_API_KEY)

PROMPT = """You are an elite AI Nutritionist. Analyze this food photo.

RULES:
1. Break down every ingredient separately.
2. Account for cooking oils, butter, sauces.
3. Estimate realistic portion weights visually.
4. If not food -> return 0s.

Reply ONLY with raw JSON (no markdown):
{
  "dishName": "Name in Russian",
  "totalCalories": 0,
  "macros": {"protein": 0, "fats": 0, "carbs": 0},
  "breakdown": [
    {"ingredient": "...", "estimatedWeightGrams": 0, "calories": 0, "protein": 0, "fats": 0, "carbs": 0}
  ],
  "hiddenCaloriesNotes": "...",
  "confidence": "High | Medium | Low"
}"""

async def analyze_food(image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    response = await _client.aio.models.generate_content(
        model="gemini-2.0-flash",
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            PROMPT,
        ],
        config=types.GenerateContentConfig(temperature=0.2, max_output_tokens=2048),
    )
    text = response.text.strip()
    text = re.sub(r"```json\n?|```\n?", "", text).strip()
    return json.loads(text)

