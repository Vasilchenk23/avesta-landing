export default function About() {
  return (
    <section id="about" className="about">
      <div className="about__container">
        <div className="about__content reveal">
          <p className="about__label">Про мене</p>

          <h2 className="about__title">
            Тетяна Семенова
          </h2>

          <p className="about__text">
            Практикуючий астролог із багаторічним досвідом.
            Допомагаю краще зрозуміти себе, свої можливості,
            життєві періоди та напрямки розвитку.
          </p>

          <p className="about__text">
            У своїй роботі поєдную знання астрології,
            практичний досвід та індивідуальний підхід
            до кожної людини.
          </p>

        </div>

        <div className="about__image reveal">
  <img
    src="/images/about.jpg"
    alt="Тетяна Семенова"
    className="about__photo"
  />
</div>
      </div>
    </section>
  );
}
