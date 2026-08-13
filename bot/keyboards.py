from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, KeyboardButton, ReplyKeyboardMarkup


MAIN_MENU = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text="📊 Bugungi hisobot"), KeyboardButton(text="🛍 Savdo kiritish")],
        [KeyboardButton(text="💸 Xarajat kiritish"), KeyboardButton(text="👥 Oylik / avans")],
        [KeyboardButton(text="📈 Oylik hisobot"), KeyboardButton(text="🏪 Do‘konlar")],
    ],
    resize_keyboard=True,
    input_field_placeholder="Kerakli bo‘limni tanlang",
)

CANCEL_MENU = ReplyKeyboardMarkup(
    keyboard=[[KeyboardButton(text="❌ Bekor qilish")]],
    resize_keyboard=True,
)


def shop_keyboard(shops: list[dict], prefix: str, include_all: bool = False) -> InlineKeyboardMarkup:
    rows = []
    if include_all:
        rows.append([InlineKeyboardButton(text="🏪 Barcha do‘konlar", callback_data=f"{prefix}:all")])
    rows.extend([[InlineKeyboardButton(text=f"📍 {shop['name']}", callback_data=f"{prefix}:{shop['id']}")] for shop in shops])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def category_keyboard() -> InlineKeyboardMarkup:
    categories = ["Ijara", "Kommunal", "Mahsulot", "Transport", "Soliq", "Reklama", "Ta’mirlash", "Boshqa"]
    rows = [[InlineKeyboardButton(text=category, callback_data=f"cat:{index}") for index, category in list(enumerate(categories))[start:start + 2]] for start in range(0, len(categories), 2)]
    return InlineKeyboardMarkup(inline_keyboard=rows)


def payment_type_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="Avans", callback_data="ptype:advance"), InlineKeyboardButton(text="Oylik", callback_data="ptype:salary")],
        [InlineKeyboardButton(text="Bonus", callback_data="ptype:bonus"), InlineKeyboardButton(text="Ushlanma", callback_data="ptype:deduction")],
    ])
