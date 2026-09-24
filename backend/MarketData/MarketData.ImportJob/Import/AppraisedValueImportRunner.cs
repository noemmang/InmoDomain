using System.Net.Http;
using System.Threading;
using MarketData.Data;
using MarketData.Data.Models;
using MarketData.ImportJob.Integrations.Mivau;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MarketData.ImportJob.Import;

// Descarga los 2 .XLS de MIVAU y hace upsert contra valores_tasados. A diferencia
// del INE (que tiene nult), MIVAU no ofrece forma de pedir "solo lo ultimo": se
// relee el fichero completo en cada ejecucion (~6.700 filas totales, trivial) y se
// upsertea contra toda la tabla precargada en un diccionario (misma Opcion A que
// el runner de INE).
public class AppraisedValueImportRunner
{
    private readonly HttpClient _httpClient;
    private readonly IMivauFileParser _parser;
    private readonly MarketDataDbContext _dbContext;
    private readonly ILogger<AppraisedValueImportRunner> _logger;

    public AppraisedValueImportRunner(
        HttpClient httpClient,
        IMivauFileParser parser,
        MarketDataDbContext dbContext,
        ILogger<AppraisedValueImportRunner> logger)
    {
        _httpClient = httpClient;
        _parser = parser;
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task RunAsync(CancellationToken cancellationToken = default)
    {
        var candidates = new List<ParsedMivauRow>();

        foreach (var series in MivauSeriesDefinition.All)
        {
            await using var xlsStream = await _httpClient.GetStreamAsync(series.Url, cancellationToken);

            // ExcelDataReader necesita poder buscar hacia atras/adelante en el stream.
            using var seekableStream = new MemoryStream();
            await xlsStream.CopyToAsync(seekableStream, cancellationToken);
            seekableStream.Position = 0;

            var rows = _parser.Parse(seekableStream, series.Age);
            candidates.AddRange(rows);

            _logger.LogInformation("MIVAU {Age}: {RowCount} filas leidas de {Url}.", series.Age, rows.Count, series.Url);
        }

        if (candidates.Count == 0)
        {
            _logger.LogWarning("El parser MIVAU no devolvio ninguna fila; no se hace ningun cambio.");
            return;
        }

        // Se relee el fichero completo, asi que se precarga toda la tabla (no solo
        // un rango de periodos como en INE).
        var existing = await _dbContext.AppraisedValues
            .ToDictionaryAsync(e => (e.ProvinceCode, e.Period, e.Age), cancellationToken);

        var inserted = 0;
        var updated = 0;

        foreach (var candidate in candidates)
        {
            var key = (candidate.ProvinceCode, candidate.Period, candidate.Age);

            if (existing.TryGetValue(key, out var existingEntity))
            {
                if (existingEntity.PricePerSquareMeter != candidate.PricePerSquareMeter)
                {
                    existingEntity.PricePerSquareMeter = candidate.PricePerSquareMeter;
                    updated++;
                }
            }
            else
            {
                _dbContext.AppraisedValues.Add(new AppraisedValue
                {
                    Id = Guid.NewGuid(),
                    ProvinceCode = candidate.ProvinceCode,
                    Period = candidate.Period,
                    Age = candidate.Age,
                    PricePerSquareMeter = candidate.PricePerSquareMeter
                });
                inserted++;
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Valores tasados: {Inserted} filas nuevas, {Updated} actualizadas, {Unchanged} sin cambios (de {Total} candidatas).",
            inserted, updated, candidates.Count - inserted - updated, candidates.Count);
    }
}
