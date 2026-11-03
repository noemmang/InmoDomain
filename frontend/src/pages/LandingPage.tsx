import { ArrowRight, Bell, BellRing, GitCompareArrows, LineChart, Star, Target } from "lucide-react";
import { ButtonLink } from "../components/Button";
import { HeroIllustration } from "../components/HeroIllustration";
import { Reveal } from "../components/Reveal";

const FACTS = [
    { value: "52", label: "provincias analizadas" },
    { value: "2", label: "fuentes oficiales: INE y MIVAU" },
    { value: "1 vez/día", label: "revisión de datos nuevos" },
    { value: "0 €", label: "para usar la plataforma" },
];

const FEATURES = [
    { icon: <Target size={22} />, title: "Property Score", text: "Una puntuación de 0 a 100 que resume precio, tendencia y actividad de cada provincia." },
    { icon: <LineChart size={22} />, title: "Evolución trimestral", text: "Gráficos de precio por m², compraventas y mapa de calor para ver cómo se mueve el mercado." },
    { icon: <GitCompareArrows size={22} />, title: "Comparador", text: "Pon hasta cuatro provincias frente a frente y descubre dónde está cada una." },
    { icon: <Star size={22} />, title: "Favoritos", text: "Guarda las provincias que sigues y accede a ellas desde tu panel." },
    { icon: <BellRing size={22} />, title: "Alertas", text: "Define un umbral para cualquier métrica y la plataforma vigila el dato por ti." },
    { icon: <Bell size={22} />, title: "Avisos", text: "Cuando una alerta se cumple, te aparece una notificación dentro de la aplicación." },
];

const STEPS = [
    { title: "Importamos datos oficiales", text: "Compraventas del INE y precios tasados del MIVAU, siempre desde la fuente original." },
    { title: "Calculamos los índices", text: "Cada dato nuevo recalcula percentiles, tendencias y el Property Score de cada provincia." },
    { title: "Tú exploras y decides", text: "Compara provincias, guarda favoritas y crea alertas con los umbrales que te interesen." },
];

// Portada: presentación del producto con ilustración animada, funciones, funcionamiento y explicación del score.
export function LandingPage() {
    return (
        <>
            <section className="hero">
                <div className="hero__inner">
                    <div className="hero__copy">
                        <span className="pill">Datos oficiales del INE y el MIVAU</span>
                        <h1 className="hero__title">Entiende el mercado inmobiliario de cada provincia</h1>
                        <p className="hero__text">
                            InmoDomain convierte estadísticas oficiales en índices claros: precio, tendencia y actividad. Explora,
                            compara y recibe avisos cuando el mercado cambie.
                        </p>
                        <div className="hero__actions">
                            <ButtonLink to="/explorar">Explorar el mercado <ArrowRight size={18} /></ButtonLink>
                            <ButtonLink to="/registro" variant="secondary">Crear cuenta gratis</ButtonLink>
                        </div>
                    </div>
                    <HeroIllustration />
                </div>
            </section>

            <section className="facts" aria-label="Datos clave">
                <div className="facts__inner">
                    {FACTS.map((fact, index) => (
                        <Reveal key={fact.label} delay={index * 70} className="facts__item">
                            <strong className="facts__value">{fact.value}</strong>
                            <span className="facts__label">{fact.label}</span>
                        </Reveal>
                    ))}
                </div>
            </section>

            <section className="section" id="funciones">
                <div className="section__inner">
                    <Reveal>
                        <h2 className="section__title">Todo lo que necesitas para seguir el mercado</h2>
                        <p className="section__lead">Un panel pensado para pasar de los datos en bruto a decisiones con criterio.</p>
                    </Reveal>
                    <div className="feature-grid">
                        {FEATURES.map((feature, index) => (
                            <Reveal key={feature.title} delay={index * 60}>
                                <article className="feature-card">
                                    <span className="feature-card__icon">{feature.icon}</span>
                                    <h3 className="feature-card__title">{feature.title}</h3>
                                    <p className="feature-card__text">{feature.text}</p>
                                </article>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section section--raised" id="como-funciona">
                <div className="section__inner">
                    <Reveal>
                        <h2 className="section__title">Cómo funciona</h2>
                    </Reveal>
                    <ol className="steps">
                        {STEPS.map((step, index) => (
                            <Reveal key={step.title} delay={index * 90}>
                                <li className="steps__item">
                                    <span className="steps__number">{index + 1}</span>
                                    <h3 className="steps__title">{step.title}</h3>
                                    <p className="steps__text">{step.text}</p>
                                </li>
                            </Reveal>
                        ))}
                    </ol>
                </div>
            </section>

            <section className="section" id="score">
                <div className="section__inner score-explainer">
                    <Reveal>
                        <h2 className="section__title">Un solo número, tres miradas</h2>
                        <p className="section__lead">
                            El Property Score es la media simple de tres índices, que pesan lo mismo. Cada uno se expresa como un
                            percentil de 0 a 100: la provincia comparada con su propia historia o con el resto de España.
                        </p>
                        <ButtonLink to="/explorar" variant="secondary">Ver el ranking actual</ButtonLink>
                    </Reveal>
                    <Reveal delay={120}>
                        <div className="score-parts">
                            <div className="score-parts__bar">
                                <span className="score-parts__segment score-parts__segment--price" />
                                <span className="score-parts__segment score-parts__segment--trend" />
                                <span className="score-parts__segment score-parts__segment--activity" />
                            </div>
                            <ul className="score-parts__list">
                                <li><span className="chart__swatch score-parts__dot--price" /><strong>Precio</strong> Dónde está el precio por m² respecto a su historia.</li>
                                <li><span className="chart__swatch score-parts__dot--trend" /><strong>Tendencia</strong> Cuánto ha subido o bajado frente al trimestre anterior.</li>
                                <li><span className="chart__swatch score-parts__dot--activity" /><strong>Actividad</strong> Qué tan movido está el mercado de compraventas.</li>
                            </ul>
                        </div>
                    </Reveal>
                </div>
            </section>

            <section className="section">
                <Reveal className="cta">
                    <h2 className="cta__title">Empieza a seguir tu mercado hoy</h2>
                    <p className="cta__text">Crear una cuenta es gratis y solo lleva un minuto.</p>
                    <ButtonLink to="/registro">Crear cuenta gratis</ButtonLink>
                </Reveal>
            </section>
        </>
    );
}