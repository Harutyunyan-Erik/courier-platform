# Courier Platform

Կուրիերային ընկերության կայք՝ օդային և ցամաքային առաքումների համար.

- **Հանրային կայք** 3 լեզվով (հայերեն, ռուսերեն, անգլերեն)՝ ծառայություններ, գնի հաշվիչ, կապ
- **Tracking էջ**՝ համարով որոնում (մեր համարը կամ կրողի համարը), progress bar և պատմություն
- **Հաճախորդի հաշիվ**՝ գրանցում, մուտք, իր առաքումները, նոր առաքման պատվեր, Telegram ծանուցումներ
- **Ադմին վահանակ**՝ առաքումներ, ձեռքով ստատուսներ, ավտոմատ թարմացում կրողից, աշխատակիցներ և դերեր, կրողներ, սակագներ
- **Ավտոմատացում**՝ DHL, FedEx, UPS, 17TRACK (Հայփոստ և այլն) adapter-ներ, worker, cron endpoint, webhook-ներ
- **Ծանուցումներ**՝ Email (SMTP) և Telegram bot

Stack. Next.js 15 (App Router, Server Actions), PostgreSQL, Prisma, Tailwind CSS 4.

## Ինչպես է աշխատում ստատուսը

Յուրաքանչյուր առաքում ունի ստատուսների **պատմություն** (`StatusEvent`)։ Ամեն իրադարձություն ունի աղբյուր՝ `API`, `WEBHOOK`, `MANUAL` կամ `SYSTEM`։ Ընթացիկ ստատուսը միշտ վերջին տեսանելի իրադարձությունն է, այդ պատճառով API-ից և ձեռքով եկած թարմացումները իրար չեն խանգարում.

- Ադմինը կարող է ցանկացած պահի ձեռքով ավելացնել ստատուս, նաև «ներքին» (հաճախորդը չի տեսնում)։
- API-ից եկած սխալ իրադարձությունը կարելի է **թաքցնել**. այն մնում է պատմության մեջ, բայց չի ազդում ստատուսի վրա և նորից չի ներմուծվում։
- Առաքման համար կարելի է **անջատել ավտոմատ թարմացումը**։
- Սեփական կուրիերներով առաքումները (առանց կրողի) թարմացվում են միայն ձեռքով. կուրիերը իր էջում ունի արագ կոճակներ։

## Դերեր

| Դեր | Իրավունքներ |
|---|---|
| Super admin | Ամեն ինչ, աշխատակիցներ, կրողներ |
| Manager | Առաքումներ, ստատուսներ, սակագներ |
| Courier | Միայն իրեն կցված առաքումները, ստատուսի արագ փոփոխություն |
| Customer | Իր առաքումները, նոր պատվեր |

## Լոկալ գործարկում

```bash
cp .env.example .env          # լրացրեք DATABASE_URL և AUTH_SECRET
npm install
npx prisma migrate deploy
npm run db:seed               # demo տվյալներ (SEED_DEMO=false՝ միայն admin)
npm run dev                   # http://localhost:3000
npm run worker                # ավտոմատ sync-ը առանձին պրոցեսում
```

Demo հաշիվներ seed-ից հետո (production-ում անպայման փոխեք).

| Email | Գաղտնաբառ | Դեր |
|---|---|---|
| admin@example.com | admin12345 | Super admin |
| manager@example.com | manager12345 | Manager |
| courier@example.com | courier12345 | Courier |
| customer@example.com | customer12345 | Customer |

Demo tracking համարներ. `EC-A7KQ2M9XH`, `EC-G3PLW8ZQ2`, `EC-AD3M0TRK5` (վերջինը «Demo carrier»-ով է, որը ամեն 2 րոպեն մեկ նոր ստատուս է «ուղարկում»՝ ավտոմատացումը ստուգելու համար)։

## Docker (VPS)

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec web npm run db:seed
```

Կբարձրանան PostgreSQL-ը, կայքը (պորտ 3000) և worker-ը։ Դրսից HTTPS-ի համար դրեք Caddy կամ Nginx։

## Vercel (ինտերնետում)

1. vercel.com → **Add New → Project** → ընտրեք `courier-platform` repo-ն → դեռ **մի** սեղմեք Deploy։
2. **Environment Variables** բաժնում ավելացրեք.
   - `AUTH_SECRET`՝ երկար պատահական տեքստ
   - `CRON_SECRET`՝ ևս մեկ պատահական տեքստ
   - `SEED_ADMIN_PASSWORD`՝ admin@example.com-ի գաղտնաբառը
   - `SEED_DEMO`՝ `true` (demo տվյալներով) կամ `false` (իրական աշխատանքի համար)
3. Deploy սեղմեք։ Առաջին build-ը կձախողվի, որովհետև բազա դեռ չկա, դա նորմալ է։
4. Project → **Storage → Create Database → Neon** → Connect։ `DATABASE_URL` և `DATABASE_URL_UNPOOLED` կավելանան ավտոմատ։
5. **Deployments → Redeploy**։ Build-ի ընթացքում կանցնեն միգրացիաները և seed-ը։
6. Settings → Environment Variables-ում ավելացրեք `APP_URL` = ձեր `https://....vercel.app` հասցեն և նորից Redeploy։

Vercel Hobby պլանում cron-ը աշխատում է օրը մեկ անգամ (`vercel.json`)։ Ավելի հաճախ թարմացնելու համար [cron-job.org](https://cron-job.org)-ում ստեղծեք job, որը ամեն 15–30 րոպեն մեկ կանչում է `https://<ձեր հասցեն>/api/cron/sync`՝ `Authorization: Bearer <CRON_SECRET>` header-ով։

## Կրողների միացում

API բանալիները դրվում են `.env`-ում, որից հետո ադմինի «Կրողներ» էջում կերևա «API-ն միացված է».

| Կրող | Որտեղից ստանալ | Փոփոխականներ |
|---|---|---|
| DHL | developer.dhl.com, «Shipment Tracking - Unified» | `DHL_API_KEY` |
| FedEx | developer.fedex.com, Track API | `FEDEX_CLIENT_ID`, `FEDEX_CLIENT_SECRET` |
| UPS | developer.ups.com, Tracking API | `UPS_CLIENT_ID`, `UPS_CLIENT_SECRET` |
| Հայփոստ և այլ | 17track.net API | `TRACK17_API_KEY` |

Ավտոմատ sync-ը աշխատում է երկու ձևով.
1. `npm run worker`՝ ամեն `SYNC_INTERVAL_MINUTES` րոպեն մեկ։
2. `POST /api/cron/sync` header-ով `Authorization: Bearer $CRON_SECRET` (արտաքին cron-ի համար)։

17TRACK webhook. `POST /api/webhooks/17track` (URL-ը դրեք 17TRACK-ի dashboard-ում)։

Նոր կրող ավելացնելու համար գրեք adapter `src/lib/carriers/`-ում (`fetchEvents(number)` → իրադարձություններ) և գրանցեք `src/lib/carriers/index.ts`-ում։

## Telegram

1. @BotFather-ով ստեղծեք bot, լրացրեք `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET`։
2. Գրանցեք webhook-ը.
   `https://api.telegram.org/bot<TOKEN>/setWebhook?url=<APP_URL>/api/webhooks/telegram&secret_token=<SECRET>`
3. Հաճախորդը կարող է միացնել Telegram-ը իր էջից, կամ bot-ին ուղարկել tracking համարը։

## Բրենդ

Անունը, հեռախոսը և email-ը `src/lib/site.ts`-ում են, լոգոն՝ `src/components/Logo.tsx`, գույները՝ `src/app/globals.css` (`--color-brand-*`)։

## Թեստեր

```bash
npm test         # status mapping, tracking համարներ
npm run typecheck
```
