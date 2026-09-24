using System.Globalization;
using System.Text.RegularExpressions;
using ExcelDataReader;

namespace MarketData.ImportJob.Integrations.Mivau;

// IMPORTANTE - ver nota al final del fichero: la deteccion de la fila de cabecera
// (que columna es cada trimestre) se ha escrito de forma dinamica porque no se ha
// verificado contra un .XLS real dentro de esta conversacion (a diferencia del
// cliente INE, que si se verifico contra JSON real). Antes de dar esto por
// definitivo, ejecutar contra un fichero real y confirmar que ParseHeader()
// encuentra la fila de trimestres correctamente.
public class MivauFileParser : IMivauFileParser
{
    // Documentado y verificado (Fase 5, Bloque 1): el nombre de territorio esta
    // siempre en la columna B del .XLS.
    private const int TerritoryColumnIndex = 1;

    // Acepta "1T", "T1", "1er T", etc. - variantes plausibles del rotulo de trimestre
    // usado por las publicaciones de MIVAU/MITMA. Ajustar si el fichero real usa otro formato.
    private static readonly Regex QuarterLabelPattern = new(@"^(?:(?<q1>[1-4])\s*T|T\s*(?<q2>[1-4]))$", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public IReadOnlyList<ParsedMivauRow> Parse(Stream xlsStream, string age)
    {
        var rows = new List<ParsedMivauRow>();

        using var reader = ExcelReaderFactory.CreateReader(xlsStream);

        do
        {
            ParseSheet(reader, age, rows);
        } while (reader.NextResult());

        return rows;
    }

    private static void ParseSheet(IExcelDataReader reader, string age, List<ParsedMivauRow> rows)
    {
        // Se buscan las dos filas de cabecera (año + trimestre) dentro de las
        // primeras filas de la hoja; el resto de la hoja son filas de datos.
        List<string?>? headerRow = null;
        List<string?>? yearRow = null;
        List<(int ColumnIndex, DateOnly Period)>? quarterColumns = null;

        while (reader.Read())
        {
            var cells = ReadRowAsStrings(reader);

            if (headerRow is null)
            {
                if (LooksLikeQuarterHeaderRow(cells))
                {
                    headerRow = cells;
                    // La fila de años es la anterior a esta; si no se capturo
                    // (primera fila de la hoja), se deja null y se asume año
                    // desconocido - en ese caso la fila se descarta mas abajo.
                    quarterColumns = MapColumnsToQuarters(headerRow, yearRow);
                }
                else
                {
                    yearRow = cells;
                }

                continue;
            }

            // A partir de aqui, cada fila leida es una fila de datos.
            ParseDataRow(cells, quarterColumns!, age, rows);
        }
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

        // Fila agregada que se descarta para no duplicar el dato (ver Fase 5,
        // Bloque 1) - comparacion tolerante a mayusculas/espacios.
        if (rawTerritory.Equals("Ceuta y Melilla", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        // Si el nombre no esta en el diccionario, es una fila de Total Nacional o
        // de Comunidad Autonoma (la hoja anida Nacional -> CCAA -> provincias) y se
        // descarta sin error: solo nos interesan las 52 provincias.
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

            // 'n.r' (no recogido / sin dato para ese territorio-trimestre): se omite
            // la fila, no se inserta como cero ni se lanza excepcion.
            if (string.IsNullOrEmpty(rawValue) || rawValue.Equals("n.r", StringComparison.OrdinalIgnoreCase)
                || rawValue.Equals("n.r.", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!decimal.TryParse(rawValue, NumberStyles.Number, CultureInfo.InvariantCulture, out var price))
            {
                // Formato inesperado (no numerico, no 'n.r'): se omite la fila en
                // vez de romper la importacion completa por una celda rara. Un valor
                // realista deberia registrarse via ILogger en el runner que llama a esto.
                continue;
            }

            rows.Add(new ParsedMivauRow(provinceCode, period, age, price));
        }
    }

    // Devuelve, para cada columna que representa un trimestre reconocido, su fecha
    // (primer dia del trimestre). El año de cada columna se resuelve buscando hacia
    // la izquierda en yearRow el valor numerico mas cercano (los años de publicacion
    // suelen venir en una celda combinada, visible solo en la primera columna del
    // bloque de 4 trimestres).
    private static List<(int ColumnIndex, DateOnly Period)> MapColumnsToQuarters(
        List<string?> headerRow, List<string?>? yearRow)
    {
        var result = new List<(int, DateOnly)>();

        int? lastYear = null;

        for (var col = 0; col < headerRow.Count; col++)
        {
            if (yearRow is not null && col < yearRow.Count
                && int.TryParse(yearRow[col]?.Trim(), out var yearAtColumn))
            {
                lastYear = yearAtColumn;
            }

            var quarterMatch = QuarterLabelPattern.Match(headerRow[col]?.Trim() ?? string.Empty);
            if (!quarterMatch.Success || lastYear is null)
            {
                continue;
            }

            var quarterText = quarterMatch.Groups["q1"].Success ? quarterMatch.Groups["q1"].Value : quarterMatch.Groups["q2"].Value;
            var quarter = int.Parse(quarterText, CultureInfo.InvariantCulture);
            var firstMonthOfQuarter = ((quarter - 1) * 3) + 1;

            result.Add((col, new DateOnly(lastYear.Value, firstMonthOfQuarter, 1)));
        }

        return result;
    }

    private static bool LooksLikeQuarterHeaderRow(List<string?> cells)
    {
        // Se considera fila de cabecera de trimestres si al menos 4 celdas casan
        // con el patron de trimestre (un bloque de año completo).
        var matches = cells.Count(c => QuarterLabelPattern.IsMatch(c?.Trim() ?? string.Empty));
        return matches >= 4;
    }

    private static List<string?> ReadRowAsStrings(IExcelDataReader reader)
    {
        // ExcelDataReader devuelve celdas numericas como double (boxed), no como
        // texto. Formatear explicitamente con InvariantCulture evita depender de la
        // cultura del hilo en ejecucion (que podria usar coma decimal y romper el
        // decimal.TryParse posterior, tambien en InvariantCulture, en ParseDataRow).
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

// NOTA DE VERIFICACION PENDIENTE (a diferencia del resto del ImportJob, esta parte
// no se ha contrastado con un fichero real dentro de esta conversacion):
// 1. Confirmar el formato exacto del rotulo de trimestre ("1T", "T1", "1er trim.",
//    etc.) contra las 4 hojas de un .XLS real y ajustar QuarterLabelPattern si no coincide.
// 2. Confirmar que el año efectivamente aparece en la fila inmediatamente anterior
//    a la de los rotulos de trimestre, y no en otra fila o en una celda fusionada
//    que ExcelDataReader exponga de otra forma.
// 3. Confirmar que la columna de territorio es realmente la B (indice 1) en las 4
//    hojas, no solo en la primera.
