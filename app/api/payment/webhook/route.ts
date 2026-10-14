import { NextResponse } from "next/server";
import crypto from "crypto";

let cachedPublicKey: string | null = null;

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

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-sign");

    if (!signature) {
      console.error("MONO WEBHOOK: x-sign is missing");

      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // ВАЖНО:
    // сначала получаем исходное тело запроса как текст
    const rawBody = await request.text();

    let publicKey = await getMonoPublicKey();

    let isValid = verifyMonoSignature(
      rawBody,
      signature,
      publicKey
    );

    // Если ключ у mono изменился —
    // получаем новый и пробуем ещё раз
    if (!isValid) {
      publicKey = await getMonoPublicKey(true);

      isValid = verifyMonoSignature(
        rawBody,
        signature,
        publicKey
      );
    }

    if (!isValid) {
      console.error("MONO WEBHOOK: invalid signature");

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
      modifiedDate: body.modifiedDate,
    });

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("Webhook error:", error);

    return NextResponse.json(
      { error: "Webhook error" },
      { status: 400 }
    );
  }
}