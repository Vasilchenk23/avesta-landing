export default function Socials() {
  return (
    <section className="socials">
      <div className="socials__container">
        <span className="socials__label">
          AVESTA
        </span>

        <h2 className="socials__title">
          Приєднуйтесь до нас у соцмережах
        </h2>

        <p className="socials__text">
          Нові курси, заходи, астрологічні матеріали
          та актуальні новини AVESTA.
        </p>

        <div className="socials__links">
          <a
            href="https://t.me/AsrtoAvestaClub"
            className="socials__link"
            target="_blank"
            rel="noopener noreferrer"
          >
            TELEGRAM
          </a>

          <a
            href="https://www.instagram.com/tanya_avesta/"
            className="socials__link"
            target="_blank"
            rel="noopener noreferrer"
          >
            INSTAGRAM
          </a>
        </div>
      </div>
    </section>
  );
}