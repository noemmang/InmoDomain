namespace MarketData.ImportJob.Integrations.Mivau;

// Period es siempre el primer dia del trimestre correspondiente.
public record ParsedMivauRow(string ProvinceCode, DateOnly Period, string Age, decimal PricePerSquareMeter);
