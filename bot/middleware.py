from typing import Any, Awaitable, Callable
from aiogram import BaseMiddleware
from aiogram.types import CallbackQuery, Message, TelegramObject

from api import BridgeError, bridge
from config import config

OPEN_COMMANDS = {"/start", "/kod", "/yordam", "/help", "/bekor"}


def _is_open_event(event: TelegramObject) -> bool:
    if isinstance(event, Message) and event.text:
        command = event.text.split()[0].split("@", 1)[0].lower()
        return command in OPEN_COMMANDS
    return False


class OwnerOnlyMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[TelegramObject, dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: dict[str, Any],
    ) -> Any:
        user = data.get("event_from_user")
        if not user:
            return await handler(event, data)
        if _is_open_event(event):
            return await handler(event, data)
        if user.id in config.allowed_telegram_ids:
            return await handler(event, data)

        try:
            linked = await bridge.is_linked(user.id)
        except BridgeError:
            linked = False
        if linked:
            return await handler(event, data)

        text = (
            "⛔ Bu Telegram profil hali saytga ulanmagan.\n\n"
            "1) /kod buyrug‘ini yuboring\n"
            "2) Kelgan kodni 1 daqiqa ichida web saytdagi <b>Telegram bot</b> sahifasiga kiriting."
        )
        if isinstance(event, Message):
            await event.answer(text)
        elif isinstance(event, CallbackQuery):
            await event.answer("Avval saytga ulaning. /kod yuboring.", show_alert=True)
        return None
