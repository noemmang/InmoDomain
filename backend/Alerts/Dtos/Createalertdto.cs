using System.ComponentModel.DataAnnotations;
using Alerts.Common;

namespace Alerts.Dtos;

public class CreateAlertDto
{
    [Required]
    [RegularExpression("^[0-9]{2}$")]
    public string ProvinceCode { get; set; } = string.Empty;

    [Required]
    [AllowedValues(
        MetricNames.PropertyScore,
        MetricNames.PriceIndex,
        MetricNames.PriceTrendIndex,
        MetricNames.ActivityIndex,
        MetricNames.PricePerSquareMeter)]
    public string Metric { get; set; } = string.Empty;

    [Required]
    [AllowedValues(AlertConditions.GreaterThan, AlertConditions.LessThan)]
    public string Condition { get; set; } = string.Empty;

    [Required]
    [Range(-999999.99, 999999.99)]
    public decimal? Threshold { get; set; }
}