namespace MarketData.Data.Models;

// Viviendas iniciadas / terminadas por provincia y mes, separadas por regimen.
// Fuente: ISTAC E25004A_000001 (republica la Estadistica de Vivienda Libre y
// Protegida del MIVAU).
//  - Libres: estimacion a partir de visados / certificados de obra.
//  - Protegidas: iniciadas = calificaciones provisionales, terminadas = calificaciones definitivas.
public class ConstructionActivity
{
    public Guid Id { get; set; }
    public string ProvinceCode { get; set; } = string.Empty;

    // Primer dia del mes.
    public DateOnly Period { get; set; }

    // 'iniciada' | 'terminada'
    public string Phase { get; set; } = string.Empty;

    // 'libre' | 'protegida'
    public string Regime { get; set; } = string.Empty;

    public int DwellingsCount { get; set; }

    // true mientras el ISTAC marque la observacion con estado 'P' (hoy: todo 2025 y 2026).
    public bool IsProvisional { get; set; }
}
