namespace Alerts.Integrations.Analytics;

public interface IAnalyticsClient
{
    Task<MetricValueDto?> GetMetricValueAsync(string provinceCode, string metric);
}