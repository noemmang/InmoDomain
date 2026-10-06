using System.Text.Json.Serialization;

namespace Identity.Events;

public class PasswordChangedEvent
{
    [JsonPropertyName("id_evento")]
    public Guid EventId { get; set; }

    [JsonPropertyName("tipo_evento")]
    public string EventType { get; set; } = EventTopics.ContrasenaCambiada;

    [JsonPropertyName("fecha_ocurrencia")]
    public DateTimeOffset OccurredAt { get; set; }

    [JsonPropertyName("usuario_id")]
    public Guid UserId { get; set; }
}