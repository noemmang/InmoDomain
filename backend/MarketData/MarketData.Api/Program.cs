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

app.UseMiddleware<ApiKeyMiddleware>();

app.MapControllers();

app.Run();