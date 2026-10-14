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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const courseId = Number(body.courseId);

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

    if (!courseId || !(courseId in courses)) {
      return NextResponse.json(
        {
          error: "Невідомий курс",
        },
        {
          status: 400,
        }
      );
    }

    /* Проверяем данные покупателя */

    if (!name || !telegram || !email) {
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

    /* Простая проверка Email */

    const emailIsValid =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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

    /* Ограничиваем длину данных */

    if (
      name.length > 100 ||
      telegram.length > 100 ||
      email.length > 200
    ) {
      return NextResponse.json(
        {
          error: "Контактні дані занадто довгі",
        },
        {
          status: 400,
        }
      );
    }

    const course =
      courses[courseId as CourseId];

    const token = process.env.MONO_TOKEN;

    if (!token) {
      console.error("MONO_TOKEN is missing");

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

    /*
      reference связывает платеж с курсом.
      Например:
      course-3-xxxxxxxx
    */

    const reference =
      `course-${courseId}-${crypto.randomUUID()}`;

    const monoResponse = await fetch(
      "https://api.monobank.ua/api/merchant/invoice/create",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
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

            customerEmails: [email],

            metadata: {
              courseId: String(courseId),
              courseName: course.name,
              customerName: name,
              customerTelegram: telegram,
              customerEmail: email,
            },
          },

          redirectUrl:
            "https://avesta-landing.vercel.app/payment/result",

          webHookUrl:
            "https://avesta-landing.vercel.app/api/payment/webhook",
        }),
      }
    );

    const data = await monoResponse.json();

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
          status: monoResponse.status,
        }
      );
    }

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
        error: "Помилка створення платежу",
      },
      {
        status: 500,
      }
    );
  }
}