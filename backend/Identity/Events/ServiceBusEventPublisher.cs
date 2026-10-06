using System.Text.Json;
using Azure.Messaging.ServiceBus;

namespace Identity.Events;

public class ServiceBusEventPublisher : IEventPublisher, IAsyncDisposable
{
    private readonly ServiceBusClient _client;
    private readonly ServiceBusSender _sender;

    public ServiceBusEventPublisher(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("ServiceBus")
            ?? throw new InvalidOperationException("Falta ConnectionStrings:ServiceBus en la configuración.");

        _client = new ServiceBusClient(connectionString);
        _sender = _client.CreateSender(EventTopics.ContrasenaCambiada);
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
        await _sender.SendMessageAsync(message);
    }

    public async ValueTask DisposeAsync()
    {
        await _sender.DisposeAsync();
        await _client.DisposeAsync();
    }
}