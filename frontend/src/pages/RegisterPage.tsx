import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { Button } from "../components/Button";
import { Field, FormMessage } from "../components/Field";
import { useAuth } from "../context/AuthContext";

// Registro de cuenta nueva. Si sale bien, inicia sesión directamente.
export function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await register(name.trim(), email.trim(), password);
            navigate("/explorar", { replace: true });
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "No se ha podido crear la cuenta.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout
            title="Crea tu cuenta"
            subtitle="Guarda provincias favoritas y recibe avisos cuando el mercado se mueva."
            footer={<>¿Ya tienes cuenta? <Link to="/login">Entra aquí</Link></>}
        >
            <form className="form" onSubmit={handleSubmit}>
                <Field label="Nombre" autoComplete="name" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} />
                <Field label="Correo electrónico" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
                <Field
                    label="Contraseña"
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
                <Button type="submit" block loading={loading}>Crear cuenta</Button>
            </form>
        </AuthLayout>
    );
}