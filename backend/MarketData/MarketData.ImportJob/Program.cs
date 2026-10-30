using System.Text;
using MarketData.Data;
using MarketData.ImportJob.Events;
using MarketData.ImportJob.Import;
using MarketData.ImportJob.Integrations.Ine;
using MarketData.ImportJob.Integrations.Mivau;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Http.Resilience;
using Microsoft.Extensions.Logging;
using Polly;

// Requerido por ExcelDataReader para leer .xls antiguos (paginas de codigo no
// registradas por defecto en .NET Core) - una vez al arrancar, antes de leer nada.
Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddDbContext<MarketDataDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("MarketData")));

// Retry + timeout por intento para las llamadas al INE y a MIVAU (Fase 6).
// Sin circuit breaker: el job hace una unica ejecucion y termina, sin llamadas
// posteriores dentro del mismo proceso a las que un circuito abierto beneficie.
// El predicado por defecto de HttpRetryStrategyOptions ya distingue fallos
// transitorios (timeout, error de red, 5xx, 408) -que son los que reintenta-
// de fallos persistentes (404, formato inesperado), que no se reintentan y
// deben fallar explicitos.
static void AddRetryAndTimeout(ResiliencePipelineBuilder<HttpResponseMessage> pipeline)
{
    pipeline.AddRetry(new HttpRetryStrategyOptions
    {
        MaxRetryAttempts = 3,
        BackoffType = DelayBackoffType.Exponential,
        UseJitter = true,
        Delay = TimeSpan.FromSeconds(2)
    });

    pipeline.AddTimeout(new HttpTimeoutStrategyOptions
    {
        Timeout = TimeSpan.FromSeconds(10)
    });
}

builder.Services.AddHttpClient<IIneApiClient, IneApiClient>(client =>
        client.BaseAddress = new Uri("https://servicios.ine.es/wstempus/js/ES/"))
    .AddResilienceHandler("ine-retry-timeout", AddRetryAndTimeout);

builder.Services.AddSingleton<IMivauFileParser, MivauFileParser>();

builder.Services.AddScoped<HousingSaleImportRunner>();
builder.Services.AddHttpClient<AppraisedValueImportRunner>()
    .AddResilienceHandler("mivau-retry-timeout", AddRetryAndTimeout);

builder.Services.AddSingleton<IEventPublisher, ServiceBusEventPublisher>();

using var host = builder.Build();

// nult del INE: cuantos meses recientes se piden en cada ejecucion. 3 (valor por defecto) da margen
// para que una cifra "Provisional" pase a "Definitiva" en una ejecucion posterior sin releer toda
// la serie historica. Para la carga historica inicial se lanza una unica vez con Import__LastPeriods=60.
var lastPeriods = host.Services.GetRequiredService<IConfiguration>().GetValue<int?>("Import:LastPeriods") ?? 3;
if (lastPeriods < 1)
{
    throw new InvalidOperationException("Import:LastPeriods debe ser un entero mayor o igual que 1.");
}

var logger = host.Services.GetRequiredService<ILogger<Program>>();

// Cada etapa (importar y publicar) es independiente: si una falla, la otra se ejecuta igualmente
// y el proceso termina con codigo de salida 1.
async Task<bool> RunStageAsync(string name, Func<Task> stage)
{
    try
    {
        await stage();
        return true;
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "La etapa {Stage} del ImportJob ha fallado.", name);
        return false;
    }
}

using var scope = host.Services.CreateScope();
var publisher = host.Services.GetRequiredService<IEventPublisher>();

var housingSalesOk = await RunStageAsync("compraventas", async () =>
{
    var runner = scope.ServiceProvider.GetRequiredService<HousingSaleImportRunner>();
    var changes = await runner.RunAsync(lastPeriods);
    await publisher.PublishImportedAsync(EventTopics.ComprasVentasImportadas, changes);

    logger.LogInformation("Compraventas: {Count} periodos con cambios publicados.", changes.Count);
});

var appraisedValuesOk = await RunStageAsync("precios", async () =>
{
    var runner = scope.ServiceProvider.GetRequiredService<AppraisedValueImportRunner>();
    var changes = await runner.RunAsync();
    await publisher.PublishImportedAsync(EventTopics.PreciosImportados, changes);

    logger.LogInformation("Precios: {Count} periodos con cambios publicados.", changes.Count);
});

if (housingSalesOk && appraisedValuesOk)
{
    logger.LogInformation("ImportJob completado correctamente.");
}
else
{
    logger.LogError("ImportJob terminado con errores.");
    Environment.ExitCode = 1;
}