import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { Button } from "../components/Button";
import { Field, FormMessage } from "../components/Field";
import { useAuth } from "../context/AuthContext";

// Inicio de sesión. Tras entrar vuelve a la ruta que se intentaba abrir o va al panel.
export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const redirectTo = (location.state as { from?: string } | null)?.from ?? "/perfil";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(email.trim(), password);
            navigate(redirectTo, { replace: true });
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "No se ha podido iniciar sesión.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout
            title="Bienvenido de nuevo"
            subtitle="Entra para ver tus favoritos y alertas."
            footer={<>¿No tienes cuenta? <Link to="/registro">Crea una gratis</Link></>}
        >
            <form className="form" onSubmit={handleSubmit}>
                <Field label="Correo electrónico" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
                <Field label="Contraseña" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
                <Link className="form__link" to="/recuperar">¿Has olvidado tu contraseña?</Link>
                {error && <FormMessage kind="error">{error}</FormMessage>}
                <Button type="submit" block loading={loading}>Entrar</Button>
            </form>
        </AuthLayout>
    );
}