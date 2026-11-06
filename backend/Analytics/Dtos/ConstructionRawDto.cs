namespace Analytics.Dtos;

// Viviendas iniciadas o terminadas en un mes, por regimen. Phase: iniciada | terminada. Regime: libre | protegida.
public class ConstructionRawDto
{
    public DateOnly Period { get; set; }
    public string Phase { get; set; } = string.Empty;
    public string Regime { get; set; } = string.Empty;
    public int DwellingsCount { get; set; }
    public bool IsProvisional { get; set; }
}
