namespace Analytics.Services;

public record PeriodRecalculationResult(DateOnly Period, int PriceProvinces, int ActivityProvinces);

public interface IRangeRecalculationService
{
    Task<IReadOnlyList<PeriodRecalculationResult>> RecalculateAsync(
        DateOnly from, DateOnly to, IReadOnlyCollection<string>? provinceCodes);
}