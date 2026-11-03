import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicLayout } from "./components/PublicLayout";
import { AlertsPage } from "./pages/AlertsPage";
import { ComparePage } from "./pages/ComparePage";
import { ExplorePage } from "./pages/ExplorePage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ProvincePage } from "./pages/ProvincePage";
import { RegisterPage } from "./pages/RegisterPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";

// Mapa de rutas: portada pública, pantallas de acceso, panel público y panel que exige sesión.
export function App() {
    return (
        <Routes>
            <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
            </Route>

            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro" element={<RegisterPage />} />
            <Route path="/recuperar" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route element={<AppLayout />}>
                <Route path="/explorar" element={<ExplorePage />} />
                <Route path="/provincia/:code" element={<ProvincePage />} />
                <Route path="/comparar" element={<ComparePage />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/favoritos" element={<FavoritesPage />} />
                    <Route path="/alertas" element={<AlertsPage />} />
                    <Route path="/notificaciones" element={<NotificationsPage />} />
                    <Route path="/perfil" element={<ProfilePage />} />
                </Route>
                <Route path="/panel" element={<Navigate to="/explorar" replace />} />
                <Route path="*" element={<NotFoundPage />} />
            </Route>
        </Routes>
    );
}