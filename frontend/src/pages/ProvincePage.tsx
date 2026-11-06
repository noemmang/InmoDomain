import { SCORE_NAME } from "../utils/brand";
import { BellPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { analyticsApi } from "../api/endpoints";
import type { ConstructionPhase } from "../api/types";
import { ActivityHeatmap } from "../charts/ActivityHeatmap";
import { ConstructionChart } from "../charts/ConstructionChart";
import { EvolutionChart, type IndexView, type TrendView } from "../charts/EvolutionChart";
import { PriceChart } from "../charts/PriceChart";
import { SalesChart } from "../charts/SalesChart";
import { SupplyDemandChart } from "../charts/SupplyDemandChart";
import { ButtonLink } from "../components/Button";
import { Card } from "../components/Card";
import { FavoriteButton } from "../components/FavoriteButton";
import { ProvinceSilhouette } from "../components/ProvinceSilhouette";
import { ScoreRing } from "../components/ScoreRing";
import { SegmentedControl } from "../components/SegmentedControl";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";
import { useAsync } from "../hooks/useAsync";
import { useProvinces } from "../hooks/useProvinces";
import { formatDecimal, formatIndex, formatMonth, formatNumber, formatPercent, formatPrice, formatQuarter, formatSigned } from "../utils/format";
import { buildSeries, computeRow, latestConstructionQuarter } from "../utils/market";

// Ficha de una provincia: puntuación actual, índices, evolución, precio, compraventas, obra y mapa de calor.
export function ProvincePage() {
    const { code = "" } = useParams();
    const { byCode, loading: provincesLoading } = useProvinces();
    const [indexView, setIndexView] = useState<IndexView>("historical");
    const [trendView, setTrendView] = useState<TrendView>("quarterly");
    const [customQuarters, setCustomQuarters] = useState(4);
    const [phase, setPhase] = useState<ConstructionPhase>("iniciada");

    const province = byCode.get(code);
    const state = useAsync(() => analyticsApi.province(code, customQuarters), [code, customQuarters]);
    const analytics = state.data;

    // Último trimestre con Índice calculado: el trimestre en curso solo trae la actividad del INE hasta que el MIVAU publica el precio.
    const latest = useMemo(() => {
        const history = [...(analytics?.history ?? [])].sort((a, b) => a.period.localeCompare(b.period));
        return history.filter((row) => row.score != null).at(-1) ?? history.at(-1);
    }, [analytics]);

    // Precio medio del último periodo publicado (media de las dos antigüedades de vivienda).
    const latestPrice = useMemo(() => {
        const values = analytics?.appraisedValues ?? [];
        const lastPeriod = values.map((value) => value.period).sort().at(-1);
        const prices = values.filter((value) => value.period === lastPeriod).map((value) => value.pricePerSquareMeter);
        return prices.length ? prices.reduce((sum, price) => sum + price, 0) / prices.length : null;
    }, [analytics]);

    // Obra del último trimestre con dato, con su cociente frente a las compraventas del mismo trimestre.
    const construction = useMemo(() => {
        if (!province || !analytics) return null;
        const series = buildSeries(province, analytics);
        const period = latestConstructionQuarter(series);
        return period ? { period, row: computeRow(series, period) } : null;
    }, [province, analytics]);

    // Primer mes con cifra provisional: a partir de él el ISTAC puede revisar los datos.
    const provisionalSince = useMemo(
        () => (analytics?.construction ?? []).filter((record) => record.isProvisional).map((record) => record.period).sort().at(0),
        [analytics],
    );

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
                <div className="page__identity">
                    <ProvinceSilhouette code={code} name={province.name} />
                    <div>
                        <h1 className="page__title">{province.name}</h1>
                        <p className="page__subtitle">
                            {province.autonomousCommunity} · {formatNumber(province.population)} habitantes
                            {latest && <> · Datos del {formatQuarter(latest.period)}</>}
                        </p>
                    </div>
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

            <h2 className="page__section-title">{construction ? `Obra de vivienda · ${formatQuarter(construction.period)}` : "Obra de vivienda"}</h2>
            {construction ? (
                <div className="stat-grid stat-grid--four">
                    <Card className="stat">
                        <span className="stat__label">Viviendas iniciadas</span>
                        <strong className="stat__value">{construction.row.started == null ? "—" : formatNumber(construction.row.started)}</strong>
                        <span className="stat__note">
                            {formatDecimal(construction.row.startedRate)} por 10.000 hab.
                            {construction.row.startedChange != null ? ` · ${formatPercent(construction.row.startedChange, true)} anual` : ""}
                        </span>
                    </Card>
                    <Card className="stat">
                        <span className="stat__label">Obra protegida</span>
                        <strong className="stat__value">{formatPercent(construction.row.protectedShare)}</strong>
                        <span className="stat__note">
                            {construction.row.startedProtected == null ? "sin dato" : `${formatNumber(construction.row.startedProtected)} viviendas protegidas iniciadas`}
                        </span>
                    </Card>
                    <Card className="stat">
                        <span className="stat__label">Viviendas terminadas</span>
                        <strong className="stat__value">{construction.row.completed == null ? "—" : formatNumber(construction.row.completed)}</strong>
                        <span className="stat__note">{formatDecimal(construction.row.completedRate)} por 10.000 hab.</span>
                    </Card>
                    <Card className="stat">
                        <span className="stat__label">Obra frente a demanda</span>
                        <strong className="stat__value">{construction.row.supplyRatio == null ? "—" : `${formatDecimal(construction.row.supplyRatio, 0)} por 100`}</strong>
                        <span className="stat__note">viviendas iniciadas por cada 100 compraventas</span>
                    </Card>
                </div>
            ) : (
                <Card><EmptyState title="Sin obra" text="El ISTAC no ha publicado datos de construcción para esta provincia." /></Card>
            )}

            {(analytics.construction ?? []).length > 0 && (
                <div className="grid-two grid-two--even">
                    <Card
                        title={`Viviendas ${phase === "iniciada" ? "iniciadas" : "terminadas"} por mes`}
                        action={
                            <SegmentedControl
                                label="Fase de la obra"
                                value={phase}
                                onChange={setPhase}
                                options={[{ value: "iniciada", label: "Iniciadas" }, { value: "terminada", label: "Terminadas" }]}
                            />
                        }
                    >
                        <ConstructionChart records={analytics.construction} phase={phase} />
                        <p className="chart__note">
                            Libre es una estimación; protegida son calificaciones (provisional = iniciada, definitiva = terminada).
                            {provisionalSince && <> Cifras provisionales desde {formatMonth(provisionalSince)}.</>}
                        </p>
                    </Card>
                    <Card title="Obra frente a compraventas">
                        <SupplyDemandChart records={analytics.construction} sales={analytics.propertySales} />
                        <p className="chart__note">Totales trimestrales: compraventas del INE frente a viviendas iniciadas y terminadas (MIVAU, vía ISTAC).</p>
                    </Card>
                </div>
            )}

            {analytics.propertySales.length > 0 && (
                <Card title="Actividad por año y mes">
                    <ActivityHeatmap sales={analytics.propertySales} />
                </Card>
            )}
        </div>
    );
}