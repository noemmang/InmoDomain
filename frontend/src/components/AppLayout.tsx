import { Bell, GitCompareArrows, LayoutDashboard, LogIn, Star, UserRound, BellRing } from "lucide-react";
import type { ReactNode } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";
import { useProvinces } from "../hooks/useProvinces";
import { initials } from "../utils/format";
import { Logo } from "./Logo";
import { ProvinceSelect } from "./ProvinceSelect";

interface NavItem {
    to: string;
    label: string;
    icon: ReactNode;
    requiresAuth?: boolean;
}

const NAV_ITEMS: NavItem[] = [
    { to: "/explorar", label: "Explorar", icon: <LayoutDashboard size={20} /> },
    { to: "/comparar", label: "Comparar", icon: <GitCompareArrows size={20} /> },
    { to: "/favoritos", label: "Favoritos", icon: <Star size={20} />, requiresAuth: true },
    { to: "/alertas", label: "Alertas", icon: <BellRing size={20} />, requiresAuth: true },
    { to: "/notificaciones", label: "Avisos", icon: <Bell size={20} />, requiresAuth: true },
];

// Estructura del panel: barra lateral (barra inferior en móvil), buscador de provincias arriba y contenido.
export function AppLayout() {
    const { status, user } = useAuth();
    const { unreadCount } = useNotifications();
    const { provinces } = useProvinces();
    const navigate = useNavigate();
    const authenticated = status === "authenticated";

    const visibleItems = NAV_ITEMS.filter((item) => !item.requiresAuth || authenticated);

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar__brand">
                    <Logo to="/" />
                </div>
                <nav className="sidebar__nav" aria-label="Secciones">
                    {visibleItems.map((item) => (
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
                <NavLink
                    to={authenticated ? "/perfil" : "/login"}
                    className={({ isActive }) => `sidebar__link sidebar__profile${isActive ? " sidebar__link--active" : ""}`}
                >
                    <span className="sidebar__icon">{authenticated && user ? <span className="avatar avatar--small">{initials(user.name)}</span> : <LogIn size={20} />}</span>
                    <span className="sidebar__label">{authenticated ? "Perfil" : "Entrar"}</span>
                </NavLink>
            </aside>

            <div className="app-layout__main">
                <header className="topbar">
                    <ProvinceSelect
                        provinces={provinces}
                        placeholder="Buscar provincia…"
                        onSelect={(code) => navigate(`/provincia/${code}`)}
                    />
                    <NavLink to={authenticated ? "/perfil" : "/login"} className="topbar__user" aria-label={authenticated ? "Perfil" : "Entrar"}>
                        {authenticated && user ? <span className="avatar">{initials(user.name)}</span> : <UserRound size={20} />}
                    </NavLink>
                </header>
                <main className="app-layout__content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}