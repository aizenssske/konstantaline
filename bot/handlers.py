from datetime import datetime
from html import escape
from zoneinfo import ZoneInfo

from aiogram import F, Router
from aiogram.filters import Command, CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup, Message

from api import BridgeError, bridge
from keyboards import CANCEL_MENU, MAIN_MENU, category_keyboard, payment_type_keyboard, shop_keyboard

router = Router()
TZ = ZoneInfo("Asia/Tashkent")
CATEGORIES = ["Ijara", "Kommunal", "Mahsulot", "Transport", "Soliq", "Reklama", "Ta’mirlash", "Boshqa"]
PAYMENT_LABELS = {"advance": "Avans", "salary": "Oylik", "bonus": "Bonus", "deduction": "Ushlanma"}


class SaleFlow(StatesGroup):
    shop = State()
    cash = State()
    card = State()
    description = State()


class ExpenseFlow(StatesGroup):
    shop = State()
    amount = State()
    category = State()
    description = State()


class SalaryFlow(StatesGroup):
    shop = State()
    employee = State()
    payment_type = State()
    amount = State()
    description = State()


def money(value: float | int) -> str:
    return f"{int(value):,}".replace(",", " ") + " so‘m"


def parse_amount(text: str | None) -> int | None:
    if not text:
        return None
    digits = "".join(character for character in text if character.isdigit())
    if not digits:
        return None
    value = int(digits)
    return value if 0 <= value <= 100_000_000_000 else None


def today() -> str:
    return datetime.now(TZ).date().isoformat()


def current_month() -> str:
    return datetime.now(TZ).strftime("%Y-%m")


async def get_shops_or_error(message: Message) -> list[dict] | None:
    try:
        shops = await bridge.shops()
    except BridgeError as exc:
        await message.answer(f"⚠️ {escape(str(exc))}")
        return None
    if not shops:
        await message.answer("Hali do‘kon qo‘shilmagan. Avval web saytdan filial yarating.")
        return None
    return shops


@router.message(CommandStart())
async def start(message: Message, state: FSMContext) -> None:
    await state.clear()
    name = escape(message.from_user.first_name if message.from_user else "")
    telegram_id = message.from_user.id if message.from_user else 0
    linked = telegram_id in config.allowed_telegram_ids
    if not linked and telegram_id:
        try:
            linked = await bridge.is_linked(telegram_id)
        except BridgeError:
            linked = False
    if linked:
        await message.answer(
            f"Assalomu alaykum, <b>{name}</b>! 👋\n\n"
            "Men <b>Moliya</b> tizimining yordamchi botiman. Savdo va xarajat kiritish, avans berish hamda hisobotlarni ko‘rish mumkin.",
            reply_markup=MAIN_MENU,
        )
        return
    await message.answer(
        f"Assalomu alaykum, <b>{name}</b>! 👋\n\n"
        "Bu bot faqat saytga ulangan Telegram profillar uchun ishlaydi.\n\n"
        "1) <b>/kod</b> buyrug‘ini yuboring\n"
        "2) Kelgan 6 xonali kodni 1 daqiqa ichida web saytdagi <b>Telegram bot</b> sahifasiga kiriting",
    )


@router.message(Command("kod"))
async def link_code(message: Message, state: FSMContext) -> None:
    await state.clear()
    user = message.from_user
    if not user:
        await message.answer("Telegram profil aniqlanmadi.")
        return
    try:
        result = await bridge.create_link_code(user.id, user.username or "", user.first_name or "")
    except BridgeError as exc:
        await message.answer(f"⚠️ {escape(str(exc))}")
        return
    if result.get("already_linked"):
        await message.answer("✅ Bu profil allaqachon saytga ulangan.", reply_markup=MAIN_MENU)
        return
    code = escape(str(result.get("code") or ""))
    await message.answer(
        f"🔑 Vaqtinchalik kod: <code>{code}</code>\n\n"
        "Uni 1 daqiqa ichida web saytdagi <b>Telegram bot</b> sahifasiga kiriting.\n"
        "Muddati o‘tsa, /kod ni qayta yuboring.",
    )


@router.message(Command("yordam"))
async def help_command(message: Message) -> None:
    await message.answer(
        "<b>Bot imkoniyatlari</b>\n\n"
        "📊 Bugungi naqd, plastik va jami savdo\n"
        "🛍 Yangi savdo kiritish\n"
        "💸 Izohli xarajat kiritish\n"
        "👥 Ishchiga avans yoki oylik berish\n"
        "📈 Oylik moliyaviy hisobot\n\n"
        "Jarayonni to‘xtatish uchun /bekor buyrug‘ini yuboring.",
        reply_markup=MAIN_MENU,
    )


@router.message(Command("bekor"))
@router.message(F.text == "❌ Bekor qilish")
async def cancel(message: Message, state: FSMContext) -> None:
    await state.clear()
    await message.answer("Amal bekor qilindi.", reply_markup=MAIN_MENU)


@router.message(Command("bugun"))
@router.message(F.text == "📊 Bugungi hisobot")
async def today_menu(message: Message) -> None:
    shops = await get_shops_or_error(message)
    if shops:
        await message.answer("Hisobot uchun filialni tanlang:", reply_markup=shop_keyboard(shops, "today", include_all=True))


@router.callback_query(F.data.startswith("today:"))
async def today_report(callback: CallbackQuery) -> None:
    shop_id = callback.data.split(":", 1)[1] if callback.data else "all"
    await callback.answer("Hisobot tayyorlanmoqda...")
    try:
        result = await bridge.today_summary(None if shop_id == "all" else shop_id)
        summary = result["summary"]
        shop_name = "Barcha do‘konlar"
        if shop_id != "all":
            shops = await bridge.shops()
            shop_name = next((shop["name"] for shop in shops if shop["id"] == shop_id), "Tanlangan filial")
        change = summary.get("comparedToYesterday")
        change_text = "Ma’lumot yo‘q" if change is None else f"{'📈' if change >= 0 else '📉'} {abs(change):.1f}% {'ko‘p' if change >= 0 else 'kam'}"
        text = (
            f"<b>📊 Bugungi hisobot</b>\n"
            f"🏪 {escape(shop_name)}\n\n"
            f"💰 Jami savdo: <b>{money(summary['todayTotal'])}</b>\n"
            f"💵 Naqd: <b>{money(summary['todayCash'])}</b>\n"
            f"💳 Plastik: <b>{money(summary['todayCard'])}</b>\n\n"
            f"Kecha bilan farq: {change_text}\n"
            f"📅 Oylik savdo: {money(summary['monthTotal'])}\n"
            f"✅ Oylik sof qoldiq: <b>{money(summary['monthNet'])}</b>"
        )
        if callback.message:
            await callback.message.answer(text, reply_markup=MAIN_MENU)
    except BridgeError as exc:
        if callback.message:
            await callback.message.answer(f"⚠️ {escape(str(exc))}", reply_markup=MAIN_MENU)


@router.message(Command("oylik_hisobot"))
@router.message(F.text == "📈 Oylik hisobot")
async def month_menu(message: Message) -> None:
    shops = await get_shops_or_error(message)
    if shops:
        await message.answer("Oylik hisobot uchun filialni tanlang:", reply_markup=shop_keyboard(shops, "month", include_all=True))


@router.callback_query(F.data.startswith("month:"))
async def month_report(callback: CallbackQuery) -> None:
    shop_id = callback.data.split(":", 1)[1] if callback.data else "all"
    await callback.answer("Oylik hisobot tayyorlanmoqda...")
    try:
        report = await bridge.month_summary(None if shop_id == "all" else shop_id)
        summary = report["summary"]
        growth = summary.get("growth")
        growth_text = "taqqoslash uchun ma’lumot yo‘q" if growth is None else f"{'+' if growth >= 0 else '−'}{abs(growth):.1f}%"
        text = (
            f"<b>📈 {escape(report['month'])} oylik hisobot</b>\n\n"
            f"💰 Jami savdo: <b>{money(summary['totalSales'])}</b>\n"
            f"💵 Naqd: {money(summary['cash'])}\n"
            f"💳 Plastik: {money(summary['card'])}\n\n"
            f"💸 Xarajat: {money(summary['expenses'])}\n"
            f"👥 Oylik va avans: {money(summary['salaries'])}\n"
            f"✅ Sof qoldiq: <b>{money(summary['net'])}</b>\n\n"
            f"Oldingi oyga nisbatan: <b>{growth_text}</b>"
        )
        if callback.message:
            await callback.message.answer(text, reply_markup=MAIN_MENU)
    except BridgeError as exc:
        if callback.message:
            await callback.message.answer(f"⚠️ {escape(str(exc))}", reply_markup=MAIN_MENU)


@router.message(F.text == "🏪 Do‘konlar")
async def shops_list(message: Message) -> None:
    shops = await get_shops_or_error(message)
    if shops:
        lines = ["<b>🏪 Faol do‘konlar</b>", ""]
        lines.extend(f"{index + 1}. <b>{escape(shop['name'])}</b>\n   {escape(shop.get('address') or 'Manzil kiritilmagan')}" for index, shop in enumerate(shops))
        await message.answer("\n".join(lines), reply_markup=MAIN_MENU)


# --- Sale flow ---
@router.message(Command("savdo"))
@router.message(F.text == "🛍 Savdo kiritish")
async def sale_start(message: Message, state: FSMContext) -> None:
    shops = await get_shops_or_error(message)
    if shops:
        await state.set_state(SaleFlow.shop)
        await message.answer("Savdo qaysi do‘konga tegishli?", reply_markup=shop_keyboard(shops, "sale"))


@router.callback_query(SaleFlow.shop, F.data.startswith("sale:"))
async def sale_shop(callback: CallbackQuery, state: FSMContext) -> None:
    await state.update_data(shop_id=callback.data.split(":", 1)[1])
    await state.set_state(SaleFlow.cash)
    await callback.answer()
    if callback.message:
        await callback.message.answer("💵 <b>Naqd savdo summasini</b> yuboring.\nMasalan: <code>2500000</code>", reply_markup=CANCEL_MENU)


@router.message(SaleFlow.cash)
async def sale_cash(message: Message, state: FSMContext) -> None:
    amount = parse_amount(message.text)
    if amount is None:
        await message.answer("Summani faqat raqam bilan yuboring. Masalan: <code>2500000</code>")
        return
    await state.update_data(cash_amount=amount)
    await state.set_state(SaleFlow.card)
    await message.answer("💳 <b>Plastik orqali savdo summasini</b> yuboring. Bo‘lmasa <code>0</code> yuboring.")


@router.message(SaleFlow.card)
async def sale_card(message: Message, state: FSMContext) -> None:
    amount = parse_amount(message.text)
    if amount is None:
        await message.answer("Summani faqat raqam bilan yuboring.")
        return
    data = await state.get_data()
    if amount + data.get("cash_amount", 0) <= 0:
        await message.answer("Naqd va plastik summasidan kamida bittasi noldan katta bo‘lishi kerak.")
        return
    await state.update_data(card_amount=amount)
    await state.set_state(SaleFlow.description)
    await message.answer("📝 Savdo uchun izoh yuboring. Izoh kerak bo‘lmasa <code>-</code> yuboring.")


@router.message(SaleFlow.description)
async def sale_finish(message: Message, state: FSMContext) -> None:
    data = await state.get_data()
    description = "" if (message.text or "").strip() == "-" else (message.text or "").strip()
    try:
        await bridge.add_sale({
            "shop_id": data["shop_id"], "sale_date": today(),
            "cash_amount": data["cash_amount"], "card_amount": data["card_amount"],
            "description": description,
        })
        total = data["cash_amount"] + data["card_amount"]
        await state.clear()
        await message.answer(
            f"✅ <b>Savdo saqlandi!</b>\n\n💵 Naqd: {money(data['cash_amount'])}\n💳 Plastik: {money(data['card_amount'])}\n💰 Jami: <b>{money(total)}</b>",
            reply_markup=MAIN_MENU,
        )
    except BridgeError as exc:
        await message.answer(f"⚠️ {escape(str(exc))}\nQayta urinish uchun izohni yana yuboring.")


# --- Expense flow ---
@router.message(Command("xarajat"))
@router.message(F.text == "💸 Xarajat kiritish")
async def expense_start(message: Message, state: FSMContext) -> None:
    shops = await get_shops_or_error(message)
    if shops:
        await state.set_state(ExpenseFlow.shop)
        await message.answer("Xarajat qaysi do‘konga tegishli?", reply_markup=shop_keyboard(shops, "expense"))


@router.callback_query(ExpenseFlow.shop, F.data.startswith("expense:"))
async def expense_shop(callback: CallbackQuery, state: FSMContext) -> None:
    await state.update_data(shop_id=callback.data.split(":", 1)[1])
    await state.set_state(ExpenseFlow.amount)
    await callback.answer()
    if callback.message:
        await callback.message.answer("💸 Xarajat summasini yuboring.\nMasalan: <code>350000</code>", reply_markup=CANCEL_MENU)


@router.message(ExpenseFlow.amount)
async def expense_amount(message: Message, state: FSMContext) -> None:
    amount = parse_amount(message.text)
    if not amount:
        await message.answer("Noldan katta summani raqam bilan yuboring.")
        return
    await state.update_data(amount=amount)
    await state.set_state(ExpenseFlow.category)
    await message.answer("Xarajat kategoriyasini tanlang:", reply_markup=category_keyboard())


@router.callback_query(ExpenseFlow.category, F.data.startswith("cat:"))
async def expense_category(callback: CallbackQuery, state: FSMContext) -> None:
    try:
        category = CATEGORIES[int(callback.data.split(":", 1)[1])]
    except (ValueError, IndexError):
        await callback.answer("Noto‘g‘ri kategoriya", show_alert=True)
        return
    await state.update_data(category=category)
    await state.set_state(ExpenseFlow.description)
    await callback.answer()
    if callback.message:
        await callback.message.answer(f"📝 <b>{escape(category)}</b> xarajati uchun aniq izoh yuboring.\nMasalan: mahsulot yetkazib beruvchiga to‘lov")


@router.message(ExpenseFlow.description)
async def expense_finish(message: Message, state: FSMContext) -> None:
    description = (message.text or "").strip()
    if len(description) < 2:
        await message.answer("Xarajat uchun qisqa izoh yozing.")
        return
    data = await state.get_data()
    try:
        await bridge.add_expense({"shop_id": data["shop_id"], "expense_date": today(), "amount": data["amount"], "category": data["category"], "description": description})
        await state.clear()
        await message.answer(f"✅ <b>Xarajat saqlandi!</b>\n\n🏷 {escape(data['category'])}\n📝 {escape(description)}\n💸 <b>{money(data['amount'])}</b>", reply_markup=MAIN_MENU)
    except BridgeError as exc:
        await message.answer(f"⚠️ {escape(str(exc))}\nQayta urinish uchun izohni yana yuboring.")


# --- Salary flow ---
@router.message(Command("oylik"))
@router.message(F.text == "👥 Oylik / avans")
async def salary_start(message: Message, state: FSMContext) -> None:
    shops = await get_shops_or_error(message)
    if shops:
        await state.set_state(SalaryFlow.shop)
        await message.answer("Ishchi qaysi filialda ishlaydi?", reply_markup=shop_keyboard(shops, "salary"))


@router.callback_query(SalaryFlow.shop, F.data.startswith("salary:"))
async def salary_shop(callback: CallbackQuery, state: FSMContext) -> None:
    shop_id = callback.data.split(":", 1)[1]
    await callback.answer()
    try:
        employees = await bridge.employees(shop_id)
    except BridgeError as exc:
        if callback.message:
            await callback.message.answer(f"⚠️ {escape(str(exc))}", reply_markup=MAIN_MENU)
        await state.clear()
        return
    if not employees:
        if callback.message:
            await callback.message.answer("Bu filialda faol ishchi yo‘q. Avval web saytdan ishchi qo‘shing.", reply_markup=MAIN_MENU)
        await state.clear()
        return
    await state.update_data(shop_id=shop_id)
    await state.set_state(SalaryFlow.employee)
    keyboard = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text=f"👤 {employee['full_name']}", callback_data=f"employee:{employee['id']}")] for employee in employees])
    if callback.message:
        await callback.message.answer("Ishchini tanlang:", reply_markup=keyboard)


@router.callback_query(SalaryFlow.employee, F.data.startswith("employee:"))
async def salary_employee(callback: CallbackQuery, state: FSMContext) -> None:
    await state.update_data(employee_id=callback.data.split(":", 1)[1])
    await state.set_state(SalaryFlow.payment_type)
    await callback.answer()
    if callback.message:
        await callback.message.answer("To‘lov turini tanlang:", reply_markup=payment_type_keyboard())


@router.callback_query(SalaryFlow.payment_type, F.data.startswith("ptype:"))
async def salary_type(callback: CallbackQuery, state: FSMContext) -> None:
    payment_type = callback.data.split(":", 1)[1]
    if payment_type not in PAYMENT_LABELS:
        await callback.answer("Noto‘g‘ri to‘lov turi", show_alert=True)
        return
    await state.update_data(payment_type=payment_type)
    await state.set_state(SalaryFlow.amount)
    await callback.answer()
    if callback.message:
        await callback.message.answer(f"💰 <b>{PAYMENT_LABELS[payment_type]}</b> summasini yuboring:", reply_markup=CANCEL_MENU)


@router.message(SalaryFlow.amount)
async def salary_amount(message: Message, state: FSMContext) -> None:
    amount = parse_amount(message.text)
    if not amount:
        await message.answer("Noldan katta summani raqam bilan yuboring.")
        return
    await state.update_data(amount=amount)
    await state.set_state(SalaryFlow.description)
    await message.answer("📝 To‘lov izohini yuboring. Kerak bo‘lmasa <code>-</code> yuboring.")


@router.message(SalaryFlow.description)
async def salary_finish(message: Message, state: FSMContext) -> None:
    data = await state.get_data()
    description = "" if (message.text or "").strip() == "-" else (message.text or "").strip()
    try:
        await bridge.add_salary_payment({
            "employee_id": data["employee_id"], "shop_id": data["shop_id"],
            "payment_date": today(), "salary_month": current_month(),
            "amount": data["amount"], "payment_type": data["payment_type"],
            "description": description,
        })
        await state.clear()
        await message.answer(f"✅ <b>{PAYMENT_LABELS[data['payment_type']]} saqlandi!</b>\n\n💰 {money(data['amount'])}\n📅 {current_month()} oyi uchun", reply_markup=MAIN_MENU)
    except BridgeError as exc:
        await message.answer(f"⚠️ {escape(str(exc))}\nQayta urinish uchun izohni yana yuboring.")


@router.message()
async def fallback(message: Message) -> None:
    await message.answer("Quyidagi menyudan kerakli bo‘limni tanlang yoki /yordam buyrug‘ini yuboring.", reply_markup=MAIN_MENU)
