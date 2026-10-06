using System.Text.Json;
using Azure.Messaging.ServiceBus;

namespace Identity.Events;

/// <summary>
/// Publica eventos en Azure Service Bus. El cliente y el sender se crean de forma perezosa
/// en la primera publicación, de modo que una configuración ausente o incorrecta de
/// <c>ConnectionStrings:ServiceBus</c> solo afecta a la publicación (que AuthService ya
/// captura y registra) y no impide resolver <c>AuthService</c> ni atender el resto de endpoints.
/// Si la creación falla, no se cachea el error: el siguiente intento vuelve a probar.
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

    public async Task PublishPasswordChangedAsync(Guid userId)
    {
        var envelope = new PasswordChangedEvent
        {
            EventId = Guid.NewGuid(),
            OccurredAt = DateTimeOffset.UtcNow,
            UserId = userId
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
                _sender = client.CreateSender(EventTopics.ContrasenaCambiada);
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