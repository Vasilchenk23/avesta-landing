"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PaymentState =
  | "checking"
  | "success"
  | "failure"
  | "unknown";

export default function PaymentResultPage() {
  const [paymentState, setPaymentState] =
    useState<PaymentState>("checking");

  useEffect(() => {
    const invoiceId = localStorage.getItem(
      "avestaInvoiceId"
    );

    if (!invoiceId) {
      setPaymentState("unknown");
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    async function checkPayment(attempt = 0) {
      try {
        const response = await fetch(
          `/api/payment/status?invoiceId=${encodeURIComponent(
            invoiceId!
          )}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Не вдалося перевірити статус платежу"
          );
        }

        const data = await response.json();

        if (cancelled) return;

        if (data.status === "success") {
          setPaymentState("success");

          localStorage.removeItem(
            "avestaInvoiceId"
          );

          return;
        }

        if (data.status === "failure") {
          setPaymentState("failure");
          return;
        }

        // Якщо mono ще обробляє платіж,
        // перевіряємо повторно через 2 секунди.
        if (attempt < 5) {
          timeoutId = setTimeout(() => {
            checkPayment(attempt + 1);
          }, 2000);

          return;
        }

        setPaymentState("unknown");
      } catch (error) {
        console.error(
          "Payment status error:",
          error
        );

        if (!cancelled) {
          setPaymentState("unknown");
        }
      }
    }

    checkPayment();

    return () => {
      cancelled = true;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <main className="payment-result">
      <div className="payment-result__content">
        <span className="payment-result__label">
          AVESTA
        </span>

        {paymentState === "checking" && (
          <>
            <h1 className="payment-result__title">
              Перевіряємо оплату
            </h1>

            <p className="payment-result__text">
              Зачекайте декілька секунд. Ми перевіряємо
              статус вашого платежу.
            </p>

            <div className="payment-result__loader" />
          </>
        )}

        {paymentState === "success" && (
          <>
            <h1 className="payment-result__title">
              Дякуємо!
            </h1>

            <p className="payment-result__text">
              Оплату успішно завершено.
              Дякуємо за придбання курсу AVESTA.
            </p>

            <Contacts />

            <Link
              href="/#hero"
              className="payment-result__button"
            >
              ПОВЕРНУТИСЯ НА ГОЛОВНУ
            </Link>
          </>
        )}

        {paymentState === "failure" && (
          <>
            <h1 className="payment-result__title">
              Оплату не завершено
            </h1>

            <p className="payment-result__text">
              Під час оплати виникла помилка або
              платіж було скасовано.
            </p>

            <Contacts />

            <Link
              href="/#courses"
              className="payment-result__button"
            >
              СПРОБУВАТИ ЩЕ РАЗ
            </Link>

            <Link
              href="/#hero"
              className="payment-result__home-link"
            >
              Повернутися на головну
            </Link>
          </>
        )}

        {paymentState === "unknown" && (
          <>
            <h1 className="payment-result__title">
              Перевіряємо платіж
            </h1>

            <p className="payment-result__text">
              Нам не вдалося автоматично підтвердити
              статус оплати. Якщо кошти були списані,
              не здійснюйте повторну оплату.
            </p>

            <Contacts />

            <Link
              href="/#hero"
              className="payment-result__button"
            >
              ПОВЕРНУТИСЯ НА ГОЛОВНУ
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

function Contacts() {
  return (
    <div className="payment-result__contacts">
      <p>
        Якщо у вас виникли питання,
        зв&apos;яжіться з нами:
      </p>

      <div className="payment-result__contact-links">
        <a
          href="https://t.me/ТВОЙ_TELEGRAM"
          target="_blank"
          rel="noopener noreferrer"
        >
          TELEGRAM
        </a>

        <a
          href="https://instagram.com/ТВОЙ_INSTAGRAM"
          target="_blank"
          rel="noopener noreferrer"
        >
          INSTAGRAM
        </a>
      </div>
    </div>
  );
}