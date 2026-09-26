namespace Analytics.Integrations.MarketData.Dtos;

public class PropertySaleDto
{
    public string ProvinceCode { get; set; } = string.Empty;
    public DateOnly Period { get; set; }
    public string HousingStatus { get; set; } = string.Empty;
    public int OperationsCount { get; set; }
}