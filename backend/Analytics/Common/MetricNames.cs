namespace Analytics.Common;

public static class MetricNames
{
    public const string PropertyScore = "property_score";
    public const string PriceIndex = "indice_precio";
    public const string PriceTrendIndex = "indice_tendencia_precio";
    public const string ActivityIndex = "indice_actividad";
    public const string PricePerSquareMeter = "precio_m2";

    public static readonly IReadOnlySet<string> All = new HashSet<string>
    {
        PropertyScore, PriceIndex, PriceTrendIndex, ActivityIndex, PricePerSquareMeter
    };
}