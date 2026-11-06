namespace Analytics.Integrations.MarketData.Dtos;

public class ConstructionActivityDto
{
    public string ProvinceCode { get; set; } = string.Empty;
    public DateOnly Period { get; set; }
    public string Phase { get; set; } = string.Empty;
    public string Regime { get; set; } = string.Empty;
    public int DwellingsCount { get; set; }
    public bool IsProvisional { get; set; }
}
