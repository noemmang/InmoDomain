using System.Globalization;
using System.Text.RegularExpressions;
using ExcelDataReader;

namespace MarketData.ImportJob.Integrations.Istac;

// Formato verificado contra dataset-ISTAC_E25004A_000001 v1.25 (119.070 filas, hoja unica,
// formato "largo": una fila por periodo x medida x territorio). Columnas usadas, por NOMBRE
// de cabecera (no por posicion, para tolerar que el ISTAC anada columnas):
//   TIME_PERIOD_CODE      "2025-M03" (mensual) o "2025" (anual: se ignora, es la suma de los meses)
//   MEDIDAS_CODE          VIVIENDAS_{INICIADAS|TERMINADAS}[_LIBRES|_PROTEGIDAS]
//   TERRITORIO_CODE       codigo NUTS (ver IstacTerritoryCodes)
//   OBS_VALUE             entero; vacio si no hay dato
//   ESTADO_OBSERVACION_CODE   "P" = provisional, "O"/"M" = sin dato, vacio = definitivo
// Se descartan las medidas totales (VIVIENDAS_INICIADAS / VIVIENDAS_TERMINADAS): verificado en
// las 52 provincias que total = libres + protegidas sin ninguna diferencia.
public class IstacConstructionFileParser : IIstacConstructionFileParser
{
    private static readonly string[] RequiredColumns =
    [
        "TIME_PERIOD_CODE", "MEDIDAS_CODE", "TERRITORIO_CODE", "OBS_VALUE", "ESTADO_OBSERVACION_CODE"
    ];

    private static readonly Regex MonthlyPeriodPattern = new(
        @"^(?<year>\d{4})-M(?<month>\d{2})$", RegexOptions.Compiled);

    private static readonly IReadOnlyDictionary<string, (string Phase, string Regime)> Measures =
        new Dictionary<string, (string, string)>
        {
            ["VIVIENDAS_INICIADAS_LIBRES"] = ("iniciada", "libre"),
            ["VIVIENDAS_INICIADAS_PROTEGIDAS"] = ("iniciada", "protegida"),
            ["VIVIENDAS_TERMINADAS_LIBRES"] = ("terminada", "libre"),
            ["VIVIENDAS_TERMINADAS_PROTEGIDAS"] = ("terminada", "protegida")
        };

    public IReadOnlyList<ParsedConstructionRow> Parse(Stream xlsxStream)
    {
        using var reader = ExcelReaderFactory.CreateReader(xlsxStream);

        if (!reader.Read())
        {
            throw new InvalidOperationException("IstacConstructionFileParser: el fichero esta vacio.");
        }

        var columns = MapHeader(reader);
        var rows = new List<ParsedConstructionRow>();

        while (reader.Read())
        {
            var period = Cell(reader, columns["TIME_PERIOD_CODE"]);
            var match = MonthlyPeriodPattern.Match(period);
            if (!match.Success)
            {
                continue; // fila anual
            }

            if (!Measures.TryGetValue(Cell(reader, columns["MEDIDAS_CODE"]), out var measure))
            {
                continue; // medida total o desconocida
            }

            if (!IstacTerritoryCodes.ToProvinceCode.TryGetValue(Cell(reader, columns["TERRITORIO_CODE"]), out var provinceCode))
            {
                continue; // Espana o CCAA pluriprovincial
            }

            // Vacio = sin dato (2002-2007 completo, y Soria libre iniciada de 2026): no se inserta fila.
            var rawValue = Cell(reader, columns["OBS_VALUE"]);
            if (!decimal.TryParse(rawValue, NumberStyles.Number, CultureInfo.InvariantCulture, out var value))
            {
                continue;
            }

            var isProvisional = Cell(reader, columns["ESTADO_OBSERVACION_CODE"]) == "P";

            rows.Add(new ParsedConstructionRow(
                provinceCode,
                new DateOnly(
                    int.Parse(match.Groups["year"].Value, CultureInfo.InvariantCulture),
                    int.Parse(match.Groups["month"].Value, CultureInfo.InvariantCulture),
                    1),
                measure.Phase,
                measure.Regime,
                (int)value,
                isProvisional));
        }

        // Mejor fallar visible que dejar la tabla sin tocar en silencio si el formato cambia.
        if (rows.Count == 0)
        {
            throw new InvalidOperationException(
                "IstacConstructionFileParser: no se obtuvo ninguna fila valida. " +
                "El formato del fichero del ISTAC puede haber cambiado.");
        }

        return rows;
    }

    private static Dictionary<string, int> MapHeader(IExcelDataReader reader)
    {
        var map = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        for (var i = 0; i < reader.FieldCount; i++)
        {
            var name = Convert.ToString(reader.GetValue(i), CultureInfo.InvariantCulture)?.Trim();
            if (!string.IsNullOrEmpty(name))
            {
                map[name] = i;
            }
        }

        var missing = RequiredColumns.Where(c => !map.ContainsKey(c)).ToList();
        if (missing.Count > 0)
        {
            throw new InvalidOperationException(
                $"IstacConstructionFileParser: faltan columnas en la cabecera: {string.Join(", ", missing)}.");
        }

        return map;
    }

    private static string Cell(IExcelDataReader reader, int index) =>
        index < reader.FieldCount
            ? Convert.ToString(reader.GetValue(index), CultureInfo.InvariantCulture)?.Trim() ?? string.Empty
            : string.Empty;
}
