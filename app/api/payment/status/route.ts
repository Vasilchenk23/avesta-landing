import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoiceId");

    if (!invoiceId) {
      return NextResponse.json(
        { error: "invoiceId is required" },
        { status: 400 }
      );
    }

    const token = process.env.MONO_TOKEN;

    if (!token) {
      console.error("MONO_TOKEN is missing");

      return NextResponse.json(
        { error: "Платіжна система не налаштована" },
        { status: 500 }
      );
    }

    const monoResponse = await fetch(
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

    const data = await monoResponse.json();

    if (!monoResponse.ok) {
      console.error("Monobank status error:", data);

      return NextResponse.json(
        { error: "Не вдалося перевірити статус оплати" },
        { status: monoResponse.status }
      );
    }

    return NextResponse.json({
      invoiceId: data.invoiceId,
      status: data.status,
      amount: data.amount,
      ccy: data.ccy,
      failureReason: data.failureReason ?? null,
    });
  } catch (error) {
    console.error("Payment status error:", error);

    return NextResponse.json(
      { error: "Помилка перевірки статусу оплати" },
      { status: 500 }
    );
  }
}