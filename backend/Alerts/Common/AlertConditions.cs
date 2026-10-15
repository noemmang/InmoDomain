namespace Alerts.Common;

public static class AlertConditions
{
    public const string GreaterThan = "mayor_que";
    public const string LessThan = "menor_que";

    public static readonly IReadOnlySet<string> All = new HashSet<string>
    {
        GreaterThan, LessThan
    };
}