using System.Security.Cryptography;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Analytics.Data;
using Analytics.Repositories;
using Analytics.Services;
using Analytics.Integrations.MarketData;
using Analytics.Integrations.Property;
using Analytics.Events;
using Analytics.Middleware;

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

// Llamada síncrona a Property (sin pasar por el Gateway) con el JWT del usuario reenviado,
// para resolver isFavorite en la ficha de provincia.
builder.Services.AddHttpClient<IPropertyClient, PropertyClient>(client =>
{
    var baseUrl = builder.Configuration["PropertyApi:BaseUrl"]
        ?? throw new InvalidOperationException("Falta PropertyApi:BaseUrl en la configuración.");

    client.BaseAddress = new Uri(baseUrl);
});

// JWT opcional: un token ausente o inválido deja la petición como anónima, nunca responde 401
// porque ninguna ruta de Analytics lleva [Authorize].
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

builder.Services.AddHostedService<ServiceBusEventConsumer>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();

app.UseWhen(
    context => context.Request.Path.StartsWithSegments("/internal"),
    branch => branch.UseMiddleware<ApiKeyMiddleware>());

app.MapControllers();

app.Run();