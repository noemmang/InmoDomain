namespace Analytics.Dtos;

public class PropertySaleRawDto
{
    public DateOnly Period { get; set; }
    public string HousingStatus { get; set; } = string.Empty;
    public int OperationsCount { get; set; }
}