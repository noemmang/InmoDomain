import { Bell, BellRing, Check, CheckCheck, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { notificationsApi } from "../api/endpoints";
import type { AppNotification } from "../api/types";
import { Button } from "../components/Button";
import { SegmentedControl } from "../components/SegmentedControl";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";
import { useNotifications } from "../context/NotificationsContext";
import { useAsync } from "../hooks/useAsync";
import { formatDateTime } from "../utils/format";

// Icono según el tipo de aviso.
function iconFor(type: string) {
    if (type === "alerta") return <BellRing size={20} />;
    if (type === "contrasena_cambiada") return <ShieldCheck size={20} />;
    return <Bell size={20} />;
}

// Bandeja de avisos: marcar como leído, marcar todos y ocultar.
export function NotificationsPage() {
    const { setUnreadCount } = useNotifications();
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const state = useAsync(() => notificationsApi.list(filter === "unread"), [filter]);
    const [error, setError] = useState<string | null>(null);

    const items = state.data ?? [];

    // Actualiza la lista local y el contador de la barra lateral tras cada cambio.
    function apply(next: AppNotification[]) {
        state.setData(next);
        if (filter === "all") setUnreadCount(next.filter((item) => !item.read).length);
    }

    async function run(action: () => Promise<void>, next: AppNotification[]) {
        setError(null);
        try {
            await action();
            apply(next);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "No se ha podido completar la acción.");
        }
    }

    const markRead = (item: AppNotification) =>
        run(() => notificationsApi.markRead(item.id), filter === "unread" ? items.filter((entry) => entry.id !== item.id) : items.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry)));
    const remove = (item: AppNotification) => run(() => notificationsApi.remove(item.id), items.filter((entry) => entry.id !== item.id));
    const markAll = () => run(() => notificationsApi.markAllRead(), filter === "unread" ? [] : items.map((entry) => ({ ...entry, read: true })));

    return (
        <div className="page">
            <header className="page__header">
                <div>
                    <h1 className="page__title">Avisos</h1>
                    <p className="page__subtitle">Alertas disparadas y avisos de seguridad de tu cuenta.</p>
                </div>
                <div className="page__actions">
                    <SegmentedControl
                        label="Filtro de avisos"
                        value={filter}
                        onChange={setFilter}
                        options={[{ value: "all", label: "Todos" }, { value: "unread", label: "Sin leer" }]}
                    />
                    <Button variant="secondary" small onClick={markAll} disabled={items.every((item) => item.read)}>
                        <CheckCheck size={16} /> Marcar todo
                    </Button>
                </div>
            </header>

            {error && <p className="form-message form-message--error" role="alert">{error}</p>}

            {state.loading && !state.data ? (
                <LoadingState slow={state.slow} label="Cargando avisos" />
            ) : state.error ? (
                <ErrorState message={state.error} onRetry={state.reload} />
            ) : items.length === 0 ? (
                <EmptyState title="No hay avisos" text={filter === "unread" ? "Estás al día: no queda nada por leer." : "Cuando una alerta se cumpla, aparecerá aquí."} />
            ) : (
                <ul className="list">
                    {items.map((item) => (
                        <li key={item.id} className={`list__item notification${item.read ? "" : " notification--unread"}`}>
                            <span className="notification__icon">{iconFor(item.type)}</span>
                            <div className="notification__body">
                                <strong>{item.title}</strong>
                                <p>{item.message}</p>
                                <small>
                                    {formatDateTime(item.sentAt)}
                                    {item.provinceCode && <> · <Link to={`/provincia/${item.provinceCode}`}>Ver provincia</Link></>}
                                </small>
                            </div>
                            {!item.read && (
                                <button type="button" className="icon-button" aria-label="Marcar como leído" onClick={() => markRead(item)}><Check size={18} /></button>
                            )}
                            <button type="button" className="icon-button icon-button--danger" aria-label="Ocultar aviso" onClick={() => remove(item)}><Trash2 size={18} /></button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}