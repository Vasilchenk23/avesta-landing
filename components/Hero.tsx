export default function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero__overlay" />

      <div className="hero__content">
        <div className="hero__intro">
     <p className="hero__subtitle">
    Центр розвитку «Avesta»
  </p>

  <p className="hero__author">
    Тетяна Семенова
  </p>
</div>

<h1 className="hero__title">
  <span>АСТРОЛОГІЯ • КОНСУЛЬТАЦІЇ</span>
  <span>• КУРСИ • СУПРОВІД • ВИЇЗНІ ТРЕНІНГИ</span>
</h1>

<p className="hero__experience">
  досвід консультацій та навчання більше 15 років
</p>
        


        <div className="hero__actions">
          <a href="#consultations" className="hero__button hero__button--primary">
            ЗАПИСАТИСЯ НА КОНСУЛЬТАЦІЮ
          </a>

          <a href="#courses" className="hero__button hero__button--secondary">
            ПЕРЕГЛЯНУТИ КУРСИ
          </a>
        </div>
      </div>
    </section>
  );
}