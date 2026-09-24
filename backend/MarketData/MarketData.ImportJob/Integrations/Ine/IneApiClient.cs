using System.Net.Http;
using System.Net.Http.Json;
using System.Threading;
using MarketData.ImportJob.Integrations.Ine.Dtos;

namespace MarketData.ImportJob.Integrations.Ine;

// HttpClient tipado, registrado en DI con BaseAddress = https://servicios.ine.es/wstempus/js/ES/
// (ver Program.cs). Una llamada por valor de DwellingStatus: sin filtrar provincia
// ni regimen, la tabla 6150 devuelve las ~52 provincias de una vez para ese estado.
public class IneApiClient : IIneApiClient
{
    private readonly HttpClient _httpClient;

    public IneApiClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<IReadOnlyList<IneHousingSaleRecord>> GetHousingSalesAsync(
        DwellingStatus status,
        int lastPeriods,
        CancellationToken cancellationToken = default)
    {
        var statusValueId = IneMetadataCatalog.DwellingStatusValueIds[status];

        var requestUri = $"DATOS_TABLA/6150?tv={IneMetadataCatalog.DwellingStatusVariableId}:{statusValueId}&nult={lastPeriods}&tip=AM";

        var series = await _httpClient.GetFromJsonAsync<List<IneSeriesResponse>>(requestUri, cancellationToken)
            ?? [];

        var records = new List<IneHousingSaleRecord>();

        foreach (var serie in series)
        {
            // La respuesta mezcla series a nivel Nacional, Comunidad Autonoma y
            // Provincia en el mismo listado (con duplicados reales detectados para
            // las 6 comunidades uniprovinciales). Solo nos interesan las de provincia,
            // identificables por tener una entrada de MetaData cuya variable es
            // "Provincias"; su campo Codigo ya trae el codigo INE de 2 digitos.
            var provinceMeta = serie.MetaData.FirstOrDefault(m => m.Variable == "Provincias");
            if (provinceMeta is null)
            {
                continue;
            }

            foreach (var dataPoint in serie.Data)
            {
                records.Add(new IneHousingSaleRecord(
                    ProvinceCode: provinceMeta.Codigo,
                    Period: new DateOnly(dataPoint.Fecha.Year, dataPoint.Fecha.Month, 1),
                    OperationsCount: (int)dataPoint.Valor));
            }
        }

        return records;
    }
}
