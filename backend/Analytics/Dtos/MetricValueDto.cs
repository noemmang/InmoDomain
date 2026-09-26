namespace Analytics.Dtos;

public class MetricValueDto
{
    public string ProvinceCode { get; set; } = string.Empty;
    public string Metric { get; set; } = string.Empty;
    public DateOnly Period { get; set; }
    public decimal? Value { get; set; }
}