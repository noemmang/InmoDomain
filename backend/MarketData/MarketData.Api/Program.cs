using MarketData.Data;
using MarketData.Api.Repositories;
using MarketData.Api.Services;
using MarketData.Api.Middleware;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<MarketDataDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("MarketData")));

builder.Services.AddScoped<IHousingSaleRepository, HousingSaleRepository>();
builder.Services.AddScoped<IAppraisedValueRepository, AppraisedValueRepository>();
builder.Services.AddScoped<IHousingSaleService, HousingSaleService>();
builder.Services.AddScoped<IAppraisedValueService, AppraisedValueService>();

builder.Services.AddControllers();

// Sonda de salud sin dependencias externas: no despierta Neon ni Service Bus.
builder.Services.AddHealthChecks();

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
}

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// La sonda de salud queda fuera de la clave interna: los probes de Container Apps no envían la cabecera.
app.UseWhen(
    context => !context.Request.Path.StartsWithSegments("/health"),
    branch => branch.UseMiddleware<ApiKeyMiddleware>());

app.MapHealthChecks("/health");
app.MapControllers();

app.Run();