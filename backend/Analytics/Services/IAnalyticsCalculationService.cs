namespace Analytics.Services;

public interface IAnalyticsCalculationService
{
    Task<RecalculationResult> RecalculateActivityAsync(DateOnly period, IReadOnlyCollection<string> provinceCodes);
    Task<RecalculationResult> RecalculatePriceAsync(DateOnly period, IReadOnlyCollection<string> provinceCodes);
}