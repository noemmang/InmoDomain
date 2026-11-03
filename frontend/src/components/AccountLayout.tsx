import { Bell, BellRing, Star, UserRound } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useNotifications } from "../context/NotificationsContext";
import { SiteHeader } from "./SiteHeader";

const ACCOUNT_ITEMS = [
    { to: "/perfil", label: "Perfil", icon: <UserRound size={20} /> },
    { to: "/favoritos", label: "Favoritos", icon: <Star size={20} /> },
    { to: "/alertas", label: "Alertas", icon: <BellRing size={20} /> },
    { to: "/notificaciones", label: "Avisos", icon: <Bell size={20} /> },
];

// Zona de cuenta (solo con sesión): barra lateral con Perfil, Favoritos, Alertas y Avisos.
// En móvil la barra pasa a ser una fila de pestañas bajo la cabecera.
export function AccountLayout() {
    const { unreadCount } = useNotifications();

    return (
        <div className="site">
            <SiteHeader />
            <div className="account">
                <aside className="account__sidebar">
                    <nav className="account__nav" aria-label="Mi cuenta">
                        {ACCOUNT_ITEMS.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) => `sidebar__link${isActive ? " sidebar__link--active" : ""}`}
                            >
                                <span className="sidebar__icon">
                                    {item.icon}
                                    {item.to === "/notificaciones" && unreadCount > 0 && (
                                        <span className="sidebar__badge" aria-label={`${unreadCount} sin leer`}>
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </span>
                                <span className="sidebar__label">{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </aside>
                <main className="account__content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
