import Link from "next/link";

export default function PaymentErrorPage() {
  return (
    <main className="payment-result">
      <div className="payment-result__content">

        <span className="payment-result__label">
          AVESTA
        </span>

        <h1 className="payment-result__title">
          Оплату не завершено
        </h1>

        <p className="payment-result__text">
          Під час оплати виникла помилка або платіж було скасовано.
          Ви можете спробувати ще раз.
        </p>

        <div className="payment-result__contacts">
          <p>
            Якщо вам потрібна допомога, зв&apos;яжіться з нами:
          </p>

          <div className="payment-result__contact-links">
            <a
              href="https://t.me/AsrtoAvestaClub"
              target="_blank"
              rel="noopener noreferrer"
            >
              TELEGRAM
            </a>

            <a
              href="https://instagram.com/tanya_avesta?xtok=MTVjeXdvenpjNzN2Yw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
            >
              INSTAGRAM
            </a>
          </div>
        </div>

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

      </div>
    </main>
  );
}