import nodemailer from "nodemailer";
import type { ShipmentStatus } from "@prisma/client";
import { prisma } from "./db";
import { site } from "./site";
import { getDictionary, isLocale, type Locale } from "./i18n";

export async function sendEmail(to: string, subject: string, text: string) {
  if (!process.env.SMTP_HOST) return false;
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  await transport.sendMail({ from: process.env.SMTP_FROM, to, subject, text });
  return true;
}

export async function sendTelegram(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
  });
  return res.ok;
}

export function statusMessage(locale: Locale, trackingNumber: string, status: ShipmentStatus, location?: string) {
  const t = getDictionary(locale);
  const url = `${site.url}/${locale}/track?n=${trackingNumber}`;
  return {
    subject: `${site.name}: ${trackingNumber} - ${t.status[status]}`,
    text: `${t.notify.update} ${trackingNumber}\n${t.notify.status}: ${t.status[status]}${
      location ? `\n${t.notify.location}: ${location}` : ""
    }\n\n${url}`,
  };
}

/** Sends the new status to the customer, the recipient and any Telegram subscribers. */
export async function notifyStatusChange(shipmentId: string, status: ShipmentStatus, location?: string) {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { customer: true, subscriptions: true },
  });
  if (!shipment) return;
  const locale: Locale = shipment.customer && isLocale(shipment.customer.locale) ? shipment.customer.locale : "hy";
  const msg = statusMessage(locale, shipment.trackingNumber, status, location);

  const emails = new Set([shipment.customer?.email, shipment.recipientEmail].filter(Boolean) as string[]);
  const chats = new Set(
    [shipment.customer?.telegramChatId, ...shipment.subscriptions.map((s) => s.chatId)].filter(Boolean) as string[],
  );
  await Promise.allSettled([
    ...[...emails].map((e) => sendEmail(e, msg.subject, msg.text)),
    ...[...chats].map((c) => sendTelegram(c, msg.text)),
  ]);
}
