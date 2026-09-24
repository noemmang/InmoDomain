namespace MarketData.ImportJob.Integrations.Ine;

// Fila ya traducida de una serie del INE, lista para pasar al runner de upsert.
// Period es siempre el primer dia del mes (Fecha del INE ya viene asi).
public record IneHousingSaleRecord(string ProvinceCode, DateOnly Period, int OperationsCount);
