using System.Text.Json;
using Azure.Messaging.ServiceBus;

namespace Alerts.Events;

/// <summary>
/// Publica eventos de Alerts en Azure Service Bus. El cliente y el sender se crean de forma
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

    public async Task PublishAlertTriggeredAsync(AlertTriggeredEvent alertTriggeredEvent)
    {
        var message = new ServiceBusMessage(JsonSerializer.Serialize(alertTriggeredEvent));
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
                _sender = client.CreateSender(EventTopics.AlertaDisparada);
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