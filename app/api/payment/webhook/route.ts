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

async function getMonoPublicKey(forceRefresh = false) {
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
    throw new Error("Monobank public key is missing");
  }

  cachedPublicKey = Buffer.from(
    data.key,
    "base64"
  ).toString("utf8");

  return cachedPublicKey;
}

function verifyMonoSignature(
  body: string,
  signature: string,
  publicKey: string
) {
  const verifier = crypto.createVerify("SHA256");

  verifier.update(body);
  verifier.end();

  return verifier.verify(
    publicKey,
    Buffer.from(signature, "base64")
  );
}

async function sendTelegramNotification(body: {
  invoiceId?: string;
  status?: string;
  amount?: number;
  reference?: string;
  modifiedDate?: string;
}) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error(
      "Telegram environment variables are missing"
    );
    return;
  }

  const amount = Number(body.amount || 0);
  const amountInUah = amount / 100;

  // Получаем ID курса из reference вида:
  // course-1-xxxxxxxx
  const courseIdMatch =
    body.reference?.match(/^course-(\d+)-/);

  const courseId = courseIdMatch
    ? Number(courseIdMatch[1])
    : null;

  const course =
    courseId && courseId in courses
      ? courses[courseId as keyof typeof courses]
      : null;

  const courseName =
    course?.name || "Курс AVESTA";

  // Дополнительная проверка суммы
  if (course && course.price !== amount) {
    console.error("PAYMENT AMOUNT MISMATCH:", {
      invoiceId: body.invoiceId,
      courseId,
      expected: course.price,
      received: amount,
    });

    return;
  }

  const message = [
    "💳 НОВА ОПЛАТА AVESTA",
    "",
    `Курс: ${courseName}`,
    `Сума: ${amountInUah} грн`,
    "Статус: успішно",
    `Invoice ID: ${body.invoiceId || "—"}`,
  ].join("\n");

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    console.error(
      "Telegram payment notification error:",
      errorText
    );
  }
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-sign");

    if (!signature) {
      console.error(
        "MONO WEBHOOK: x-sign is missing"
      );

      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const rawBody = await request.text();

    let publicKey = await getMonoPublicKey();

    let isValid = verifyMonoSignature(
      rawBody,
      signature,
      publicKey
    );

    // Если mono обновил публичный ключ —
    // получаем его заново и проверяем ещё раз
    if (!isValid) {
      publicKey = await getMonoPublicKey(true);

      isValid = verifyMonoSignature(
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
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const body = JSON.parse(rawBody);

    console.log("MONO WEBHOOK VERIFIED:", {
      invoiceId: body.invoiceId,
      status: body.status,
      amount: body.amount,
      reference: body.reference,
      modifiedDate: body.modifiedDate,
    });

    // Telegram отправляем только после успешной оплаты
    if (body.status === "success") {
      await sendTelegramNotification(body);
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("Webhook error:", error);

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