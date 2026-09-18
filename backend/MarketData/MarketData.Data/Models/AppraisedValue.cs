namespace MarketData.Data.Models;

public class AppraisedValue
{
    public Guid Id { get; set; }
    public string ProvinceCode { get; set; } = string.Empty;
    public DateOnly Period { get; set; }
    public string Age { get; set; } = string.Empty;
    public decimal PricePerSquareMeter { get; set; }
}