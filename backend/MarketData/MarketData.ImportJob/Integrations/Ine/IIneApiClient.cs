using System.Threading;

namespace MarketData.ImportJob.Integrations.Ine;

public interface IIneApiClient
{
    // Devuelve una fila por provincia y periodo para el estado de vivienda dado
    // (nueva o segunda mano), mezclando regimen libre y protegido - ver nota de
    // diseño en IneMetadataCatalog sobre por que no se filtra por regimen.
    // lastPeriods es el parametro nult del INE: cuantos periodos mas recientes pedir.
    Task<IReadOnlyList<IneHousingSaleRecord>> GetHousingSalesAsync(
        DwellingStatus status,
        int lastPeriods,
        CancellationToken cancellationToken = default);
}
