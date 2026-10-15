"use client";

import { FormEvent, useState } from "react";
import { courses } from "@/data/courses";

type CustomerForm = {
  name: string;
  phone: string;
  telegram: string;
  email: string;
};

export default function Courses() {
  const [selectedCourseId, setSelectedCourseId] =
    useState<number | null>(null);

  const [loadingId, setLoadingId] =
    useState<number | null>(null);

  const [paymentError, setPaymentError] =
    useState("");

  const [customer, setCustomer] =
    useState<CustomerForm>({
      name: "",
      phone: "",
      telegram: "",
      email: "",
    });

  const selectedCourse = courses.find(
    (course) => course.id === selectedCourseId
  );

  function openPaymentForm(courseId: number) {
    setPaymentError("");
    setSelectedCourseId(courseId);
  }

  function closePaymentForm() {
    if (loadingId !== null) return;

    setSelectedCourseId(null);
    setPaymentError("");
  }

  async function handleBuy(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedCourseId) return;

    const name = customer.name.trim();
    const phone = customer.phone.trim();
    const telegram = customer.telegram.trim();
    const email = customer.email.trim();

    if (!name || !phone || !telegram || !email) {
      setPaymentError(
        "Будь ласка, заповніть усі поля."
      );
      return;
    }

    if (
      !telegram.startsWith("@") ||
      telegram.length < 2
    ) {
      setPaymentError(
        "Вкажіть Telegram нікнейм у форматі @username."
      );
      return;
    }

    try {
      setLoadingId(selectedCourseId);
      setPaymentError("");

      const response = await fetch(
        "/api/payment/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseId: selectedCourseId,
            customer: {
              name,
              phone,
              telegram,
              email,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Не вдалося створити платіж"
        );
      }

      if (!data.pageUrl) {
        throw new Error(
          "Не отримано посилання на оплату"
        );
      }

      if (!data.invoiceId) {
        throw new Error(
          "Не отримано номер платежу"
        );
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
    <>
      <section
        className="courses"
        id="courses"
      >
        <div className="courses__container">
          <div className="courses__heading">
            <span className="courses__label">
              КУРСИ
            </span>

            <h2 className="courses__title">
              Ознайомитись з курсами
            </h2>

            <p className="courses__intro">
              Формати: онлайн, офлайн, запис.
              Індивідуально або у групі.
            </p>
          </div>

          <div className="courses__grid">
            {courses.map((course) => (
              <article
                className="course-card"
                key={course.id}
              >
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
                  {course.features.map(
                    (feature) => (
                      <li key={feature}>
                        {feature}
                      </li>
                    )
                  )}
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
                    onClick={() =>
                      openPaymentForm(course.id)
                    }
                  >
                    ПРИДБАТИ
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {selectedCourse && (
        <div
          className="payment-modal"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closePaymentForm();
            }
          }}
        >
          <div className="payment-modal__card">
            <button
              type="button"
              className="payment-modal__close"
              onClick={closePaymentForm}
              aria-label="Закрити"
            >
              ×
            </button>

            <span className="payment-modal__label">
              ОФОРМЛЕННЯ ЗАМОВЛЕННЯ
            </span>

            <h3 className="payment-modal__title">
              {selectedCourse.title}
            </h3>

            <p className="payment-modal__price">
              {selectedCourse.price}
            </p>

            <p className="payment-modal__text">
              Вкажіть контактні дані. Після
              успішної оплати ми зв&apos;яжемося
              з вами для надання доступу до курсу.
            </p>

            <form
              className="payment-modal__form"
              onSubmit={handleBuy}
            >
              <label className="payment-modal__field">
                <span>Ім&apos;я *</span>

                <input
                  type="text"
                  value={customer.name}
                  onChange={(event) =>
                    setCustomer({
                      ...customer,
                      name: event.target.value,
                    })
                  }
                  placeholder="Ваше ім'я"
                  autoComplete="name"
                  required
                />
              </label>

              <label className="payment-modal__field">
                <span>Номер телефону *</span>

                <input
                  type="tel"
                  value={customer.phone}
                  onChange={(event) =>
                    setCustomer({
                      ...customer,
                      phone: event.target.value,
                    })
                  }
                  placeholder="+380 XX XXX XX XX"
                  autoComplete="tel"
                  required
                />
              </label>

              <label className="payment-modal__field">
                <span>
                  Telegram нікнейм *
                </span>

                <input
                  type="text"
                  value={customer.telegram}
                  onChange={(event) =>
                    setCustomer({
                      ...customer,
                      telegram:
                        event.target.value,
                    })
                  }
                  placeholder="@username"
                  required
                />
              </label>

              <label className="payment-modal__field">
                <span>Email *</span>

                <input
                  type="email"
                  value={customer.email}
                  onChange={(event) =>
                    setCustomer({
                      ...customer,
                      email: event.target.value,
                    })
                  }
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                />
              </label>

              {paymentError && (
                <p className="payment-modal__error">
                  {paymentError}
                </p>
              )}

              <button
                type="submit"
                className="payment-modal__submit"
                disabled={loadingId !== null}
              >
                {loadingId !== null
                  ? "ЗАВАНТАЖЕННЯ..."
                  : "ПЕРЕЙТИ ДО ОПЛАТИ"}
              </button>

              <p className="payment-modal__note">
                Після натискання ви перейдете на
                захищену сторінку оплати.
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}