import { prisma } from "@/lib/db";
import { sendTelegram } from "@/lib/notify";
import { getDictionary } from "@/lib/i18n";
import { normalizeTrackingInput } from "@/lib/tracking-number";
import { site } from "@/lib/site";

// Register once: https://api.telegram.org/bot<TOKEN>/setWebhook?url=<APP_URL>/api/webhooks/telegram&secret_token=<TELEGRAM_WEBHOOK_SECRET>
type Update = { message?: { chat: { id: number }; text?: string; from?: { language_code?: string } } };

export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }
  const update = (await req.json()) as Update;
  const msg = update.message;
  if (!msg?.text) return Response.json({ ok: true });
  const chatId = String(msg.chat.id);
  const lang = msg.from?.language_code;
  const t = getDictionary(lang === "ru" || lang === "en" ? lang : "hy");
  const text = msg.text.trim();

  // /start user_<token> links the chat to a customer account.
  const userToken = text.match(/^\/start user_([a-f0-9]+)$/)?.[1];
  if (userToken) {
    const user = await prisma.user.findUnique({ where: { telegramToken: userToken } });
    if (user) {
      await prisma.user.update({ where: { id: user.id }, data: { telegramChatId: chatId, telegramToken: null } });
      await sendTelegram(chatId, `✅ ${t.account.telegramConnected}`);
    }
    return Response.json({ ok: true });
  }

  // /start track_<number> or a plain tracking number subscribes the chat to one shipment.
  const number = normalizeTrackingInput(text.replace(/^\/start(\s+track_)?/, ""));
  if (!number) {
    await sendTelegram(chatId, `${site.name}\n${t.home.trackPlaceholder}`);
    return Response.json({ ok: true });
  }
  const shipment = await prisma.shipment.findFirst({
    where: { OR: [{ trackingNumber: number }, { carrierTrackingNumber: number }] },
  });
  if (!shipment) {
    await sendTelegram(chatId, t.track.notFound);
    return Response.json({ ok: true });
  }
  await prisma.telegramSubscription.upsert({
    where: { chatId_shipmentId: { chatId, shipmentId: shipment.id } },
    update: {},
    create: { chatId, shipmentId: shipment.id },
  });
  await sendTelegram(
    chatId,
    `📦 <b>${shipment.trackingNumber}</b>\n${t.notify.status}: ${t.status[shipment.currentStatus]}\n${site.url}/hy/track?n=${shipment.trackingNumber}`,
  );
  return Response.json({ ok: true });
}
