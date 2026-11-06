namespace MarketData.ImportJob.Integrations.Istac;

// Period es siempre el primer dia del mes.
public record ParsedConstructionRow(
    string ProvinceCode,
    DateOnly Period,
    string Phase,
    string Regime,
    int DwellingsCount,
    bool IsProvisional);
