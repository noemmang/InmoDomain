import { SCORE_NAME } from "../utils/brand";
import { BellPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { analyticsApi } from "../api/endpoints";
import { ActivityHeatmap } from "../charts/ActivityHeatmap";
import { EvolutionChart, type IndexView, type TrendView } from "../charts/EvolutionChart";
import { PriceChart } from "../charts/PriceChart";
import { SalesChart } from "../charts/SalesChart";
import { ButtonLink } from "../components/Button";
import { Card } from "../components/Card";
import { FavoriteButton } from "../components/FavoriteButton";
import { ScoreRing } from "../components/ScoreRing";
import { SegmentedControl } from "../components/SegmentedControl";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";
import { useAsync } from "../hooks/useAsync";
import { useProvinces } from "../hooks/useProvinces";
import { formatIndex, formatNumber, formatPrice, formatQuarter, formatSigned } from "../utils/format";

// Ficha de una provincia: puntuación actual, índices, evolución, precio, compraventas y mapa de calor.
export function ProvincePage() {
    const { code = "" } = useParams();
    const { byCode, loading: provincesLoading } = useProvinces();
    const [indexView, setIndexView] = useState<IndexView>("historical");
    const [trendView, setTrendView] = useState<TrendView>("quarterly");
    const [customQuarters, setCustomQuarters] = useState(4);

    const province = byCode.get(code);
    const state = useAsync(() => analyticsApi.province(code, customQuarters), [code, customQuarters]);
    const analytics = state.data;

    const latest = useMemo(() => [...(analytics?.history ?? [])].sort((a, b) => a.period.localeCompare(b.period)).at(-1), [analytics]);

    // Precio medio del último periodo publicado (media de las dos antigüedades de vivienda).
    const latestPrice = useMemo(() => {
        const values = analytics?.appraisedValues ?? [];
        const lastPeriod = values.map((value) => value.period).sort().at(-1);
        const prices = values.filter((value) => value.period === lastPeriod).map((value) => value.pricePerSquareMeter);
        return prices.length ? prices.reduce((sum, price) => sum + price, 0) / prices.length : null;
    }, [analytics]);

    if (provincesLoading || (state.loading && !analytics)) {
        return <div className="page"><LoadingState slow={state.slow} label="Cargando la ficha" /></div>;
    }
    if (!province) {
        return <div className="page"><EmptyState title="Provincia no encontrada" text="Comprueba el código o búscala desde el panel." /></div>;
    }
    if (state.error || !analytics) {
        return <div className="page"><ErrorState message={state.error ?? "Sin datos."} onRetry={state.reload} /></div>;
    }

    const priceValue = indexView === "historical" ? latest?.priceIndex : latest?.priceIndexNationalRanking;
    const activityValue = indexView === "historical" ? latest?.activityIndex : latest?.activityIndexNationalRanking;
    const trendValue = trendView === "quarterly" ? latest?.priceTrendIndex : latest?.priceTrendIndexYearOverYear;
    const indexCaption = indexView === "historical" ? "frente a su propia historia" : "frente al resto de provincias";

    return (
        <div className="page">
            <header className="page__header">
                <div>
                    <h1 className="page__title">{province.name}</h1>
                    <p className="page__subtitle">
                        {province.autonomousCommunity} · {formatNumber(province.population)} habitantes
                        {latest && <> · Datos del {formatQuarter(latest.period)}</>}
                    </p>
                </div>
                <div className="page__actions">
                    <FavoriteButton provinceCode={code} withLabel />
                    <ButtonLink to={`/alertas?provincia=${code}`} variant="secondary" small><BellPlus size={16} /> Crear alerta</ButtonLink>
                </div>
            </header>

            <div className="toolbar">
                <SegmentedControl
                    label="Tipo de índice"
                    value={indexView}
                    onChange={setIndexView}
                    options={[{ value: "historical", label: "Percentil histórico" }, { value: "national", label: "Ranking nacional" }]}
                />
                <SegmentedControl
                    label="Tipo de tendencia"
                    value={trendView}
                    onChange={setTrendView}
                    options={[{ value: "quarterly", label: "Trimestral" }, { value: "yearly", label: "Interanual" }]}
                />
            </div>

            {!latest ? (
                <EmptyState title="Sin índices todavía" text="Esta provincia aún no tiene índices calculados." />
            ) : (
                <div className="province-summary">
                    <Card className="province-summary__score">
                        <ScoreRing value={latest.score} label={SCORE_NAME} size={168} />
                    </Card>
                    <Card className="stat">
                        <span className="stat__label">Índice de precio</span>
                        <strong className="stat__value">{formatIndex(priceValue)}</strong>
                        <span className="stat__note">{indexCaption}</span>
                    </Card>
                    <Card className="stat">
                        <span className="stat__label">Tendencia de precio</span>
                        <strong className="stat__value">{formatSigned(trendValue)}</strong>
                        <span className="stat__note">{trendView === "quarterly" ? "frente al trimestre anterior" : "frente al mismo trimestre del año anterior"}</span>
                    </Card>
                    <Card className="stat">
                        <span className="stat__label">Índice de actividad</span>
                        <strong className="stat__value">{formatIndex(activityValue)}</strong>
                        <span className="stat__note">{indexCaption}</span>
                    </Card>
                    <Card className="stat">
                        <span className="stat__label">Precio medio</span>
                        <strong className="stat__value">{formatPrice(latestPrice)}</strong>
                        <span className="stat__note">último dato del MIVAU</span>
                    </Card>
                </div>
            )}

            <Card
                title="Evolución de los índices"
                action={
                    <SegmentedControl
                        label="Trimestres para la tendencia personalizada"
                        value={customQuarters}
                        onChange={setCustomQuarters}
                        options={[{ value: 2, label: "2T" }, { value: 4, label: "4T" }, { value: 8, label: "8T" }]}
                    />
                }
            >
                {analytics.history.length > 0 ? (
                    <EvolutionChart history={analytics.history} indexView={indexView} trendView={trendView} />
                ) : (
                    <EmptyState title="Sin histórico" text="Aún no hay trimestres calculados para esta provincia." />
                )}
                {analytics.customTrend && (
                    <p className="chart__note">
                        Variación del índice de precio en los últimos {analytics.customTrend.trendQuarters} trimestres:{" "}
                        {analytics.customTrend.hasSufficientData ? (
                            <strong>{formatSigned(analytics.customTrend.value)} puntos</strong>
                        ) : (
                            <strong>sin datos suficientes</strong>
                        )}
                    </p>
                )}
            </Card>

            <div className="grid-two grid-two--even">
                <Card title="Precio medio por m²">
                    {analytics.appraisedValues.length > 0 ? <PriceChart values={analytics.appraisedValues} /> : <EmptyState title="Sin precios" text="El MIVAU no ha publicado datos para esta provincia." />}
                </Card>
                <Card title="Compraventas mensuales">
                    {analytics.propertySales.length > 0 ? <SalesChart sales={analytics.propertySales} /> : <EmptyState title="Sin compraventas" text="El INE no ha publicado datos para esta provincia." />}
                </Card>
            </div>

            {analytics.propertySales.length > 0 && (
                <Card title="Actividad por año y mes">
                    <ActivityHeatmap sales={analytics.propertySales} />
                </Card>
            )}
        </div>
    );
}