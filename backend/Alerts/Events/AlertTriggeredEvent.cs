using System.Text.Json.Serialization;

namespace Alerts.Events;

public class AlertTriggeredEvent
{
    [JsonPropertyName("id_evento")]
    public Guid EventId { get; set; }

    [JsonPropertyName("tipo_evento")]
    public string EventType { get; set; } = EventTopics.AlertaDisparada;

    [JsonPropertyName("fecha_ocurrencia")]
    public DateTimeOffset OccurredAt { get; set; }

    [JsonPropertyName("id_alerta")]
    public Guid AlertId { get; set; }

    [JsonPropertyName("usuario_id")]
    public Guid UserId { get; set; }

    [JsonPropertyName("codigo_provincia")]
    public string ProvinceCode { get; set; } = string.Empty;

    [JsonPropertyName("metrica")]
    public string Metric { get; set; } = string.Empty;

    [JsonPropertyName("condicion")]
    public string Condition { get; set; } = string.Empty;

    [JsonPropertyName("umbral")]
    public decimal Threshold { get; set; }

    [JsonPropertyName("valor")]
    public decimal Value { get; set; }

    [JsonPropertyName("periodo")]
    public DateOnly Period { get; set; }
}