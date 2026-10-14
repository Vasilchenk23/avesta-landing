import { NextResponse } from "next/server";
import crypto from "crypto";

let cachedPublicKey: string | null = null;

const courses = {
  1: {
    name: "Структура Зодіаку",
    price: 99900,
  },
  2: {
    name: "Знаки Зодіаку",
    price: 99900,
  },
  3: {
    name: "Планети",
    price: 132000,
  },
  4: {
    name: "Кармічний",
    price: 132000,
  },
} as const;

/* =========================
   PUBLIC KEY MONOBANK
========================= */

async function getMonoPublicKey(
  forceRefresh = false
) {
  if (cachedPublicKey && !forceRefresh) {
    return cachedPublicKey;
  }

  const token = process.env.MONO_TOKEN;

  if (!token) {
    throw new Error("MONO_TOKEN is missing");
  }

  const response = await fetch(
    "https://api.monobank.ua/api/merchant/pubkey",
    {
      method: "GET",
      headers: {
        "X-Token": token,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to get Monobank public key: ${response.status}`
    );
  }

  const data = await response.json();

  if (!data.key) {
    throw new Error(
      "Monobank public key is missing"
    );
  }

  cachedPublicKey = Buffer.from(
    data.key,
    "base64"
  ).toString("utf8");

  return cachedPublicKey;
}

/* =========================
   SIGNATURE
========================= */

function verifyMonoSignature(
  body: string,
  signature: string,
  publicKey: string
) {
  const verifier =
    crypto.createVerify("SHA256");

  verifier.update(body);
  verifier.end();

  return verifier.verify(
    publicKey,
    Buffer.from(signature, "base64")
  );
}

/* =========================
   GET INVOICE FROM MONO
========================= */

async function getInvoiceStatus(
  invoiceId: string
) {
  const token = process.env.MONO_TOKEN;

  if (!token) {
    throw new Error("MONO_TOKEN is missing");
  }

  const response = await fetch(
    `https://api.monobank.ua/api/merchant/invoice/status?invoiceId=${encodeURIComponent(
      invoiceId
    )}`,
    {
      method: "GET",
      headers: {
        "X-Token": token,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    console.error(
      "MONO STATUS ERROR:",
      response.status,
      errorText
    );

    throw new Error(
      "Failed to get invoice status"
    );
  }

  return response.json();
}

/* =========================
   TELEGRAM
========================= */

async function sendTelegramNotification(
  invoice: any
) {
  const botToken =
    process.env.TELEGRAM_BOT_TOKEN;

  const chatId =
    process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error(
      "Telegram environment variables are missing"
    );

    return;
  }

  const amount =
    Number(invoice.amount || 0);

  const amountInUah =
    amount / 100;

  /*
    Сначала пытаемся получить courseId
    из metadata.
  */

  const metadata =
    invoice.merchantPaymInfo?.metadata || {};

  let courseId = Number(
    metadata.courseId || 0
  );

  /*
    Если metadata по какой-то причине нет,
    пробуем reference:
    course-3-xxxxxxxx
  */

  if (!courseId) {
    const reference =
      invoice.reference ||
      invoice.merchantPaymInfo?.reference ||
      "";

    const match =
      reference.match(/^course-(\d+)-/);

    if (match) {
      courseId = Number(match[1]);
    }
  }

  const course =
    courseId && courseId in courses
      ? courses[
          courseId as keyof typeof courses
        ]
      : null;

  const courseName =
    course?.name ||
    metadata.courseName ||
    "Курс AVESTA";

  /*
    Проверяем сумму.
    Если курс определён, сумма должна
    полностью совпадать.
  */

  if (
    course &&
    course.price !== amount
  ) {
    console.error(
      "PAYMENT AMOUNT MISMATCH:",
      {
        invoiceId: invoice.invoiceId,
        courseId,
        expected: course.price,
        received: amount,
      }
    );

    return;
  }

  /* Контактные данные */

  const customerName =
    metadata.customerName || "—";

  const customerTelegram =
    metadata.customerTelegram || "—";

  const customerEmail =
    metadata.customerEmail ||
    invoice.merchantPaymInfo
      ?.customerEmails?.[0] ||
    "—";

  const message = [
    "💳 НОВА ОПЛАТА AVESTA",
    "",
    `Курс: ${courseName}`,
    `Сума: ${amountInUah} грн`,
    "",
    `👤 Ім'я: ${customerName}`,
    `✈️ Telegram: ${customerTelegram}`,
    `📧 Email: ${customerEmail}`,
    "",
    "Статус: успішно",
    `Invoice ID: ${
      invoice.invoiceId || "—"
    }`,
  ].join("\n");

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Telegram payment notification error:",
      errorText
    );

    throw new Error(
      "Telegram notification failed"
    );
  }
}

/* =========================
   WEBHOOK
========================= */

export async function POST(
  request: Request
) {
  try {
    const signature =
      request.headers.get("x-sign");

    if (!signature) {
      console.error(
        "MONO WEBHOOK: x-sign is missing"
      );

      return NextResponse.json(
        {
          error: "Invalid signature",
        },
        {
          status: 401,
        }
      );
    }

    const rawBody =
      await request.text();

    let publicKey =
      await getMonoPublicKey();

    let isValid =
      verifyMonoSignature(
        rawBody,
        signature,
        publicKey
      );

    /*
      Если mono поменял ключ,
      обновляем его и проверяем ещё раз.
    */

    if (!isValid) {
      publicKey =
        await getMonoPublicKey(true);

      isValid =
        verifyMonoSignature(
          rawBody,
          signature,
          publicKey
        );
    }

    if (!isValid) {
      console.error(
        "MONO WEBHOOK: invalid signature"
      );

      return NextResponse.json(
        {
          error: "Invalid signature",
        },
        {
          status: 401,
        }
      );
    }

    const webhook =
      JSON.parse(rawBody);

    console.log(
      "MONO WEBHOOK VERIFIED:",
      {
        invoiceId:
          webhook.invoiceId,
        status:
          webhook.status,
        amount:
          webhook.amount,
        modifiedDate:
          webhook.modifiedDate,
      }
    );

    /*
      Нас интересует только
      успешная оплата.
    */

    if (
      webhook.status === "success" &&
      webhook.invoiceId
    ) {
      /*
        Получаем invoice непосредственно
        с сервера Monobank.
      */

      const invoice =
        await getInvoiceStatus(
          webhook.invoiceId
        );

      /*
        Дополнительная серверная проверка.
      */

      if (
        invoice.status !== "success"
      ) {
        console.error(
          "INVOICE STATUS IS NOT SUCCESS:",
          invoice.status
        );

        return NextResponse.json(
          {
            error:
              "Payment is not successful",
          },
          {
            status: 400,
          }
        );
      }

      /*
        invoiceId должен совпадать.
      */

      if (
        invoice.invoiceId !==
        webhook.invoiceId
      ) {
        console.error(
          "INVOICE ID MISMATCH"
        );

        return NextResponse.json(
          {
            error:
              "Invoice mismatch",
          },
          {
            status: 400,
          }
        );
      }

      await sendTelegramNotification(
        invoice
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Webhook error:",
      error
    );

    return NextResponse.json(
      {
        error: "Webhook error",
      },
      {
        status: 400,
      }
    );
  }
}