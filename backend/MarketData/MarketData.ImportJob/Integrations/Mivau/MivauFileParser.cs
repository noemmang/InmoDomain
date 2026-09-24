using System.Globalization;
using System.Text.RegularExpressions;
using ExcelDataReader;

namespace MarketData.ImportJob.Integrations.Mivau;

// Formato real verificado contra 35101500.XLS y 35102000.XLS (4 hojas cada uno):
//  - Territorio en la columna B (indice 1).
//  - Fila de años: texto "Año 2010" en la PRIMERA columna de cada bloque de 4
//    trimestres (celda combinada; las otras 3 columnas llegan vacias).
//  - Fila siguiente: "(trimestre)". Fila de rotulos: "1º", "2º", "3º ", "4º "
//    (con espacios al final en algunos).
//  - La ultima hoja anade dos columnas "Variacion" (Trimestral / Anual) que no son
//    trimestres y se ignoran porque su rotulo no casa con el patron.
public class MivauFileParser : IMivauFileParser
{
    private const int TerritoryColumnIndex = 1;

    // "1º", "2º", "3º", "4º" (tambien º/°/ª), y variantes "1T", "T1", "1er T".
    private static readonly Regex QuarterLabelPattern = new(
        @"^(?:(?<q1>[1-4])\s*(?:[ºª°]|er|T|er\s*T|º\s*T)|T\s*(?<q2>[1-4]))\.?$",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    // "Año 2010" (tolera "Ano" sin tilde y espacios extra).
    private static readonly Regex YearLabelPattern = new(
        @"^A[ñn]o\s+(?<year>\d{4})$",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public IReadOnlyList<ParsedMivauRow> Parse(Stream xlsStream, string age)
    {
        var rows = new List<ParsedMivauRow>();
        var sheetsWithHeader = 0;

        using var reader = ExcelReaderFactory.CreateReader(xlsStream);

        do
        {
            if (ParseSheet(reader, age, rows))
            {
                sheetsWithHeader++;
            }
        } while (reader.NextResult());

        // Si ninguna hoja tiene cabecera reconocible, el formato del fichero ha
        // cambiado: mejor fallar de forma visible que devolver 0 filas en silencio.
        if (sheetsWithHeader == 0)
        {
            throw new InvalidOperationException(
                "MivauFileParser: no se reconocio la cabecera de trimestres en ninguna hoja. " +
                "El formato del fichero MIVAU puede haber cambiado.");
        }

        return rows;
    }

    // Devuelve true si la hoja tenia una cabecera de trimestres reconocible.
    private static bool ParseSheet(IExcelDataReader reader, string age, List<ParsedMivauRow> rows)
    {
        List<string?>? yearRow = null;
        List<(int ColumnIndex, DateOnly Period)>? quarterColumns = null;

        while (reader.Read())
        {
            var cells = ReadRowAsStrings(reader);

            if (quarterColumns is null)
            {
                if (LooksLikeQuarterHeaderRow(cells))
                {
                    quarterColumns = MapColumnsToQuarters(cells, yearRow);
                }
                else if (RowContainsYearLabel(cells))
                {
                    // La fila de años no es la inmediatamente anterior a los
                    // rotulos (hay una fila "(trimestre)" en medio): se guarda la
                    // ultima fila vista que contenga algun "Año YYYY".
                    yearRow = cells;
                }

                continue;
            }

            ParseDataRow(cells, quarterColumns, age, rows);
        }

        return quarterColumns is { Count: > 0 };
    }

    private static void ParseDataRow(
        List<string?> cells,
        List<(int ColumnIndex, DateOnly Period)> quarterColumns,
        string age,
        List<ParsedMivauRow> rows)
    {
        if (TerritoryColumnIndex >= cells.Count)
        {
            return;
        }

        var rawTerritory = cells[TerritoryColumnIndex]?.Trim();
        if (string.IsNullOrEmpty(rawTerritory))
        {
            return;
        }

        // Fila agregada que se descarta para no duplicar el dato.
        if (rawTerritory.Equals("Ceuta y Melilla", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        // TOTAL NACIONAL, notas al pie, etc.: no estan en el diccionario y se
        // descartan sin error. Solo interesan las 52 provincias.
        if (!MivauProvinceNames.ByRawName.TryGetValue(rawTerritory, out var provinceCode))
        {
            return;
        }

        foreach (var (columnIndex, period) in quarterColumns)
        {
            if (columnIndex >= cells.Count)
            {
                continue;
            }

            var rawValue = cells[columnIndex]?.Trim();

            // 'n.r' o celda vacia: sin dato, no se inserta fila.
            if (string.IsNullOrEmpty(rawValue)
                || rawValue.Equals("n.r", StringComparison.OrdinalIgnoreCase)
                || rawValue.Equals("n.r.", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!decimal.TryParse(rawValue, NumberStyles.Number, CultureInfo.InvariantCulture, out var price))
            {
                continue;
            }

            // El .XLS trae valores como 1894.3999999999999 (artefacto de double).
            // Se redondea a 2 decimales (columna decimal(10,2)) para que el upsert
            // compare igual contra lo ya guardado y sea idempotente.
            price = Math.Round(price, 2, MidpointRounding.AwayFromZero);

            rows.Add(new ParsedMivauRow(provinceCode, period, age, price));
        }
    }

    // Para cada columna cuyo rotulo es un trimestre, calcula su fecha (primer dia
    // del trimestre). El año se arrastra hacia la derecha desde la celda "Año YYYY"
    // de cada bloque (celdas combinadas: solo la primera columna trae el texto).
    private static List<(int ColumnIndex, DateOnly Period)> MapColumnsToQuarters(
        List<string?> headerRow, List<string?>? yearRow)
    {
        var result = new List<(int, DateOnly)>();

        if (yearRow is null)
        {
            return result;
        }

        int? currentYear = null;

        for (var col = 0; col < headerRow.Count; col++)
        {
            if (col < yearRow.Count)
            {
                var yearMatch = YearLabelPattern.Match(yearRow[col]?.Trim() ?? string.Empty);
                if (yearMatch.Success)
                {
                    currentYear = int.Parse(yearMatch.Groups["year"].Value, CultureInfo.InvariantCulture);
                }
            }

            var quarterMatch = QuarterLabelPattern.Match(headerRow[col]?.Trim() ?? string.Empty);
            if (!quarterMatch.Success || currentYear is null)
            {
                continue;
            }

            var quarterText = quarterMatch.Groups["q1"].Success
                ? quarterMatch.Groups["q1"].Value
                : quarterMatch.Groups["q2"].Value;
            var quarter = int.Parse(quarterText, CultureInfo.InvariantCulture);
            var firstMonthOfQuarter = ((quarter - 1) * 3) + 1;

            result.Add((col, new DateOnly(currentYear.Value, firstMonthOfQuarter, 1)));
        }

        return result;
    }

    private static bool RowContainsYearLabel(List<string?> cells) =>
        cells.Any(c => YearLabelPattern.IsMatch(c?.Trim() ?? string.Empty));

    private static bool LooksLikeQuarterHeaderRow(List<string?> cells)
    {
        // Cabecera de trimestres = al menos 4 celdas con rotulo de trimestre.
        var matches = cells.Count(c => QuarterLabelPattern.IsMatch(c?.Trim() ?? string.Empty));
        return matches >= 4;
    }

    private static List<string?> ReadRowAsStrings(IExcelDataReader reader)
    {
        // ExcelDataReader devuelve las celdas numericas como double; se formatean
        // con InvariantCulture para no depender de la cultura del hilo.
        var cells = new List<string?>(reader.FieldCount);
        for (var i = 0; i < reader.FieldCount; i++)
        {
            var value = reader.GetValue(i);
            cells.Add(value switch
            {
                null => null,
                double number => number.ToString(CultureInfo.InvariantCulture),
                IFormattable formattable => formattable.ToString(null, CultureInfo.InvariantCulture),
                _ => value.ToString()
            });
        }

        return cells;
    }
}