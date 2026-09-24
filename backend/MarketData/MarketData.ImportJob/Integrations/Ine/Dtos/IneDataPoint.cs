using System.Text.Json.Serialization;

namespace MarketData.ImportJob.Integrations.Ine.Dtos;

public class IneDataPoint
{
    // Texto ISO-8601 con offset (ej. "2026-06-01T00:00:00.000+02:00"), no epoch ms.
    // DateTimeOffset lo deserializa nativamente con System.Text.Json.
    [JsonPropertyName("Fecha")]
    public DateTimeOffset Fecha { get; set; }

    [JsonPropertyName("T3_TipoDato")]
    public string TipoDato { get; set; } = string.Empty;

    [JsonPropertyName("T3_Periodo")]
    public string Periodo { get; set; } = string.Empty;

    [JsonPropertyName("Anyo")]
    public int Anyo { get; set; }

    [JsonPropertyName("Valor")]
    public decimal Valor { get; set; }
}
