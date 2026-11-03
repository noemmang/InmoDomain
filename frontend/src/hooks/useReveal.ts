import { useEffect, useRef } from "react";

// Marca el elemento como visible la primera vez que entra en pantalla, para lanzar su animación de entrada.
export function useReveal<T extends HTMLElement>() {
    const ref = useRef<T>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        if (!("IntersectionObserver" in window)) {
            element.classList.add("reveal--visible");
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    element.classList.add("reveal--visible");
                    observer.disconnect();
                }
            },
            { threshold: 0.15 },
        );
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    return ref;
}