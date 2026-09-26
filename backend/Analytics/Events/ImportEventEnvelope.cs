using System.Text.Json.Serialization;

namespace Analytics.Events;

public class ImportEventEnvelope
{
    [JsonPropertyName("id_evento")]
    public Guid EventId { get; set; }

    [JsonPropertyName("tipo_evento")]
    public string EventType { get; set; } = string.Empty;

    [JsonPropertyName("fecha_ocurrencia")]
    public DateTimeOffset OccurredAt { get; set; }

    [JsonPropertyName("periodo")]
    public DateOnly Period { get; set; }

    [JsonPropertyName("codigos_provincia")]
    public List<string> ProvinceCodes { get; set; } = new();
}