namespace MarketData.ImportJob.Import;

public record ChangedPeriod(DateOnly Period, IReadOnlyList<string> ProvinceCodes);