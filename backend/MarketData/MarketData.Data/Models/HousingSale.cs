namespace MarketData.Data.Models;

public class HousingSale
{
    public Guid Id { get; set; }
    public string ProvinceCode { get; set; } = string.Empty;
    public DateOnly Period { get; set; }
    public string HousingStatus { get; set; } = string.Empty;
    public int OperationsCount { get; set; }
}