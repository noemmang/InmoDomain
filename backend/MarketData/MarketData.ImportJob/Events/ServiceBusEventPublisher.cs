using System.Text.Json;
using Azure.Messaging.ServiceBus;
using MarketData.ImportJob.Import;
using Microsoft.Extensions.Configuration;

namespace MarketData.ImportJob.Events;

// Publica eventos de importacion en Azure Service Bus. El cliente y el sender de cada topic
// se crean de forma perezosa en la primera publicacion, sin cachear fallos de creacion.
public class ServiceBusEventPublisher : IEventPublisher, IAsyncDisposable
{
    private readonly IConfiguration _configuration;
    private readonly object _lock = new();
    private readonly Dictionary<string, ServiceBusSender> _senders = new();

    private ServiceBusClient? _client;

    public ServiceBusEventPublisher(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    // Un evento por periodo con cambios, en orden cronologico.
    public async Task PublishImportedAsync(string topic, IReadOnlyList<ChangedPeriod> changes)
    {
        if (changes.Count == 0)
        {
            return;
        }

        var sender = GetSender(topic);

        foreach (var change in changes.OrderBy(c => c.Period))
        {
            var importEvent = new ImportEvent
            {
                EventId = Guid.NewGuid(),
                EventType = topic,
                OccurredAt = DateTimeOffset.UtcNow,
                Period = change.Period,
                ProvinceCodes = change.ProvinceCodes.ToList()
            };

            var message = new ServiceBusMessage(JsonSerializer.Serialize(importEvent))
            {
                MessageId = importEvent.EventId.ToString()
            };

            await sender.SendMessageAsync(message);
        }
    }

    private ServiceBusSender GetSender(string topic)
    {
        lock (_lock)
        {
            if (_senders.TryGetValue(topic, out var existing))
            {
                return existing;
            }

            if (_client is null)
            {
                var connectionString = _configuration.GetConnectionString("ServiceBus");
                if (string.IsNullOrWhiteSpace(connectionString))
                {
                    throw new InvalidOperationException("Falta ConnectionStrings:ServiceBus en la configuración.");
                }

                _client = new ServiceBusClient(connectionString);
            }

            var sender = _client.CreateSender(topic);
            _senders[topic] = sender;
            return sender;
        }
    }

    public async ValueTask DisposeAsync()
    {
        foreach (var sender in _senders.Values)
        {
            await sender.DisposeAsync();
        }

        if (_client is not null)
        {
            await _client.DisposeAsync();
        }
    }
}