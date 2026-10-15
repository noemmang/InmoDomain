using System.Text.Json;
using Azure.Messaging.ServiceBus;

namespace Analytics.Events;

/// <summary>
/// Publica eventos de Analytics en Azure Service Bus. El cliente y el sender se crean de forma
/// perezosa en la primera publicación, sin cachear fallos de creación.
/// </summary>
public class ServiceBusEventPublisher : IEventPublisher, IAsyncDisposable
{
    private readonly IConfiguration _configuration;
    private readonly object _lock = new();

    private ServiceBusClient? _client;
    private ServiceBusSender? _sender;

    public ServiceBusEventPublisher(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task PublishIndicesRecalculatedAsync(DateOnly period, IReadOnlyCollection<string> provinceCodes)
    {
        var envelope = new IndicesRecalculatedEvent
        {
            EventId = Guid.NewGuid(),
            OccurredAt = DateTimeOffset.UtcNow,
            Period = period,
            ProvinceCodes = provinceCodes.ToList()
        };

        var message = new ServiceBusMessage(JsonSerializer.Serialize(envelope));
        await GetSender().SendMessageAsync(message);
    }

    private ServiceBusSender GetSender()
    {
        if (_sender is not null)
        {
            return _sender;
        }

        lock (_lock)
        {
            if (_sender is not null)
            {
                return _sender;
            }

            var connectionString = _configuration.GetConnectionString("ServiceBus");
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new InvalidOperationException("Falta ConnectionStrings:ServiceBus en la configuración.");
            }

            var client = new ServiceBusClient(connectionString);
            try
            {
                _sender = client.CreateSender(EventTopics.IndicesRecalculados);
            }
            catch
            {
                client.DisposeAsync().AsTask().GetAwaiter().GetResult();
                throw;
            }

            _client = client;
            return _sender;
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_sender is not null)
        {
            await _sender.DisposeAsync();
        }

        if (_client is not null)
        {
            await _client.DisposeAsync();
        }
    }
}