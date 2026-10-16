using System.Text.Json;
using Azure.Messaging.ServiceBus;
using Alerts.Services;

namespace Alerts.Events;

public class ServiceBusEventConsumer : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ServiceBusEventConsumer> _logger;

    private ServiceBusClient? _client;
    private ServiceBusProcessor? _indicesRecalculatedProcessor;

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

        _indicesRecalculatedProcessor = _client.CreateProcessor(EventTopics.IndicesRecalculados, EventTopics.AlertsSubscription);
        _indicesRecalculatedProcessor.ProcessMessageAsync += ProcessIndicesRecalculatedMessageAsync;
        _indicesRecalculatedProcessor.ProcessErrorAsync += ProcessErrorAsync;

        await _indicesRecalculatedProcessor.StartProcessingAsync(stoppingToken);

        _logger.LogInformation("Consumidor de eventos de Alerts conectado y escuchando.");

        try
        {
            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (OperationCanceledException)
        {
        }
    }

    private async Task ProcessIndicesRecalculatedMessageAsync(ProcessMessageEventArgs args)
    {
        var envelope = JsonSerializer.Deserialize<IndicesRecalculatedEvent>(args.Message.Body.ToString())
            ?? throw new InvalidOperationException("No se pudo deserializar el evento IndicesRecalculados.");

        using var scope = _scopeFactory.CreateScope();
        var evaluationService = scope.ServiceProvider.GetRequiredService<IAlertEvaluationService>();

        await evaluationService.EvaluateAsync(envelope.ProvinceCodes);

        await args.CompleteMessageAsync(args.Message);
    }

    private Task ProcessErrorAsync(ProcessErrorEventArgs args)
    {
        _logger.LogError(args.Exception, "Error en el consumidor de Service Bus ({ErrorSource}).", args.ErrorSource);
        return Task.CompletedTask;
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        if (_indicesRecalculatedProcessor is not null)
        {
            await _indicesRecalculatedProcessor.StopProcessingAsync(cancellationToken);
        }

        if (_client is not null)
        {
            await _client.DisposeAsync();
        }

        await base.StopAsync(cancellationToken);
    }
}