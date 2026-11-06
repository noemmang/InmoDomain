import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { analyticsApi } from "../api/endpoints";
import type { CompareEntry } from "../api/types";
import { ButtonLink } from "../components/Button";
import { HeroIllustration } from "../components/HeroIllustration";
import { Reveal } from "../components/Reveal";
import { SpainMap, type MapTone } from "../components/SpainMap";
import { useAsync } from "../hooks/useAsync";
import { useLatestPeriod } from "../hooks/useLatestPeriod";
import { useProvinces } from "../hooks/useProvinces";
import { SCORE_NAME } from "../utils/brand";
import { formatIndex, formatQuarter, formatSigned } from "../utils/format";

const FACTS = [
    { value: "52", label: "provincias analizadas" },
    { value: "3", label: "fuentes oficiales: INE, MIVAU e ISTAC" },
    { value: "1 vez/día", label: "revisión de datos nuevos" },
    { value: "0 €", label: "para usar la plataforma" },
];

const STEPS = [
    { title: "Importamos datos oficiales", text: "Compraventas del INE, precios tasados del MIVAU y obra iniciada y terminada del MIVAU a través del ISTAC, siempre desde la fuente oficial." },
    { title: "Calculamos los índices", text: `Cada dato nuevo recalcula percentiles, tendencias y el ${SCORE_NAME} de cada provincia.` },
    { title: "Tú exploras y decides", text: "Compara provincias, guarda favoritas y crea alertas con los umbrales que te interesen." },
];

// Capas del primer mapa: el color de cada provincia depende de su posición (por quintiles) en la métrica.
const LAYERS: { key: string; title: string; text: string; pick: (entry: CompareEntry) => number | null }[] = [
    { key: "score", title: SCORE_NAME, text: "La nota global de 0 a 100 de cada provincia.", pick: (entry) => entry.score },
    { key: "price", title: "Precio", text: "Dónde está el precio por m² respecto a su propia historia.", pick: (entry) => entry.priceIndex },
    { key: "trend", title: "Tendencia", text: "Cuánto ha subido o bajado el precio frente al trimestre anterior.", pick: (entry) => entry.priceTrendIndex },
    { key: "activity", title: "Actividad", text: "Lo movido que está el mercado de compraventas.", pick: (entry) => entry.activityIndex },
];

const QUINTILES: MapTone[] = ["h1", "h2", "h3", "h4", "h5"];
const ROTATE_EVERY_MS = 4200;

// Reparte las provincias en cinco tramos según su posición en la métrica (el más bajo, h1; el más alto, h5).
function quintileTones(entries: CompareEntry[], pick: (entry: CompareEntry) => number | null): Record<string, MapTone> {
    const ranked = entries
        .map((entry) => ({ code: entry.provinceCode, value: pick(entry) }))
        .filter((item): item is { code: string; value: number } => item.value != null)
        .sort((a, b) => a.value - b.value);
    const tones: Record<string, MapTone> = {};
    ranked.forEach((item, index) => {
        tones[item.code] = QUINTILES[Math.min(4, Math.floor((index / ranked.length) * 5))];
    });
    return tones;
}

// Portada: presentación del producto, dos mapas animados con datos reales, funcionamiento y explicación del índice.
export function LandingPage() {
    const provincesState = useProvinces();
    const periodState = useLatestPeriod();
    const codes = provincesState.provinces.map((province) => province.provinceCode);
    const entriesState = useAsync(
        () => (periodState.period && codes.length > 0 ? analyticsApi.compare(codes, periodState.period) : Promise.resolve([] as CompareEntry[])),
        [periodState.period, codes.length],
    );
    const entries = useMemo(() => entriesState.data ?? [], [entriesState.data]);
    const hasData = entries.some((entry) => entry.score != null);

    const [layerIndex, setLayerIndex] = useState(0);
    useEffect(() => {
        if (!hasData || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const timer = window.setInterval(() => setLayerIndex((current) => (current + 1) % LAYERS.length), ROTATE_EVERY_MS);
        return () => window.clearInterval(timer);
    }, [hasData]);

    const layer = LAYERS[layerIndex];
    const layerTones = useMemo(() => quintileTones(entries, layer.pick), [entries, layer]);

    const scored = entries.filter((entry) => entry.score != null);
    const bestScore = [...scored].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
    const average = scored.length ? scored.reduce((sum, entry) => sum + (entry.score ?? 0), 0) / scored.length : null;

    const byTrend = entries.filter((entry) => entry.priceTrendIndex != null).sort((a, b) => (b.priceTrendIndex ?? 0) - (a.priceTrendIndex ?? 0));
    const rising = byTrend.slice(0, 5);
    const falling = byTrend.slice(-5).reverse();
    const extremeTones = useMemo(() => {
        const tones: Record<string, MapTone> = {};
        entries.forEach((entry) => { tones[entry.provinceCode] = "dim"; });
        rising.forEach((entry) => { tones[entry.provinceCode] = "up"; });
        falling.forEach((entry) => { tones[entry.provinceCode] = "down"; });
        return tones;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entriesState.data]);

    const nameOf = (code: string) => provincesState.byCode.get(code)?.name ?? code;
    const quarter = periodState.period ? formatQuarter(periodState.period) : null;

    return (
        <>
            <section className="hero">
                <div className="hero__inner">
                    <div className="hero__copy">
                        <span className="pill">Datos oficiales del INE, el MIVAU y el ISTAC</span>
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

            <section className="section">
                <div className="section__inner map-section">
                    <Reveal>
                        <h2 className="section__title">España, provincia a provincia</h2>
                        <p className="section__lead">
                            Cada provincia se pinta según su dato del último trimestre{quarter ? ` (${quarter})` : ""}. El mapa va
                            rotando entre las cuatro lecturas del mercado.
                        </p>
                        <ol className="layer-list" aria-label="Lecturas del mapa">
                            {LAYERS.map((item, index) => (
                                <li key={item.key} className={`layer-list__item${index === layerIndex ? " layer-list__item--active" : ""}`}>
                                    <strong>{item.title}</strong>
                                    <span>{item.text}</span>
                                </li>
                            ))}
                        </ol>
                        <div className="map-legend" aria-hidden="true">
                            <span>Más bajo</span>
                            <span className="map-legend__scale" />
                            <span>Más alto</span>
                        </div>
                        {hasData && bestScore && (
                            <dl className="map-stats">
                                <div><dt>Media nacional del índice</dt><dd>{formatIndex(average)}</dd></div>
                                <div><dt>Mejor puntuada</dt><dd>{nameOf(bestScore.provinceCode)} · {formatIndex(bestScore.score)}</dd></div>
                            </dl>
                        )}
                        <ButtonLink to="/explorar" variant="secondary">Ver el ranking completo</ButtonLink>
                    </Reveal>
                    <Reveal delay={120}>
                        <div className="map-card">
                            <SpainMap
                                tones={layerTones}
                                pulses={hasData && bestScore ? [bestScore.provinceCode] : []}
                                label={`Mapa de España coloreado por ${layer.title}`}
                            />
                            <span className="map-card__tag">{layer.title}</span>
                        </div>
                    </Reveal>
                </div>
            </section>

            {hasData && rising.length > 0 && (
                <section className="section section--raised">
                    <div className="section__inner map-section map-section--reverse">
                        <Reveal delay={120}>
                            <div className="map-card">
                                <SpainMap tones={extremeTones} pulses={[rising[0].provinceCode, falling[0].provinceCode]} label="Mapa de España con las provincias que más suben y más bajan" />
                            </div>
                        </Reveal>
                        <Reveal>
                            <h2 className="section__title">Quién sube y quién baja</h2>
                            <p className="section__lead">
                                Las cinco provincias cuyo precio más ha subido frente al trimestre anterior y las cinco donde más ha bajado.
                            </p>
                            <div className="movers">
                                <div>
                                    <h3 className="movers__title movers__title--up">Suben</h3>
                                    <ul className="movers__list">
                                        {rising.map((entry) => (
                                            <li key={entry.provinceCode}><span>{nameOf(entry.provinceCode)}</span><strong className="text-positive">{formatSigned(entry.priceTrendIndex)}</strong></li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="movers__title movers__title--down">Bajan</h3>
                                    <ul className="movers__list">
                                        {falling.map((entry) => (
                                            <li key={entry.provinceCode}><span>{nameOf(entry.provinceCode)}</span><strong className="text-negative">{formatSigned(entry.priceTrendIndex)}</strong></li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <ButtonLink to="/comparar" variant="secondary">Compararlas</ButtonLink>
                        </Reveal>
                    </div>
                </section>
            )}

            <section className="section" id="como-funciona">
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

            <section className="section section--raised" id="indice">
                <div className="section__inner score-explainer">
                    <Reveal>
                        <h2 className="section__title">Un solo número, tres miradas</h2>
                        <p className="section__lead">
                            El {SCORE_NAME} es la media simple de tres índices, que pesan lo mismo. Cada uno se expresa como un
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
