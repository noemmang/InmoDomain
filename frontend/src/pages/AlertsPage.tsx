import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { alertsApi } from "../api/endpoints";
import type { Alert, AlertCondition, AlertMetric } from "../api/types";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Field, FormMessage, SelectField } from "../components/Field";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";
import { useAsync } from "../hooks/useAsync";
import { useProvinces } from "../hooks/useProvinces";
import { CONDITION_LABELS, METRIC_LABELS, formatQuarter } from "../utils/format";

interface FormState {
    provinceCode: string;
    metric: AlertMetric;
    condition: AlertCondition;
    threshold: string;
}

const EMPTY_FORM: FormState = { provinceCode: "", metric: "property_score", condition: "mayor_que", threshold: "" };

// Gestión de alertas: crear, editar, activar o pausar y borrar. La evaluación la hace el backend con cada recálculo.
export function AlertsPage() {
    const [params] = useSearchParams();
    const { provinces, byCode } = useProvinces();
    const state = useAsync(alertsApi.list, []);

    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [editing, setEditing] = useState<Alert | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Si se llega desde la ficha de una provincia, el formulario ya viene con esa provincia elegida.
    useEffect(() => {
        const preset = params.get("provincia");
        if (preset) setForm((current) => ({ ...current, provinceCode: preset }));
    }, [params]);

    const alerts = state.data ?? [];

    function startEdit(alert: Alert) {
        setEditing(alert);
        setForm({ provinceCode: alert.provinceCode, metric: alert.metric, condition: alert.condition, threshold: String(alert.threshold) });
        setError(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function resetForm() {
        setEditing(null);
        setForm((current) => ({ ...EMPTY_FORM, provinceCode: editing ? "" : current.provinceCode }));
        setError(null);
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        const threshold = Number(form.threshold.replace(",", "."));
        if (!form.provinceCode || form.threshold.trim() === "" || Number.isNaN(threshold)) {
            setError("Elige una provincia y escribe un umbral numérico.");
            return;
        }

        setSaving(true);
        setError(null);
        const input = { provinceCode: form.provinceCode, metric: form.metric, condition: form.condition, threshold };
        try {
            if (editing) {
                const updated = await alertsApi.update(editing.id, input, editing.active);
                state.setData(alerts.map((alert) => (alert.id === updated.id ? updated : alert)));
            } else {
                const created = await alertsApi.create(input);
                state.setData([created, ...alerts]);
            }
            setEditing(null);
            setForm(EMPTY_FORM);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "No se ha podido guardar la alerta.");
        } finally {
            setSaving(false);
        }
    }

    async function toggleActive(alert: Alert) {
        try {
            const updated = await alertsApi.update(alert.id, alert, !alert.active);
            state.setData(alerts.map((item) => (item.id === updated.id ? updated : item)));
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "No se ha podido actualizar la alerta.");
        }
    }

    async function remove(alert: Alert) {
        try {
            await alertsApi.remove(alert.id);
            state.setData(alerts.filter((item) => item.id !== alert.id));
            if (editing?.id === alert.id) resetForm();
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "No se ha podido borrar la alerta.");
        }
    }

    return (
        <div className="page">
            <header className="page__header">
                <div>
                    <h1 className="page__title">Alertas</h1>
                    <p className="page__subtitle">Cada alerta avisa una sola vez por trimestre cuando se cumple su condición.</p>
                </div>
            </header>

            <Card title={editing ? "Editar alerta" : "Nueva alerta"}>
                <form className="alert-form" onSubmit={handleSubmit}>
                    <SelectField
                        label="Provincia"
                        value={form.provinceCode}
                        placeholder="Elige una provincia"
                        onChange={(provinceCode) => setForm({ ...form, provinceCode })}
                        options={provinces.map((province) => ({ value: province.provinceCode, label: province.name }))}
                    />
                    <SelectField
                        label="Métrica"
                        value={form.metric}
                        onChange={(metric) => setForm({ ...form, metric: metric as AlertMetric })}
                        options={Object.entries(METRIC_LABELS).map(([value, label]) => ({ value, label }))}
                    />
                    <SelectField
                        label="Condición"
                        value={form.condition}
                        onChange={(condition) => setForm({ ...form, condition: condition as AlertCondition })}
                        options={Object.entries(CONDITION_LABELS).map(([value, label]) => ({ value, label }))}
                    />
                    <Field label="Umbral" inputMode="decimal" placeholder="Por ejemplo 70" value={form.threshold} onChange={(event) => setForm({ ...form, threshold: event.target.value })} />
                    <div className="alert-form__actions">
                        <Button type="submit" loading={saving}>{editing ? "Guardar cambios" : "Crear alerta"}</Button>
                        {editing && <Button type="button" variant="secondary" onClick={resetForm}>Cancelar</Button>}
                    </div>
                </form>
                {error && <FormMessage kind="error">{error}</FormMessage>}
            </Card>

            {state.loading && !state.data ? (
                <LoadingState slow={state.slow} label="Cargando tus alertas" />
            ) : state.error ? (
                <ErrorState message={state.error} onRetry={state.reload} />
            ) : alerts.length === 0 ? (
                <EmptyState title="Todavía no tienes alertas" text="Crea la primera con el formulario de arriba." />
            ) : (
                <ul className="list">
                    {alerts.map((alert) => (
                        <li key={alert.id} className={`list__item alert-item${alert.active ? "" : " alert-item--paused"}`}>
                            <div className="alert-item__body">
                                <strong>{byCode.get(alert.provinceCode)?.name ?? alert.provinceCode}</strong>
                                <span>
                                    {METRIC_LABELS[alert.metric]} {CONDITION_LABELS[alert.condition]} {alert.threshold.toLocaleString("es-ES")}
                                </span>
                                <small>
                                    {alert.lastTriggeredPeriod ? `Última vez: ${formatQuarter(alert.lastTriggeredPeriod)}` : "Aún no se ha disparado"}
                                </small>
                            </div>
                            <label className="switch">
                                <input type="checkbox" checked={alert.active} onChange={() => toggleActive(alert)} />
                                <span className="switch__track" />
                                <span className="visually-hidden">{alert.active ? "Pausar alerta" : "Activar alerta"}</span>
                            </label>
                            <button type="button" className="icon-button" aria-label="Editar alerta" onClick={() => startEdit(alert)}><Pencil size={18} /></button>
                            <button type="button" className="icon-button icon-button--danger" aria-label="Borrar alerta" onClick={() => remove(alert)}><Trash2 size={18} /></button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}