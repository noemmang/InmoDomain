using MarketData.Data;
using MarketData.Data.Models;
using MarketData.ImportJob.Integrations.Istac;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace MarketData.ImportJob.Import;

// Descarga el cubo del ISTAC (viviendas iniciadas/terminadas, libres y protegidas) y hace
// upsert contra construccion_vivienda. Igual que MIVAU: no hay "solo lo ultimo", se relee el
// fichero completo (~45.000 filas utiles desde 2008) y se compara contra la tabla precargada.
// Las cifras de 2025 y 2026 llegan como provisionales (es_provisional) y se revisan, por eso
// el upsert compara tambien ese flag.
public class ConstructionImportRunner
{
    private const string DatasetUrl =
        "https://datos.canarias.es/api/estadisticas/statistical-resources/v1.0/datasets/ISTAC/E25004A_000001/";

    // El ISTAC publica cada actualizacion como una version nueva (1.24, 1.25, 1.26...) y el
    // numero va en la URL. Se prueba primero el alias de "ultima version" y, si el servidor no
    // lo acepta, la version 1.25 verificada (con un aviso en el log: quedaria desactualizada).
    // Import:IstacConstructionUrl, si esta definida, manda sobre las dos.
    private static readonly string[] DefaultUrls =
    [
        DatasetUrl + "~latest.xlsx",
        DatasetUrl + "1.25.xlsx"
    ];

    private readonly HttpClient _httpClient;
    private readonly IIstacConstructionFileParser _parser;
    private readonly MarketDataDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ConstructionImportRunner> _logger;

    public ConstructionImportRunner(
        HttpClient httpClient,
        IIstacConstructionFileParser parser,
        MarketDataDbContext dbContext,
        IConfiguration configuration,
        ILogger<ConstructionImportRunner> logger)
    {
        _httpClient = httpClient;
        _parser = parser;
        _dbContext = dbContext;
        _configuration = configuration;
        _logger = logger;
    }

    // Devuelve los meses con filas insertadas o actualizadas y las provincias afectadas.
    public async Task<IReadOnlyList<ChangedPeriod>> RunAsync(CancellationToken cancellationToken = default)
    {
        var candidates = await LoadCandidatesAsync(cancellationToken);

        var existing = await _dbContext.ConstructionActivities
            .ToDictionaryAsync(e => (e.ProvinceCode, e.Period, e.Phase, e.Regime), cancellationToken);

        var inserted = 0;
        var updated = 0;
        var changes = new Dictionary<DateOnly, HashSet<string>>();

        foreach (var candidate in candidates)
        {
            var key = (candidate.ProvinceCode, candidate.Period, candidate.Phase, candidate.Regime);

            if (existing.TryGetValue(key, out var entity))
            {
                if (entity.DwellingsCount != candidate.DwellingsCount || entity.IsProvisional != candidate.IsProvisional)
                {
                    entity.DwellingsCount = candidate.DwellingsCount;
                    entity.IsProvisional = candidate.IsProvisional;
                    updated++;
                    RegisterChange(changes, candidate.Period, candidate.ProvinceCode);
                }
            }
            else
            {
                _dbContext.ConstructionActivities.Add(new ConstructionActivity
                {
                    Id = Guid.NewGuid(),
                    ProvinceCode = candidate.ProvinceCode,
                    Period = candidate.Period,
                    Phase = candidate.Phase,
                    Regime = candidate.Regime,
                    DwellingsCount = candidate.DwellingsCount,
                    IsProvisional = candidate.IsProvisional
                });
                inserted++;
                RegisterChange(changes, candidate.Period, candidate.ProvinceCode);
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Construccion: {Inserted} filas nuevas, {Updated} actualizadas, {Unchanged} sin cambios (de {Total} candidatas).",
            inserted, updated, candidates.Count - inserted - updated, candidates.Count);

        return changes
            .OrderBy(c => c.Key)
            .Select(c => new ChangedPeriod(c.Key, c.Value.OrderBy(code => code, StringComparer.Ordinal).ToList()))
            .ToList();
    }

    // Descarga y lee el fichero. Un fallo de red o de formato solo pasa a la URL siguiente si queda
    // alguna; en la ultima se propaga para que la etapa falle de forma visible.
    private async Task<IReadOnlyList<ParsedConstructionRow>> LoadCandidatesAsync(CancellationToken cancellationToken)
    {
        var configured = _configuration["Import:IstacConstructionUrl"];
        var urls = string.IsNullOrWhiteSpace(configured) ? DefaultUrls : new[] { configured };

        for (var i = 0; i < urls.Length; i++)
        {
            try
            {
                await using var httpStream = await _httpClient.GetStreamAsync(urls[i], cancellationToken);

                // ExcelDataReader necesita poder buscar hacia atras/adelante en el stream.
                using var seekableStream = new MemoryStream();
                await httpStream.CopyToAsync(seekableStream, cancellationToken);
                seekableStream.Position = 0;

                var rows = _parser.Parse(seekableStream);
                _logger.LogInformation("ISTAC construccion: {RowCount} filas leidas de {Url}.", rows.Count, urls[i]);

                if (i > 0)
                {
                    _logger.LogWarning(
                        "Se uso la version fija {Url}: el alias de ultima version no funciono, asi que las cifras pueden estar desactualizadas.",
                        urls[i]);
                }

                return rows;
            }
            catch (Exception ex) when (i < urls.Length - 1 && ex is HttpRequestException or InvalidOperationException)
            {
                _logger.LogWarning(ex, "No se pudo leer {Url}; se prueba la siguiente.", urls[i]);
            }
        }

        throw new InvalidOperationException("No se pudo obtener el fichero de construccion del ISTAC.");
    }

    private static void RegisterChange(Dictionary<DateOnly, HashSet<string>> changes, DateOnly period, string provinceCode)
    {
        if (!changes.TryGetValue(period, out var provinceCodes))
        {
            provinceCodes = new HashSet<string>();
            changes[period] = provinceCodes;
        }

        provinceCodes.Add(provinceCode);
    }
}
