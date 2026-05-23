"""Cal AI Telegram Bot — Entry Point"""
import sys, logging
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from telegram.ext import Application, MessageHandler, CallbackQueryHandler, filters
from config import BOT_TOKEN
from handlers.onboarding import get_handler as get_onboarding
from handlers.food import handle_photo
from handlers.menu import handle_menu

logging.basicConfig(
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    level=logging.INFO,
)

def main():
    if not BOT_TOKEN:
        raise RuntimeError("BOT_TOKEN not set in .env")

    # Proxy support (set HTTPS_PROXY=socks5://... or http://... in .env if Telegram is blocked)
    import os
    proxy = os.getenv("HTTPS_PROXY") or os.getenv("HTTP_PROXY")
    builder = Application.builder().token(BOT_TOKEN)
    if proxy:
        from telegram.request import HTTPXRequest
        builder = builder.request(HTTPXRequest(proxy=proxy))
    app = builder.build()

    # 1. Onboarding conversation (has /start + /setup)
    app.add_handler(get_onboarding())

    # 2. Photo food analysis
    app.add_handler(MessageHandler(filters.PHOTO, handle_photo))

    # 3. Menu callbacks
    app.add_handler(CallbackQueryHandler(handle_menu))

    print("Cal AI Bot started. Press Ctrl+C to stop.")
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()
