using Microsoft.EntityFrameworkCore;
using Alerts.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AlertsDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Alerts")));

var app = builder.Build();

app.Run();