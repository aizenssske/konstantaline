from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Config:
    bot_token: str
    web_api_url: str
    bot_api_secret: str
    allowed_telegram_ids: frozenset[int]
    webhook_base_url: str
    webhook_secret: str

    @classmethod
    def from_env(cls) -> "Config":
        token = os.getenv("BOT_TOKEN", "").strip()
        api_url = os.getenv("WEB_API_URL", "").strip().rstrip("/")
        api_secret = os.getenv("BOT_API_SECRET", "").strip()
        raw_ids = os.getenv("ALLOWED_TELEGRAM_IDS", "").strip()
        webhook_secret = os.getenv("WEBHOOK_SECRET", "").strip()

        missing = [name for name, value in {
            "BOT_TOKEN": token,
            "WEB_API_URL": api_url,
            "BOT_API_SECRET": api_secret,
            "ALLOWED_TELEGRAM_IDS": raw_ids,
            "WEBHOOK_SECRET": webhook_secret,
        }.items() if not value]
        if missing:
            raise RuntimeError(f"Majburiy muhit o‘zgaruvchilari yo‘q: {', '.join(missing)}")

        try:
            allowed_ids = frozenset(int(value.strip()) for value in raw_ids.split(",") if value.strip())
        except ValueError as exc:
            raise RuntimeError("ALLOWED_TELEGRAM_IDS faqat raqamlardan iborat bo‘lishi kerak") from exc

        return cls(
            bot_token=token,
            web_api_url=api_url,
            bot_api_secret=api_secret,
            allowed_telegram_ids=allowed_ids,
            webhook_base_url=os.getenv("WEBHOOK_BASE_URL", "").strip().rstrip("/"),
            webhook_secret=webhook_secret,
        )


config = Config.from_env()
