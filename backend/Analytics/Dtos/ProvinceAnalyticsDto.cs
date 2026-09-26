namespace Analytics.Dtos;

public class ProvinceAnalyticsDto
{
    public string ProvinceCode { get; set; } = string.Empty;
    public List<PropertyScorePeriodDto> History { get; set; } = new();
    public List<PropertySaleRawDto> PropertySales { get; set; } = new();
    public List<AppraisedValueRawDto> AppraisedValues { get; set; } = new();
    public bool? IsFavorite { get; set; }
    public CustomTrendDto? CustomTrend { get; set; }
}