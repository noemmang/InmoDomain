namespace Analytics.Dtos;

public class CompareEntryDto
{
    public string ProvinceCode { get; set; } = string.Empty;
    public DateOnly Period { get; set; }
    public decimal PriceIndex { get; set; }
    public decimal PriceIndexNationalRanking { get; set; }
    public decimal? PriceTrendIndex { get; set; }
    public decimal? PriceTrendIndexYearOverYear { get; set; }
    public decimal ActivityIndex { get; set; }
    public decimal ActivityIndexNationalRanking { get; set; }
    public decimal? Score { get; set; }
}