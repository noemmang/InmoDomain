using System.Text;
using MarketData.Data;
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

using var host = builder.Build();

// nult del INE: cuantos meses recientes se piden en cada ejecucion. 3 da margen
// para que una cifra "Provisional" pase a "Definitiva" en una ejecucion posterior
// sin tener que releer toda la serie historica.
const int LastPeriods = 3;

var logger = host.Services.GetRequiredService<ILogger<Program>>();

try
{
    using var scope = host.Services.CreateScope();

    var housingSaleRunner = scope.ServiceProvider.GetRequiredService<HousingSaleImportRunner>();
    await housingSaleRunner.RunAsync(LastPeriods);

    var appraisedValueRunner = scope.ServiceProvider.GetRequiredService<AppraisedValueImportRunner>();
    await appraisedValueRunner.RunAsync();

    logger.LogInformation("ImportJob completado correctamente.");
}
catch (Exception ex)
{
    logger.LogError(ex, "ImportJob ha fallado.");
    Environment.ExitCode = 1;
}