import { NextResponse } from "next/server";

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

type CourseId = keyof typeof courses;

async function sendNewOrderToTelegram({
  invoiceId,
  courseName,
  amount,
  name,
  telegram,
  email,
}: {
  invoiceId: string;
  courseName: string;
  amount: number;
  name: string;
  telegram: string;
  email: string;
}) {
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

  const amountInUah = amount / 100;

  const message = [
    "🟡 НОВЕ ЗАМОВЛЕННЯ AVESTA",
    "",
    `Курс: ${courseName}`,
    `Сума: ${amountInUah} грн`,
    "",
    `👤 Ім'я: ${name}`,
    `✈️ Telegram: ${telegram}`,
    `📧 Email: ${email}`,
    "",
    "Статус: очікує оплату",
    `Invoice ID: ${invoiceId}`,
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
    const errorText =
      await response.text();

    console.error(
      "Telegram new order notification error:",
      errorText
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const courseId =
      Number(body.courseId);

    const name = String(
      body.customer?.name || ""
    ).trim();

    const telegram = String(
      body.customer?.telegram || ""
    ).trim();

    const email = String(
      body.customer?.email || ""
    )
      .trim()
      .toLowerCase();

    /* Проверяем курс */

    if (
      !courseId ||
      !(courseId in courses)
    ) {
      return NextResponse.json(
        {
          error: "Невідомий курс",
        },
        {
          status: 400,
        }
      );
    }

    /* Проверяем контакты */

    if (
      !name ||
      !telegram ||
      !email
    ) {
      return NextResponse.json(
        {
          error:
            "Необхідно вказати ім'я, Telegram та Email",
        },
        {
          status: 400,
        }
      );
    }

    /* Проверяем email */

    const emailIsValid =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      );

    if (!emailIsValid) {
      return NextResponse.json(
        {
          error: "Некоректний Email",
        },
        {
          status: 400,
        }
      );
    }

    /* Ограничиваем длину */

    if (
      name.length > 100 ||
      telegram.length > 100 ||
      email.length > 200
    ) {
      return NextResponse.json(
        {
          error:
            "Контактні дані занадто довгі",
        },
        {
          status: 400,
        }
      );
    }

    const course =
      courses[courseId as CourseId];

    const token =
      process.env.MONO_TOKEN;

    if (!token) {
      console.error(
        "MONO_TOKEN is missing"
      );

      return NextResponse.json(
        {
          error:
            "Платіжна система не налаштована",
        },
        {
          status: 500,
        }
      );
    }

    const reference =
      `course-${courseId}-${crypto.randomUUID()}`;

    /* Создаём invoice */

    const monoResponse = await fetch(
      "https://api.monobank.ua/api/merchant/invoice/create",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
          "X-Token": token,
        },

        body: JSON.stringify({
          amount: course.price,

          ccy: 980,

          merchantPaymInfo: {
            reference,

            destination:
              `Оплата курсу: ${course.name}`,

            comment:
              `AVESTA — ${course.name}`,

            customerEmails: [
              email,
            ],
          },

          redirectUrl:
            "https://avesta-landing.vercel.app/payment/result",

          webHookUrl:
            "https://avesta-landing.vercel.app/api/payment/webhook",
        }),
      }
    );

    const data =
      await monoResponse.json();

    if (!monoResponse.ok) {
      console.error(
        "Monobank invoice error:",
        data
      );

      return NextResponse.json(
        {
          error:
            "Не вдалося створити платіж",
        },
        {
          status:
            monoResponse.status,
        }
      );
    }

    if (
      !data.invoiceId ||
      !data.pageUrl
    ) {
      console.error(
        "Invalid Monobank invoice response:",
        data
      );

      return NextResponse.json(
        {
          error:
            "Некоректна відповідь платіжної системи",
        },
        {
          status: 500,
        }
      );
    }

    /*
      Invoice уже существует.

      Теперь отправляем контакты
      покупателя в Telegram.
    */

    await sendNewOrderToTelegram({
      invoiceId: data.invoiceId,
      courseName: course.name,
      amount: course.price,
      name,
      telegram,
      email,
    });

    return NextResponse.json({
      invoiceId: data.invoiceId,
      pageUrl: data.pageUrl,
    });
  } catch (error) {
    console.error(
      "Payment creation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Помилка створення платежу",
      },
      {
        status: 500,
      }
    );
  }
}