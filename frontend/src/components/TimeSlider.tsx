import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatQuarter } from "../utils/format";

interface TimeSliderProps {
    // Trimestres disponibles, de más antiguo a más reciente.
    periods: string[];
    value: string;
    onChange: (period: string) => void;
}

const STEP_MS = 650;

// Control temporal: deslizador por trimestres y botón que reproduce la evolución hasta el último dato.
export function TimeSlider({ periods, value, onChange }: TimeSliderProps) {
    const [playing, setPlaying] = useState(false);
    const index = Math.max(0, periods.indexOf(value));
    const changeRef = useRef(onChange);
    changeRef.current = onChange;

    // Avanza un trimestre por paso y se detiene al llegar al último.
    useEffect(() => {
        if (!playing) return;
        if (index >= periods.length - 1) {
            setPlaying(false);
            return;
        }
        const timer = window.setTimeout(() => changeRef.current(periods[index + 1]), STEP_MS);
        return () => window.clearTimeout(timer);
    }, [playing, index, periods]);

    function togglePlay() {
        if (playing) {
            setPlaying(false);
            return;
        }
        if (index >= periods.length - 1) changeRef.current(periods[0]);
        setPlaying(true);
    }

    return (
        <div className="time-slider">
            <button
                type="button"
                className="time-slider__play"
                onClick={togglePlay}
                aria-label={playing ? "Pausar la reproducción" : "Reproducir la evolución"}
            >
                {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
            </button>
            <div className="time-slider__track">
                <input
                    className="time-slider__range"
                    type="range"
                    min={0}
                    max={periods.length - 1}
                    step={1}
                    value={index}
                    aria-label="Trimestre mostrado"
                    aria-valuetext={formatQuarter(value)}
                    onChange={(event) => {
                        setPlaying(false);
                        onChange(periods[Number(event.target.value)]);
                    }}
                />
                <div className="time-slider__ends" aria-hidden="true">
                    <span>{formatQuarter(periods[0])}</span>
                    <span>{formatQuarter(periods[periods.length - 1])}</span>
                </div>
            </div>
            <strong className="time-slider__current">{formatQuarter(value)}</strong>
        </div>
    );
}
