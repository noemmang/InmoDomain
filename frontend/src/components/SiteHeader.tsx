import { UserRound } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";
import { useProvinces } from "../hooks/useProvinces";
import { initials } from "../utils/format";
import { Logo } from "./Logo";
import { ProvinceSelect } from "./ProvinceSelect";

// Cabecera única de toda la web: marca, Inicio, Explorar, Comparar y acceso al perfil.
// Explorar y Comparar son públicos; el icono de perfil lleva al login si no hay sesión.
export function SiteHeader() {
    const { status, user } = useAuth();
    const { unreadCount } = useNotifications();
    const { provinces } = useProvinces();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const authenticated = status === "authenticated";
    const showSearch = pathname.startsWith("/explorar") || pathname.startsWith("/provincia");
    const accountPath = ["/perfil", "/favoritos", "/alertas", "/notificaciones"].some((path) => pathname.startsWith(path));

    const linkClass = ({ isActive }: { isActive: boolean }) => `site-header__link${isActive ? " site-header__link--active" : ""}`;

    return (
        <header className="site-header">
            <div className="site-header__inner">
                <Logo />
                <nav className="site-header__nav" aria-label="Principal">
                    <NavLink to="/" end className={linkClass}>Inicio</NavLink>
                    <NavLink to="/explorar" className={linkClass}>Explorar</NavLink>
                    <NavLink to="/comparar" className={linkClass}>Comparar</NavLink>
                </nav>
                <div className="site-header__actions">
                    {showSearch && (
                        <div className="site-header__search">
                            <ProvinceSelect
                                provinces={provinces}
                                placeholder="Buscar provincia…"
                                onSelect={(code) => navigate(`/provincia/${code}`)}
                            />
                        </div>
                    )}
                    <NavLink
                        to={authenticated ? "/perfil" : "/login"}
                        className={`site-header__profile${accountPath ? " site-header__profile--active" : ""}`}
                        aria-label={authenticated ? "Mi perfil" : "Iniciar sesión"}
                        title={authenticated ? "Mi perfil" : "Iniciar sesión"}
                    >
                        {authenticated && user ? <span className="avatar avatar--small">{initials(user.name)}</span> : <UserRound size={20} />}
                        {authenticated && unreadCount > 0 && <span className="site-header__dot" aria-label={`${unreadCount} avisos sin leer`} />}
                    </NavLink>
                </div>
            </div>
        </header>
    );
}
