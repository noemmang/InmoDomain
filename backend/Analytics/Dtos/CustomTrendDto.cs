namespace Analytics.Dtos;

public class CustomTrendDto
{
    public int TrendQuarters { get; set; }
    public bool HasSufficientData { get; set; }
    public decimal? Value { get; set; }
}