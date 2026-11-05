import { SpainMap, type MapTone } from "./SpainMap";

interface MarketLoadingProps {
    loaded: number;
    total: number;
    slow: boolean;
    // Códigos de las provincias que ya han llegado: se iluminan en el mapa.
    loadedCodes: string[];
}

// Carga del panel: el mapa se va coloreando provincia a provincia a medida que llegan los datos.
export function MarketLoading({ loaded, total, slow, loadedCodes }: MarketLoadingProps) {
    const tones: Record<string, MapTone> = {};
    loadedCodes.forEach((code) => { tones[code] = "h3"; });
    const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;

    return (
        <div className="market-loading" role="status" aria-live="polite">
            <div className="market-loading__map">
                <SpainMap tones={tones} label="Mapa de España con las provincias ya cargadas" />
            </div>
            <p className="state__title">Cargando datos de mercado…</p>
            <p className="state__text">{total > 0 ? `${loaded} de ${total} provincias` : "Preparando la lista de provincias"}</p>
            <div className="market-loading__bar" aria-hidden="true">
                <span className="market-loading__fill" style={{ width: `${percent}%` }} />
            </div>
            {slow && (
                <p className="state__text">
                    El servidor se está despertando tras un rato de inactividad. Suele tardar unos 25 segundos la primera vez.
                </p>
            )}
        </div>
    );
}
