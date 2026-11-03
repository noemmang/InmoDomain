import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LoadingState } from "./StateViews";

// Protege las rutas que exigen sesión: espera a recuperarla y, si no existe, redirige al login recordando la ruta.
export function ProtectedRoute() {
    const { status } = useAuth();
    const location = useLocation();

    if (status === "loading") return <LoadingState label="Recuperando tu sesión" />;
    if (status === "anonymous") return <Navigate to="/login" replace state={{ from: location.pathname }} />;

    return <Outlet />;
}