namespace MarketData.Api.Dtos;

public class HousingSaleDto
{
    public string ProvinceCode { get; set; } = string.Empty;
    public DateOnly Period { get; set; }
    public string Regime { get; set; } = string.Empty;
    public string HousingStatus { get; set; } = string.Empty;
    public int OperationsCount { get; set; }
}