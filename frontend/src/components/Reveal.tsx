import type { CSSProperties, ReactNode } from "react";
import { useReveal } from "../hooks/useReveal";

// Anima la entrada de su contenido (fundido y ligero desplazamiento) al aparecer en pantalla.
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
    const ref = useReveal<HTMLDivElement>();
    const style = { "--reveal-delay": `${delay}ms` } as CSSProperties;

    return (
        <div ref={ref} className={["reveal", className].filter(Boolean).join(" ")} style={style}>
            {children}
        </div>
    );
}