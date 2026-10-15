namespace Alerts.Models;

public class Alert
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string ProvinceCode { get; set; } = string.Empty;
    public string Metric { get; set; } = string.Empty;
    public string Condition { get; set; } = string.Empty;
    public decimal Threshold { get; set; }
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastTriggeredAt { get; set; }
    public DateOnly? LastTriggeredPeriod { get; set; }
}