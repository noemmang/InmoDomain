namespace MarketData.ImportJob.Integrations.Mivau;

// URL numerica estable (no cambia cada trimestre) de cada serie de MIVAU. Age es el
// valor que se guarda en la columna antiguedad_vivienda ('<=5' / '>5').
public record MivauSeriesDefinition(string Url, string Age)
{
    public static readonly MivauSeriesDefinition UpToFiveYears = new(
        "https://apps.fomento.gob.es/BoletinOnline2/sedal/35101500.XLS", "<=5");

    public static readonly MivauSeriesDefinition MoreThanFiveYears = new(
        "https://apps.fomento.gob.es/BoletinOnline2/sedal/35102000.XLS", ">5");

    public static IReadOnlyList<MivauSeriesDefinition> All { get; } = [UpToFiveYears, MoreThanFiveYears];
}
