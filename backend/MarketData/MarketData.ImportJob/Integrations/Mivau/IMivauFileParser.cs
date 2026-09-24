namespace MarketData.ImportJob.Integrations.Mivau;

public interface IMivauFileParser
{
    // xlsStream: el .XLS binario completo (las 4 hojas), ya descargado.
    // age: '<=5' o '>5', se copia tal cual a cada fila resultante.
    IReadOnlyList<ParsedMivauRow> Parse(Stream xlsStream, string age);
}
