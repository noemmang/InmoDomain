import { Link, Outlet, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { SiteHeader } from "./SiteHeader";

// Estructura de las páginas públicas: cabecera, contenido y, solo en Inicio, pie de página.
// Inicio ocupa todo el ancho; Explorar, Comparar y Provincia van dentro de un contenedor.
export function MainLayout() {
    const { pathname } = useLocation();
    const isHome = pathname === "/";
    const isExplore = pathname === "/explorar";

    return (
        <div className="site">
            <SiteHeader />
            <main className={isHome ? "site__main" : isExplore ? "site__main site__main--contained site__main--explore" : "site__main site__main--contained"}>
                <Outlet />
            </main>
            {isHome && (
                <footer className="public-footer">
                    <div className="public-footer__inner">
                        <Logo />
                        <p className="public-footer__text">
                            Proyecto educativo de análisis del mercado inmobiliario español. Datos oficiales del INE, del MIVAU y del ISTAC.
                        </p>
                        <nav className="public-footer__links" aria-label="Pie de página">
                            <Link to="/explorar">Explorar</Link>
                            <Link to="/comparar">Comparar</Link>
                            <a href="https://github.com/noemmang/InmoDomain" target="_blank" rel="noreferrer">GitHub</a>
                        </nav>
                    </div>
                </footer>
            )}
        </div>
    );
}