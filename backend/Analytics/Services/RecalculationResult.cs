namespace Analytics.Services;

public record RecalculationResult(DateOnly Period, IReadOnlyCollection<string> ProvinceCodes);