import { services } from "@/data/services";

export default function Services() {
  return (
    <section className="services" id="services">
      <div className="services__container">

        <div className="services__heading reveal">
          <span className="services__label">ПОСЛУГИ</span>

          <h2 className="services__title">
            Чим я можу Вам допомогти?
          </h2>

          <p className="services__intro">
            Оберіть напрямок, який найбільше відповідає Вашому запиту.
          </p>
        </div>

        <div className="services__grid">
          {services.map((service) => (
            <article className="service-card reveal" key={service.id}>
              
              <div className="service-card__image">
  <img
    src={service.image}
    alt={service.title}
  />
</div>

              <h3 className="service-card__title">
                {service.title}
              </h3>

              <p className="service-card__description">
                {service.description}
              </p>

              <a
                href="#contact"
                className="service-card__button"
              >
                ПОДРОБИЦІ
              </a>

            </article>
          ))}
        </div>

      </div>
    </section>
  );
}