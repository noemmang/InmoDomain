using System.Text.Json.Serialization;

namespace MarketData.ImportJob.Integrations.Ine.Dtos;

// Forma verificada contra una respuesta real de DATOS_TABLA/6150?tip=AM. El
// endpoint devuelve un array de estos objetos, uno por serie.
public class IneSeriesResponse
{
    [JsonPropertyName("COD")]
    public string Cod { get; set; } = string.Empty;

    [JsonPropertyName("Nombre")]
    public string Nombre { get; set; } = string.Empty;

    [JsonPropertyName("MetaData")]
    public List<IneSeriesMetadata> MetaData { get; set; } = [];

    [JsonPropertyName("Data")]
    public List<IneDataPoint> Data { get; set; } = [];
}
