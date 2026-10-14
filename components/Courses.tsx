"use client";

import { useState } from "react";
import { courses } from "@/data/courses";

export default function Courses() {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [paymentError, setPaymentError] = useState("");

  async function handleBuy(courseId: number) {
    try {
      setLoadingId(courseId);
      setPaymentError("");

      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Не вдалося створити платіж");
      }

      if (!data.pageUrl) {
  throw new Error("Не отримано посилання на оплату");
}

if (!data.invoiceId) {
  throw new Error("Не отримано номер платежу");
}

localStorage.setItem(
  "avestaInvoiceId",
  data.invoiceId
);

window.location.href = data.pageUrl;

    } catch (error) {
      console.error("Payment error:", error);

      setPaymentError(
        "Не вдалося перейти до оплати. Спробуйте ще раз."
      );
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section className="courses" id="courses">
      <div className="courses__container">

        <div className="courses__heading">
          <span className="courses__label">КУРСИ</span>

          <h2 className="courses__title">
            Ознайомитись з курсами
          </h2>

          <p className="courses__intro">
            Формати: онлайн, офлайн, запис. Індивідуально або у групі.
          </p>
        </div>

        <div className="courses__grid">
          {courses.map((course) => (
            <article className="course-card" key={course.id}>

              <span className="course-card__label">
                — КУРС —
              </span>

              <h3 className="course-card__title">
                {course.title}
              </h3>

              <p className="course-card__description">
                {course.description}
              </p>

              <div className="course-card__price">
                {course.price}
              </div>

              <ul className="course-card__features">
                {course.features.map((feature) => (
                  <li key={feature}>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="course-card__actions">
                <a
                  href="#contact"
                  className="course-card__button course-card__button--secondary"
                >
                  ПОСТАВИТИ ЗАПИТАННЯ
                </a>

                <button
                  type="button"
                  className="course-card__button course-card__button--primary"
                  onClick={() => handleBuy(course.id)}
                  disabled={loadingId !== null}
                >
                  {loadingId === course.id
                    ? "ЗАВАНТАЖЕННЯ..."
                    : "ПРИДБАТИ"}
                </button>
              </div>

            </article>
          ))}
        </div>

        {paymentError && (
          <p className="courses__payment-error">
            {paymentError}
          </p>
        )}

      </div>
    </section>
  );
}