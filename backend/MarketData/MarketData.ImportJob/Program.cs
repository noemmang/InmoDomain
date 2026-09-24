using System.Text;
using MarketData.Data;
using MarketData.ImportJob.Import;
using MarketData.ImportJob.Integrations.Ine;
using MarketData.ImportJob.Integrations.Mivau;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

// Requerido por ExcelDataReader para leer .xls antiguos (paginas de codigo no
// registradas por defecto en .NET Core) - una vez al arrancar, antes de leer nada.
Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddDbContext<MarketDataDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("MarketData")));

builder.Services.AddHttpClient<IIneApiClient, IneApiClient>(client =>
    client.BaseAddress = new Uri("https://servicios.ine.es/wstempus/js/ES/"));

builder.Services.AddSingleton<IMivauFileParser, MivauFileParser>();

builder.Services.AddScoped<HousingSaleImportRunner>();
builder.Services.AddHttpClient<AppraisedValueImportRunner>();

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
