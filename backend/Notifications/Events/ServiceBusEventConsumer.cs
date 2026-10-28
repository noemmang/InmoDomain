using System.Text.Json;
using Azure.Messaging.ServiceBus;
using Notifications.Services;

namespace Notifications.Events;

public class ServiceBusEventConsumer : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ServiceBusEventConsumer> _logger;

    private ServiceBusClient? _client;
    private ServiceBusProcessor? _alertTriggeredProcessor;
    private ServiceBusProcessor? _passwordChangedProcessor;

    public ServiceBusEventConsumer(
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        ILogger<ServiceBusEventConsumer> logger)
    {
        _scopeFactory = scopeFactory;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var connectionString = _configuration.GetConnectionString("ServiceBus")
            ?? throw new InvalidOperationException("Falta ConnectionStrings:ServiceBus en la configuración.");

        _client = new ServiceBusClient(connectionString);

        _alertTriggeredProcessor = _client.CreateProcessor(
            EventTopics.AlertaDisparada, EventTopics.NotificationsSubscription);
        _alertTriggeredProcessor.ProcessMessageAsync += ProcessAlertTriggeredMessageAsync;
        _alertTriggeredProcessor.ProcessErrorAsync += ProcessErrorAsync;

        _passwordChangedProcessor = _client.CreateProcessor(
            EventTopics.ContrasenaCambiada, EventTopics.NotificationsSubscription);
        _passwordChangedProcessor.ProcessMessageAsync += ProcessPasswordChangedMessageAsync;
        _passwordChangedProcessor.ProcessErrorAsync += ProcessErrorAsync;

        await _alertTriggeredProcessor.StartProcessingAsync(stoppingToken);
        await _passwordChangedProcessor.StartProcessingAsync(stoppingToken);

        _logger.LogInformation("Consumidor de eventos de Notifications conectado y escuchando.");

        try
        {
            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (OperationCanceledException)
        {
        }
    }

    private async Task ProcessAlertTriggeredMessageAsync(ProcessMessageEventArgs args)
    {
        var envelope = JsonSerializer.Deserialize<AlertTriggeredEvent>(args.Message.Body.ToString())
            ?? throw new InvalidOperationException("No se pudo deserializar el evento AlertaDisparada.");

        using var scope = _scopeFactory.CreateScope();
        var creationService = scope.ServiceProvider.GetRequiredService<INotificationCreationService>();

        await creationService.CreateFromAlertTriggeredAsync(envelope);

        await args.CompleteMessageAsync(args.Message);
    }

    private async Task ProcessPasswordChangedMessageAsync(ProcessMessageEventArgs args)
    {
        var envelope = JsonSerializer.Deserialize<PasswordChangedEvent>(args.Message.Body.ToString())
            ?? throw new InvalidOperationException("No se pudo deserializar el evento ContrasenaCambiada.");

        using var scope = _scopeFactory.CreateScope();
        var creationService = scope.ServiceProvider.GetRequiredService<INotificationCreationService>();

        await creationService.CreateFromPasswordChangedAsync(envelope);

        await args.CompleteMessageAsync(args.Message);
    }

    private Task ProcessErrorAsync(ProcessErrorEventArgs args)
    {
        _logger.LogError(args.Exception, "Error en el consumidor de Service Bus ({ErrorSource}).", args.ErrorSource);
        return Task.CompletedTask;
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        if (_alertTriggeredProcessor is not null)
        {
            await _alertTriggeredProcessor.StopProcessingAsync(cancellationToken);
        }

        if (_passwordChangedProcessor is not null)
        {
            await _passwordChangedProcessor.StopProcessingAsync(cancellationToken);
        }

        if (_client is not null)
        {
            await _client.DisposeAsync();
        }

        await base.StopAsync(cancellationToken);
    }
}