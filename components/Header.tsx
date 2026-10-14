export default function Header() {
  return (
    <header className="header">
      <div className="header__container">

        <a href="#hero" className="header__logo">
          AVESTA
        </a>

        <nav className="header__nav">
          <a href="#about" className="header__about-link">
            Про мене
          </a>

          <a href="#services">Послуги</a>
          <a href="#courses">Курси</a>
          <a href="#consultations">Консультації</a>
          <a href="#contact">Контакти</a>
        </nav>

        <a href="#contact" className="header__button">
          ЗАПИСАТИСЯ
        </a>

      </div>
    </header>
  );
}