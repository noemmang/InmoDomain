using System.Text.Json;
using Azure.Messaging.ServiceBus;
using Analytics.Services;

namespace Analytics.Events;

public class ServiceBusEventConsumer : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ServiceBusEventConsumer> _logger;

    private ServiceBusClient? _client;
    private ServiceBusProcessor? _propertySalesProcessor;
    private ServiceBusProcessor? _appraisedValuesProcessor;

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

        _propertySalesProcessor = _client.CreateProcessor(EventTopics.ComprasVentasImportadas, EventTopics.AnalyticsSubscription);
        _propertySalesProcessor.ProcessMessageAsync += ProcessPropertySalesMessageAsync;
        _propertySalesProcessor.ProcessErrorAsync += ProcessErrorAsync;

        _appraisedValuesProcessor = _client.CreateProcessor(EventTopics.PreciosImportados, EventTopics.AnalyticsSubscription);
        _appraisedValuesProcessor.ProcessMessageAsync += ProcessAppraisedValuesMessageAsync;
        _appraisedValuesProcessor.ProcessErrorAsync += ProcessErrorAsync;

        await _propertySalesProcessor.StartProcessingAsync(stoppingToken);
        await _appraisedValuesProcessor.StartProcessingAsync(stoppingToken);

        _logger.LogInformation("Consumidor de eventos de Analytics conectado y escuchando.");

        try
        {
            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (OperationCanceledException)
        {
        }
    }

    private async Task ProcessPropertySalesMessageAsync(ProcessMessageEventArgs args)
    {
        var envelope = JsonSerializer.Deserialize<ImportEventEnvelope>(args.Message.Body.ToString())
            ?? throw new InvalidOperationException("No se pudo deserializar el evento ComprasVentasImportadas.");

        using var scope = _scopeFactory.CreateScope();
        var calculationService = scope.ServiceProvider.GetRequiredService<IAnalyticsCalculationService>();

        await calculationService.RecalculateActivityAsync(envelope.Period, envelope.ProvinceCodes);

        await args.CompleteMessageAsync(args.Message);
    }

    private async Task ProcessAppraisedValuesMessageAsync(ProcessMessageEventArgs args)
    {
        var envelope = JsonSerializer.Deserialize<ImportEventEnvelope>(args.Message.Body.ToString())
            ?? throw new InvalidOperationException("No se pudo deserializar el evento PreciosImportados.");

        using var scope = _scopeFactory.CreateScope();
        var calculationService = scope.ServiceProvider.GetRequiredService<IAnalyticsCalculationService>();

        await calculationService.RecalculatePriceAsync(envelope.Period, envelope.ProvinceCodes);

        await args.CompleteMessageAsync(args.Message);
    }

    private Task ProcessErrorAsync(ProcessErrorEventArgs args)
    {
        _logger.LogError(args.Exception, "Error en el consumidor de Service Bus ({ErrorSource}).", args.ErrorSource);
        return Task.CompletedTask;
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        if (_propertySalesProcessor is not null)
        {
            await _propertySalesProcessor.StopProcessingAsync(cancellationToken);
        }

        if (_appraisedValuesProcessor is not null)
        {
            await _appraisedValuesProcessor.StopProcessingAsync(cancellationToken);
        }

        if (_client is not null)
        {
            await _client.DisposeAsync();
        }

        await base.StopAsync(cancellationToken);
    }
}