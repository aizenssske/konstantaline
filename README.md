# Moliya — do‘konlar uchun moliyaviy boshqaruv

Savdo, xarajat, ishchi oyligi, avans va filiallar hisobotini yurituvchi to‘liq tizim. Hozirgi 2 ta do‘kon bilan ishlaydi va yangi filiallar qo‘shishga tayyor.

## Imkoniyatlar

- Bugungi jami, naqd va plastik savdo
- Izohli va kategoriyalangan xarajatlar
- Ishchilar, belgilangan oylik, avans, bonus, ushlanma va oylik to‘lovi
- Barcha filiallar yoki alohida filial kesimida ko‘rsatkichlar
- Oylik hisobot, oldingi oy bilan taqqoslash va avtomatik tahlil
- CSV hisobot yuklash
- Telegram botdan savdo/xarajat/to‘lov kiritish va hisobot ko‘rish
- Bitta administrator uchun yopiq login
- Telegram foydalanuvchi ID bo‘yicha botga ruxsat
- Mobil telefon, planshet va kompyuter uchun moslashuvchan interfeys

## Texnologiyalar

| Qism | Texnologiya | Joylashtirish |
| --- | --- | --- |
| Web | Next.js 16.3, React 19, TypeScript, Turbopack | Vercel |
| UI | Tailwind CSS 4, Recharts, Lucide | Vercel |
| Baza | Supabase PostgreSQL | Supabase free |
| Bot | Python 3.13, aiogram 3, FastAPI webhook | Render free web service |
| Ko‘prik | Himoyalangan Next.js REST API | Vercel |

Brauzer va Telegram bot bazaga to‘g‘ridan-to‘g‘ri ulanmaydi. Bot `BOT_API_SECRET` bilan Vercel’dagi `/api/bot/*` ko‘prigiga murojaat qiladi, Next.js server esa Supabase’ga yozadi.

## Loyiha tuzilishi

```text
app/                    Next.js sahifa va API route'lar
components/             Dashboard interfeysi
lib/                    Auth, validatsiya, repository va hisobotlar
supabase/schema.sql     PostgreSQL sxemasi
bot/                    Python Telegram bot
render.yaml             Render Blueprint
vercel.json             Vercel sozlamasi
```

## Lokal ishga tushirish

Node.js 20.9+ kerak.

```bash
npm install
npm run dev
```

Sayt: [http://localhost:3000](http://localhost:3000)

Lokal `.env.local` demo rejimga sozlangan. Kirish:

```text
login: admin
parol: admin12345
```

Demo ma’lumotlar vaqtinchalik va server qayta ishga tushganda yo‘qolishi mumkin. Production’da bu login/parolni ishlatmang.

Tekshiruvlar:

```bash
npm run typecheck
npm run lint
npm run build
```

## 1. Supabase bazasini tayyorlash

1. [supabase.com](https://supabase.com) da bepul loyiha yarating.
2. **SQL Editor** bo‘limiga kiring.
3. [`supabase/schema.sql`](supabase/schema.sql) faylini to‘liq nusxalab, `Run` bosing.
4. **Project Settings → API** dan quyidagilarni oling:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY`

`service_role` kalitini hech qachon brauzer kodi, Telegram yoki ommaviy joyga qo‘ymang. U faqat Vercel server environment’ida saqlanadi. Jadvallarda RLS yoqilgan, shuning uchun anonim brauzer ulanishi yopiq.

## 2. Vercel’ga web saytni joylash

1. Vercel’da GitHub repository’ni import qiling.
2. Framework sifatida **Next.js**, root directory sifatida repository ildizini qoldiring.
3. Quyidagi Environment Variables’ni qo‘shing:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_USERNAME=admin
ADMIN_PASSWORD=JUDA_KUCHLI_PAROL
SESSION_SECRET=ALOHIDA_UZUN_RANDOM_SECRET
BOT_API_SECRET=BOT_UCHUN_BOSHQA_UZUN_RANDOM_SECRET
DEMO_MODE=false
```

Random secret yaratish:

```bash
openssl rand -hex 32
```

4. Deploy qiling. Masalan, web manzil `https://moliya.vercel.app` bo‘ladi.
5. `/api/health` manzili `{"status":"ok","database":"supabase"}` qaytarishini tekshiring.

## 3. Telegram bot yaratish

1. Telegram’da [@BotFather](https://t.me/BotFather) ga `/newbot` yuboring.
2. Bot nomi va username bering.
3. Berilgan tokenni `BOT_TOKEN` sifatida saqlang.
4. O‘zingizning Telegram numeric ID’ingizni bilib, `ALLOWED_TELEGRAM_IDS` ga yozing. Bir nechta egaga ruxsat kerak bo‘lsa vergul bilan ajrating: `123456789,987654321`.

## 4. Render’ga botni joylash

Repository’dagi `render.yaml` webhook asosidagi bepul web service yaratishga tayyor.

1. Render Dashboard’da **New → Blueprint** ni tanlang va repository’ni ulang.
2. Quyidagi qiymatlarni kiriting:

```env
BOT_TOKEN=BotFather bergan token
WEB_API_URL=https://moliya.vercel.app
BOT_API_SECRET=Vercel'dagi BOT_API_SECRET bilan aynan bir xil
ALLOWED_TELEGRAM_IDS=sizning_telegram_id
WEBHOOK_BASE_URL=https://moliya-telegram-bot.onrender.com
WEBHOOK_SECRET=faqat_harf_raqam_tire_va_pastki_chiziqli_random_secret
```

3. Birinchi deploy’da Render service URL aniq bo‘lgach, `WEBHOOK_BASE_URL` ni shu URL bilan tekshiring va **Manual Deploy** qiling.
4. `https://...onrender.com/health` manzili `status: ok` qaytarishi kerak.
5. Botga `/start` yuboring.

> Render free service bir muddat ishlatilmasa uyquga ketishi mumkin. Birinchi bot so‘rovi servis uyg‘onguncha biroz kechikadi. Bot webhook ishlatgani uchun doimiy background worker talab qilmaydi.

### Botni lokal polling rejimida sinash

`bot/.env.example` asosida muhit o‘zgaruvchilarini terminalga export qiling, so‘ng:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r bot/requirements.txt
cd bot
python polling.py
```

## Xavfsizlik

- Web panel HTTP-only, `SameSite=Lax` JWT cookie bilan himoyalangan.
- Production’da `ADMIN_PASSWORD` va `SESSION_SECRET` bo‘lmasa login ishlamaydi.
- Bot API faqat Bearer `BOT_API_SECRET` bilan ishlaydi.
- Telegram webhook `X-Telegram-Bot-Api-Secret-Token` orqali tekshiriladi.
- Faqat `ALLOWED_TELEGRAM_IDS` ro‘yxatidagi Telegram hisoblari botdan foydalana oladi.
- Barcha pul qiymatlari serverda Zod orqali tekshiriladi.
- O‘chirilgan filial ma’lumotlari yo‘qolmaydi; filial faqat nofaol qilinadi.

## Muhit o‘zgaruvchilari

Web uchun namuna: [`.env.example`](.env.example)

Bot uchun namuna: [`bot/.env.example`](bot/.env.example)

## API ko‘prigi

Bot uchun endpointlar:

- `GET /api/bot/shops`
- `GET /api/bot/summary?period=today|month&shop_id=...`
- `POST /api/bot/sales`
- `POST /api/bot/expenses`
- `GET /api/bot/employees?shop_id=...`
- `POST /api/bot/salary-payments`

Barchasi `Authorization: Bearer BOT_API_SECRET` talab qiladi.
