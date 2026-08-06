// Supabase Edge Function: обработчик вебхука Telegram-бота.
// Деплой: supabase functions deploy telegram-webhook --no-verify-jwt
// (--no-verify-jwt обязателен: сюда стучится Telegram, а не залогиненный
// пользователь сайта; подлинность запроса проверяем секретным заголовком
// x-telegram-bot-api-secret-token, см. TELEGRAM_STARS_SETUP.md)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const STARS_PRICE = 50; // ⭐ за 1 месяц подписки
const SUBSCRIPTION_DAYS = 30;

function isValidUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

async function callTelegram(method: string, body: unknown) {
  const res = await fetch(`${TELEGRAM_API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) console.error(`[telegram] ${method} failed:`, JSON.stringify(data));
  return data;
}

Deno.serve(async (req) => {
  // Секретный заголовок задаётся при регистрации вебхука (setWebhook) и
  // приходит от Telegram на каждый апдейт. Без совпадения — не наш вызов.
  const secretHeader = req.headers.get("x-telegram-bot-api-secret-token");
  if (secretHeader !== WEBHOOK_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  const update = await req.json().catch(() => null);
  if (!update) return new Response("OK");

  try {
    // 1) Пользователь перешёл по диплинку с сайта: /start sub_<uuid>
    //    — сразу присылаем счёт на оплату звёздами.
    if (update.message?.text?.startsWith("/start")) {
      const chatId = update.message.chat.id;
      const payload = update.message.text.split(" ")[1] || "";

      if (payload.startsWith("sub_")) {
        const userId = payload.slice(4);

        if (!isValidUuid(userId)) {
          await callTelegram("sendMessage", {
            chat_id: chatId,
            text: "Не удалось распознать ссылку с сайта. Откройте «Оформить подписку» на сайте MonoSound ещё раз.",
          });
          return new Response("OK");
        }

        await callTelegram("sendInvoice", {
          chat_id: chatId,
          title: "MonoSound Премиум",
          description: "Безлимитное прослушивание, офлайн-скачивание и поддержка авторов — 1 месяц",
          payload: userId, // вернётся нам в successful_payment/pre_checkout_query как есть
          currency: "XTR", // Telegram Stars
          prices: [{ label: "MonoSound Премиум (1 месяц)", amount: STARS_PRICE }],
          provider_token: "", // для Stars всегда пустая строка
        });

        // Не обязателен для самой оплаты, но пригодится на будущее
        // (например, чтобы слать напоминания о продлении).
        await supabase.from("profiles").update({ telegram_chat_id: chatId }).eq("user_id", userId);
      } else {
        await callTelegram("sendMessage", {
          chat_id: chatId,
          text: "Привet! Чтобы оформить подписку MonoSound Премиум, нажмите «Оформить подписку» на сайте — оттуда откроется этот диалог со счётом на оплату.",
        });
      }
      return new Response("OK");
    }

    // 2) Telegram спрашивает подтверждение перед списанием звёзд.
    //    ОБЯЗАТЕЛЬНО ответить в течение 10 секунд.
    if (update.pre_checkout_query) {
      const query = update.pre_checkout_query;
      const isValid = isValidUuid(query.invoice_payload);

      await callTelegram("answerPreCheckoutQuery", {
        pre_checkout_query_id: query.id,
        ok: isValid,
        ...(isValid ? {} : { error_message: "Некорректный заказ. Оформите подписку заново на сайте." }),
      });
      return new Response("OK");
    }

    // 3) Оплата прошла — единственное место во всём приложении, где
    //    is_subscribed реально становится true.
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      const userId = payment.invoice_payload;

      if (isValidUuid(userId)) {
        const expiresAt = new Date(Date.now() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

        const { error } = await supabase
          .from("profiles")
          .update({
            is_subscribed: true,
            subscription_expires_at: expiresAt,
            telegram_chat_id: update.message.chat.id,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (error) {
          console.error("[telegram-webhook] Failed to activate subscription:", error.message);
        }

        await callTelegram("sendMessage", {
          chat_id: update.message.chat.id,
          text: "Оплата получена! Подписка MonoSound Премиум активирована на 30 дней 🎧",
        });
      }
      return new Response("OK");
    }

    return new Response("OK");
  } catch (err) {
    console.error("[telegram-webhook] Unhandled error:", err);
    // Telegram в любом случае отвечаем 200, чтобы не спамил ретраями
    return new Response("OK");
  }
});