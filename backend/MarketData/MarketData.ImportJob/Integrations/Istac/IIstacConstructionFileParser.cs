namespace MarketData.ImportJob.Integrations.Istac;

public interface IIstacConstructionFileParser
{
    IReadOnlyList<ParsedConstructionRow> Parse(Stream xlsxStream);
}
