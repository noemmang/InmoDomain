namespace Analytics.Dtos;

public class AppraisedValueRawDto
{
    public DateOnly Period { get; set; }
    public string Age { get; set; } = string.Empty;
    public decimal PricePerSquareMeter { get; set; }
}