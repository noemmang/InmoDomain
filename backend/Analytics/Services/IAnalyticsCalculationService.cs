namespace Analytics.Services;

public interface IAnalyticsCalculationService
{
    Task RecalculateActivityAsync(DateOnly period, IReadOnlyCollection<string> provinceCodes);
    Task RecalculatePriceAsync(DateOnly period, IReadOnlyCollection<string> provinceCodes);
}