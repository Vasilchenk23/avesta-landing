export default function ConsultationVideo() {
  return (
    <section className="consultation-video">
      <div className="consultation-video__container">
        <div className="consultation-video__content reveal">
          <p className="consultation-video__label">
            ПРОЦЕС КОНСУЛЬТАЦІЇ
          </p>

          <h2 className="consultation-video__title">
            Як проходить консультація
          </h2>

          <p className="consultation-video__text">
            Живе спілкування, увага до деталей та
            індивідуальний підхід. Під час консультації
            ми розбираємо ваш запит та знаходимо відповіді,
            які допомагають краще зрозуміти себе і ситуацію.
          </p>

        
        </div>

        <div className="consultation-video__media reveal">
          <video
            className="consultation-video__video"
            autoPlay
            muted
            loop
            playsInline
          >
            <source
              src="/videos/consultation.mp4"
              type="video/mp4"
            />
          </video>
        </div>
      </div>
    </section>
  );
}