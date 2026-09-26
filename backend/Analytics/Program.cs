using Microsoft.EntityFrameworkCore;
using Analytics.Data;
using Analytics.Repositories;
using Analytics.Services;
using Analytics.Integrations.MarketData;
using Analytics.Events;
using Analytics.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AnalyticsDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Analytics")));

builder.Services.AddScoped<IPropertyScoreRepository, PropertyScoreRepository>();
builder.Services.AddScoped<IProvinceAnalyticsService, ProvinceAnalyticsService>();
builder.Services.AddScoped<ICompareService, CompareService>();
builder.Services.AddScoped<IMetricValueService, MetricValueService>();
builder.Services.AddScoped<IAnalyticsCalculationService, AnalyticsCalculationService>();

builder.Services.AddHttpClient<IMarketDataClient, MarketDataClient>(client =>
{
    var baseUrl = builder.Configuration["MarketDataApi:BaseUrl"]
        ?? throw new InvalidOperationException("Falta MarketDataApi:BaseUrl en la configuración.");
    var apiKey = builder.Configuration["MarketDataApi:ApiKey"]
        ?? throw new InvalidOperationException("Falta MarketDataApi:ApiKey en la configuración.");

    client.BaseAddress = new Uri(baseUrl);
    client.DefaultRequestHeaders.Add("X-Internal-Api-Key", apiKey);
});

builder.Services.AddHostedService<ServiceBusEventConsumer>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseWhen(
    context => context.Request.Path.StartsWithSegments("/internal"),
    branch => branch.UseMiddleware<ApiKeyMiddleware>());

app.MapControllers();

app.Run();