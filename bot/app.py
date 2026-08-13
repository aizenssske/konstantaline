from contextlib import asynccontextmanager
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import Update
from fastapi import FastAPI, HTTPException, Request

from config import config
from handlers import router
from middleware import OwnerOnlyMiddleware

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(name)s | %(message)s")
logger = logging.getLogger("moliya-bot")

bot = Bot(config.bot_token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
dispatcher = Dispatcher(storage=MemoryStorage())
dispatcher.update.outer_middleware(OwnerOnlyMiddleware())
dispatcher.include_router(router)


@asynccontextmanager
async def lifespan(_: FastAPI):
    if config.webhook_base_url:
        webhook_url = f"{config.webhook_base_url}/telegram"
        await bot.set_webhook(
            webhook_url,
            secret_token=config.webhook_secret,
            allowed_updates=dispatcher.resolve_used_update_types(),
            drop_pending_updates=False,
        )
        logger.info("Telegram webhook set: %s", webhook_url)
    else:
        logger.warning("WEBHOOK_BASE_URL yo‘q: webhook o‘rnatilmadi. Lokal ishga tushirish uchun polling.py dan foydalaning.")
    yield
    await bot.session.close()


app = FastAPI(title="Moliya Telegram Bot", docs_url=None, redoc_url=None, lifespan=lifespan)


@app.get("/")
@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "moliya-telegram-bot"}


@app.post("/telegram")
async def telegram_webhook(request: Request) -> dict[str, bool]:
    if request.headers.get("X-Telegram-Bot-Api-Secret-Token") != config.webhook_secret:
        raise HTTPException(status_code=403, detail="Forbidden")
    try:
        update = Update.model_validate(await request.json(), context={"bot": bot})
    except Exception as exc:
        logger.warning("Invalid Telegram update: %s", exc)
        raise HTTPException(status_code=400, detail="Invalid update") from exc
    await dispatcher.feed_update(bot, update)
    return {"ok": True}
