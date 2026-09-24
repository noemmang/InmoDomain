using System.Threading;
using MarketData.Data;
using MarketData.Data.Models;
using MarketData.ImportJob.Integrations.Ine;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MarketData.ImportJob.Import;

// Trae los ultimos N periodos de compraventas (nueva y segunda mano, ver decision
// de diseno en IneMetadataCatalog sobre por que no se filtra por regimen) y hace
// upsert contra compraventas_vivienda con un diccionario de claves precargadas
// (Opcion A del diseno cerrado en Fase 5/Bloque 3), sin SQL crudo.
public class HousingSaleImportRunner
{
    private readonly IIneApiClient _ineApiClient;
    private readonly MarketDataDbContext _dbContext;
    private readonly ILogger<HousingSaleImportRunner> _logger;

    public HousingSaleImportRunner(
        IIneApiClient ineApiClient,
        MarketDataDbContext dbContext,
        ILogger<HousingSaleImportRunner> logger)
    {
        _ineApiClient = ineApiClient;
        _dbContext = dbContext;
        _logger = logger;
    }

    // lastPeriods es el nult que se pide al INE: cuantos meses mas recientes traer.
    public async Task RunAsync(int lastPeriods, CancellationToken cancellationToken = default)
    {
        var candidates = new List<(string ProvinceCode, DateOnly Period, DwellingStatus Status, int OperationsCount)>();

        foreach (var status in new[] { DwellingStatus.New, DwellingStatus.SecondHand })
        {
            var records = await _ineApiClient.GetHousingSalesAsync(status, lastPeriods, cancellationToken);

            foreach (var record in records)
            {
                candidates.Add((record.ProvinceCode, record.Period, status, record.OperationsCount));
            }
        }

        if (candidates.Count == 0)
        {
            _logger.LogWarning("El cliente INE no devolvio ninguna fila de compraventas; no se hace ningun cambio.");
            return;
        }

        var affectedPeriods = candidates.Select(c => c.Period).Distinct().ToList();

        var existing = await _dbContext.HousingSales
            .Where(e => affectedPeriods.Contains(e.Period))
            .ToDictionaryAsync(
                e => (e.ProvinceCode, e.Period, e.HousingStatus),
                cancellationToken);

        var inserted = 0;
        var updated = 0;

        foreach (var candidate in candidates)
        {
            var statusDbValue = candidate.Status.ToDbValue();
            var key = (candidate.ProvinceCode, candidate.Period, statusDbValue);

            if (existing.TryGetValue(key, out var existingEntity))
            {
                if (existingEntity.OperationsCount != candidate.OperationsCount)
                {
                    existingEntity.OperationsCount = candidate.OperationsCount;
                    updated++;
                }
            }
            else
            {
                _dbContext.HousingSales.Add(new HousingSale
                {
                    Id = Guid.NewGuid(),
                    ProvinceCode = candidate.ProvinceCode,
                    Period = candidate.Period,
                    HousingStatus = statusDbValue,
                    OperationsCount = candidate.OperationsCount
                });
                inserted++;
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Compraventas de vivienda: {Inserted} filas nuevas, {Updated} actualizadas, {Unchanged} sin cambios (de {Total} candidatas).",
            inserted, updated, candidates.Count - inserted - updated, candidates.Count);
    }
}
