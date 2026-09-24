namespace MarketData.ImportJob.Integrations.Ine;

// Valores en espanol tal como exige el CHECK de estado_vivienda en compraventas_vivienda
// (ver MarketDataDbContext, ck_compraventas_estado_vivienda).
public static class DwellingStatusExtensions
{
    public static string ToDbValue(this DwellingStatus status) => status switch
    {
        DwellingStatus.New => "nueva",
        DwellingStatus.SecondHand => "segunda_mano",
        _ => throw new ArgumentOutOfRangeException(nameof(status), status, null)
    };
}
