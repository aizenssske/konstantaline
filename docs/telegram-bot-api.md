# konstantalinebot — sayt bilan ulanish

Bot alohida Render servisida, Python + aiogram bilan yoziladi. Bazaga to‘g‘ridan-to‘g‘ri ulanmaydi. Faqat Vercel’dagi `/api/bot/*` ko‘prigiga `BOT_API_SECRET` bilan murojaat qiladi.

## Ulanish oqimi

1. Foydalanuvchi botga `/start` yuboradi.
2. Bot `/kod` buyrug‘ini so‘raydi yoki shu buyruqni qabul qiladi.
3. Bot `POST /api/bot/link-codes` chaqiradi va 6 xonali kodni 1 daqiqaga ko‘rsatadi.
4. Administrator web saytdagi **Telegram bot** sahifasiga kodni kiritadi.
5. Keyingi buyruqlar oldidan bot `GET /api/bot/access?telegram_id=` bilan tekshiradi.
6. Ulanmagan profil savdo/xarajat/hisobot ishlata olmaydi.

## Endpointlar

Barchasi:

```http
Authorization: Bearer BOT_API_SECRET
```

### Kod olish

```http
POST /api/bot/link-codes
Content-Type: application/json

{
  "telegram_id": 123456789,
  "username": "alias",
  "first_name": "Ism"
}
```

Javob:

```json
{ "already_linked": false, "code": "482193", "expires_at": "...", "ttl_seconds": 60 }
```

yoki allaqachon ulangan bo‘lsa:

```json
{ "already_linked": true }
```

### Ruxsat

```http
GET /api/bot/access?telegram_id=123456789
```

```json
{ "allowed": true, "linked": true }
```

Qolgan savdo/xarajat/hisobot endpointlari avvalgidek.
