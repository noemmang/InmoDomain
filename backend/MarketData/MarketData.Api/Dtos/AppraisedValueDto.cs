namespace MarketData.Api.Dtos;

public class AppraisedValueDto
{
    public string ProvinceCode { get; set; } = string.Empty;
    public DateOnly Period { get; set; }
    public string Age { get; set; } = string.Empty;
    public decimal PricePerSquareMeter { get; set; }
}