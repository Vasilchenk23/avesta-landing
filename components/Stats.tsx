"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  {
    value: 15,
    suffix: "+",
    text: "років досвіду",
  },
  {
    value: 3000,
    suffix: "+",
    text: "консультацій",
  },
  {
    value: 200,
    suffix: "+",
    text: "учнів по всьому світу",
  },
];

export default function Stats() {
  const sectionRef = useRef<HTMLElement | null>(null);

  const [values, setValues] = useState(
    stats.map(() => 0)
  );

  const [hasAnimated, setHasAnimated] =
    useState(false);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      {
        threshold: 0.35,
      }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) return;

    // Длительность всей анимации — 5 секунд
    const duration = 3500;

    const startTime = performance.now();

    let animationFrame: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;

      // Равномерный прогресс от 0 до 1
      const progress = Math.min(
        elapsed / duration,
        1
      );

      const newValues = stats.map((stat) =>
        Math.round(stat.value * progress)
      );

      setValues(newValues);

      if (progress < 1) {
        animationFrame =
          requestAnimationFrame(animate);
      }
    };

    animationFrame =
      requestAnimationFrame(animate);

    return () =>
      cancelAnimationFrame(animationFrame);
  }, [hasAnimated]);

  return (
    <section
      className="stats"
      ref={sectionRef}
    >
      <div className="stats__container">
        {stats.map((stat, index) => (
          <div
            className="stats__item"
            key={stat.text}
          >
            <strong className="stats__number">
              {values[index]}
              {stat.suffix}
            </strong>

            <span className="stats__text">
              {stat.text}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}