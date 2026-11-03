import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authApi } from "../api/endpoints";
import { AuthLayout } from "../components/AuthLayout";
import { Button, ButtonLink } from "../components/Button";
import { Field, FormMessage } from "../components/Field";

// Pantalla a la que lleva el enlace del correo: el token llega en la URL (?token=...).
export function ResetPasswordPage() {
    const [params] = useSearchParams();
    const token = params.get("token");

    const [password, setPassword] = useState("");
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        if (!token) return;
        setError(null);
        setLoading(true);
        try {
            await authApi.resetPassword(token, password);
            setDone(true);
        } catch {
            setError("El enlace no es válido o ha caducado. Solicita uno nuevo.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout
            title="Elige una contraseña nueva"
            subtitle="Al guardarla se cerrarán tus sesiones abiertas."
            redirectIfAuthenticated={false}
            footer={<Link to="/recuperar">Solicitar otro enlace</Link>}
        >
            {!token ? (
                <FormMessage kind="error">Falta el token del enlace. Abre de nuevo el enlace que recibiste por correo.</FormMessage>
            ) : done ? (
                <>
                    <FormMessage kind="success">Contraseña actualizada. Ya puedes iniciar sesión.</FormMessage>
                    <ButtonLink to="/login" block>Ir a iniciar sesión</ButtonLink>
                </>
            ) : (
                <form className="form" onSubmit={handleSubmit}>
                    <Field
                        label="Contraseña nueva"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        maxLength={128}
                        hint="Mínimo 8 caracteres."
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                    {error && <FormMessage kind="error">{error}</FormMessage>}
                    <Button type="submit" block loading={loading}>Guardar contraseña</Button>
                </form>
            )}
        </AuthLayout>
    );
}