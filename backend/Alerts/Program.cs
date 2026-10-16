using System.Security.Cryptography;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Alerts.Data;
using Alerts.Events;
using Alerts.Integrations.Analytics;
using Alerts.Integrations.Property;
using Alerts.Repositories;
using Alerts.Services;

var builder = WebApplication.CreateBuilder(args);

var publicKeyBase64 = builder.Configuration["Jwt:PublicKey"]
    ?? throw new InvalidOperationException("Falta Jwt:PublicKey en User Secrets.");
var issuer = builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException("Falta Jwt:Issuer en la configuración.");
var audience = builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException("Falta Jwt:Audience en la configuración.");

// Importa la clave pública RS256 aceptando tanto RSAPublicKey (PKCS#1) como SubjectPublicKeyInfo (X.509).
var publicKeyBytes = Convert.FromBase64String(publicKeyBase64);
var publicRsa = RSA.Create();
try
{
    publicRsa.ImportRSAPublicKey(publicKeyBytes, out _);
}
catch (CryptographicException)
{
    publicRsa.ImportSubjectPublicKeyInfo(publicKeyBytes, out _);
}
var validationKey = new RsaSecurityKey(publicRsa);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AlertsDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Alerts")));

builder.Services.AddScoped<IAlertRepository, AlertRepository>();
builder.Services.AddScoped<IAlertService, AlertService>();
builder.Services.AddScoped<IAlertEvaluationService, AlertEvaluationService>();

builder.Services.AddSingleton<IEventPublisher, ServiceBusEventPublisher>();
builder.Services.AddHostedService<ServiceBusEventConsumer>();

// Llamada síncrona a Property (sin pasar por el Gateway) para validar codigo_provincia.
builder.Services.AddHttpClient<IPropertyClient, PropertyClient>(client =>
{
    var baseUrl = builder.Configuration["PropertyApi:BaseUrl"]
        ?? throw new InvalidOperationException("Falta PropertyApi:BaseUrl en la configuración.");

    client.BaseAddress = new Uri(baseUrl);
    client.Timeout = TimeSpan.FromSeconds(10);
});

// Llamada síncrona a la API interna de Analytics (sin pasar por el Gateway) para leer el valor
// actual de una métrica, protegida con la clave compartida X-Internal-Api-Key.
builder.Services.AddHttpClient<IAnalyticsClient, AnalyticsClient>(client =>
{
    var baseUrl = builder.Configuration["AnalyticsApi:BaseUrl"]
        ?? throw new InvalidOperationException("Falta AnalyticsApi:BaseUrl en la configuración.");
    var apiKey = builder.Configuration["AnalyticsApi:ApiKey"]
        ?? throw new InvalidOperationException("Falta AnalyticsApi:ApiKey en User Secrets.");

    client.BaseAddress = new Uri(baseUrl);
    client.Timeout = TimeSpan.FromSeconds(10);
    client.DefaultRequestHeaders.Add("X-Internal-Api-Key", apiKey);
});

// Validación del JWT con los mismos parámetros que Identity, el Gateway, Property y Analytics.
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateAudience = true,
            ValidAudience = audience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = validationKey,
            ValidAlgorithms = [SecurityAlgorithms.RsaSha256],
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();