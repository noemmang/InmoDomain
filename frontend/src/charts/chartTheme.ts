// Colores y estilos compartidos por todos los gráficos; salen de las variables CSS de styles.css.
export const CHART_COLORS = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
];

export const axisProps = {
    stroke: "var(--color-text-muted)",
    tick: { fill: "var(--color-text-muted)", fontSize: 12 },
    tickLine: false,
    axisLine: false,
} as const;

export const gridProps = { stroke: "var(--color-surface-hover)", strokeDasharray: "4 6", vertical: false } as const;

export const tooltipProps = {
    contentStyle: {
        background: "var(--color-surface-raised)",
        border: "none",
        borderRadius: "var(--radius-md)",
        color: "var(--color-text)",
        boxShadow: "var(--shadow-popover)",
    },
    labelStyle: { color: "var(--color-text-muted)", marginBottom: 4 },
    itemStyle: { color: "var(--color-text)" },
    cursor: { fill: "var(--color-surface-hover)", opacity: 0.5 },
} as const;