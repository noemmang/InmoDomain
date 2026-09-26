namespace Analytics.Services;

public static class PercentileCalculator
{
    public static decimal CalculatePercentileRank(IReadOnlyList<decimal> values, decimal target)
    {
        if (values.Count == 0)
        {
            throw new ArgumentException("La lista de valores no puede estar vacía.", nameof(values));
        }

        if (values.Count == 1)
        {
            return 100m;
        }

        var sorted = values.OrderBy(v => v).ToList();
        var countBelow = sorted.Count(v => v < target);
        var countEqual = sorted.Count(v => v == target);

        var rank = countBelow + (countEqual - 1) / 2m;

        return Math.Round(rank / (sorted.Count - 1) * 100m, 2);
    }
}