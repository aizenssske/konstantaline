# Moliya — do‘konlar uchun moliyaviy boshqaruv

Savdo, xarajat, ishchi oyligi, avans va filiallar hisobotini yurituvchi to‘liq tizim. Hozirgi 2 ta do‘kon bilan ishlaydi va yangi filiallar qo‘shishga tayyor.

Valyuta — O‘zbekiston so‘mi. Til — o‘zbek tili. Asosiy vaqt zonasi — `Asia/Tashkent`.

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
| Baza | Neon PostgreSQL + Drizzle ORM | Neon |
| Bot | Python 3.13, aiogram 3, FastAPI webhook | Render free web service |
| Ko‘prik | Himoyalangan Next.js REST API | Vercel |

Brauzer va Telegram bot bazaga to‘g‘ridan-to‘g‘ri ulanmaydi. Bot `BOT_API_SECRET` bilan Vercel’dagi `/api/bot/*` ko‘prigiga murojaat qiladi, Next.js server esa Neon’ga Drizzle orqali yozadi.

## Loyiha tuzilishi

```text
app/                    Next.js sahifa va API route'lar
components/             Dashboard interfeysi
lib/                    Auth, validatsiya, repository va hisobotlar
lib/db/                 Neon HTTP driver va Drizzle schema
drizzle/                SQL migratsiyalar
bot/                    Python Telegram bot
render.yaml             Render Blueprint
vercel.json             Vercel sozlamasi
```

## Lokal ishga tushirish

Node.js 20.9+ kerak.

```bash
cp .env.example .env.local
```

Lokal preview uchun `.env.local` da `DEMO_MODE=true` qiling. `DATABASE_URL` shart emas.

```bash
npm install
npm run dev
```

Sayt: [http://localhost:3000](http://localhost:3000)

Kirish (faqat development):

```text
login: admin
parol: admin12345
```

Demo ma’lumotlar vaqtinchalik va server qayta ishga tushganda yo‘qoladi. Production’da bu login/parolni va `DEMO_MODE=true` ni ishlatmang.

Tekshiruvlar:

```bash
npm run typecheck
npm run lint
npm run build
```

## 1. Neon bazasini tayyorlash

1. [neon.tech](https://neon.tech) da loyiha yarating.
2. Regionni Vercel regioniga imkon qadar yaqin tanlang (quyida tavsiya).
3. Dashboard’dan ikkita connection string oling:
   - **Pooled connection** → `DATABASE_URL` (Next.js serverless runtime)
   - **Direct connection** → `DATABASE_URL_UNPOOLED` (migratsiya va Drizzle Studio)
4. Lokalda migratsiyani qo‘llang:

```bash
export DATABASE_URL_UNPOOLED="postgresql://..."
npm run db:generate
npm run db:migrate
```

`npm run db:studio` Drizzle Studio’ni ochadi.

Migratsiya jadvallarni yaratadi va do‘konlar bo‘sh bo‘lsa `1-do‘kon` hamda `2-do‘kon` ni qo‘shadi. Mavjud qatorlar o‘chirilmaydi.

Agar avvalgi PostgreSQL/Supabase’da real ma’lumot bo‘lsa, avval uni Neon’ga import qiling, keyin shu migratsiyani bo‘sh bazaga qayta ishlatmang:

```bash
pg_dump --no-owner --no-acl --data-only \
  --table=shops --table=sales --table=expenses \
  --table=employees --table=salary_payments \
  "$OLD_DATABASE_URL" > moliya-data.sql
```

Import qilingandan so‘ng schema farqini `npm run db:generate` bilan tekshiring. Ma’lumotni o‘chiradigan `DROP` / `TRUNCATE` ishlatmang.

### Vercel va Neon regionlari

Kechtikishni kamaytirish uchun ilova va bazani bir xil mintaqaga qo‘ying. O‘zbekiston uchun tavsiya:

| Vercel region | Neon region |
| --- | --- |
| Frankfurt (`fra1`) — afzal | AWS Frankfurt (`eu-central-1`) |
| Washington, D.C. (`iad1`) | AWS US East 1 (`us-east-1`) |

Frankfurt ilovasini AQSH bazasiga ulamang. Vercel Project Settings → Functions region va Neon project region bir-biriga mos bo‘lsin.

## 2. Vercel’ga web saytni joylash

1. Vercel’da GitHub repository’ni import qiling.
2. Framework sifatida **Next.js**, root directory sifatida repository ildizini qoldiring.
3. Neon’ni Vercel Marketplace / Integration orqali ulang — u `DATABASE_URL` va `DATABASE_URL_UNPOOLED` ni o‘zi yozadi. Yoki qiymatlarni qo‘lda kiriting.
4. Quyidagi Environment Variables’ni Production va Preview uchun qo‘shing:

```env
DATABASE_URL=...
DATABASE_URL_UNPOOLED=...
ADMIN_USERNAME=admin
ADMIN_PASSWORD=JUDA_KUCHLI_PAROL
SESSION_SECRET=ALOHIDA_UZUN_RANDOM_SECRET
BOT_API_SECRET=BOT_UCHUN_BOSHQA_UZUN_RANDOM_SECRET
DEMO_MODE=false
```

`DATABASE_URL` ga `NEXT_PUBLIC_` prefiksini qo‘ymang. Eski `NEXT_PUBLIC_SUPABASE_URL` va `SUPABASE_SERVICE_ROLE_KEY` o‘zgaruvchilarini o‘chiring.

Random secret yaratish:

```bash
openssl rand -hex 32
```

5. Vercel deploy `npm run db:migrate` ni avtomatik ishga tushiradi va jadvallarni yaratadi. Lokalda ham xuddi shu buyruqni ishlatish mumkin.
6. `/api/health` manzili `{"status":"ok","database":"neon","schema":"ready"}` qaytarishini tekshiring.

Database sozlanmasa tizim demo rejimga o‘tmaydi — aniq konfiguratsiya xatosi qaytadi. Demo rejim faqat `DEMO_MODE=true` bo‘lganda yoqiladi.

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
- Barcha pul qiymatlari serverda Zod orqali tekshiriladi (100 milliard so‘mgacha) va bazada `numeric(16,2)` sifatida saqlanadi.
- Database connection string faqat serverda o‘qiladi.
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
- `POST /api/bot/link-codes` — Telegram profilni ulash uchun 1 daqiqalik kod
- `GET /api/bot/access?telegram_id=...` — profil ulanganmi

Barchasi `Authorization: Bearer BOT_API_SECRET` talab qiladi.

Telegram botni saytga ulash: botda `/start` va `/kod`, kelgan kodni web dagi **Telegram bot** sahifasiga 1 daqiqa ichida kiriting. Ulanmagan profillar botdan foydalana olmaydi. Alohida `konstantalinebot` Python loyihasi shu API orqali ishlashi kerak.
