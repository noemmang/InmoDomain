using System.Security.Cryptography;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Notifications.Data;
using Notifications.Events;
using Notifications.Integrations.Property;
using Notifications.Repositories;
using Notifications.Services;

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

// Sonda de salud sin dependencias externas: no despierta Neon ni Service Bus.
builder.Services.AddHealthChecks();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<NotificationsDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Notifications")));

builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<INotificationCreationService, NotificationCreationService>();

builder.Services.AddHostedService<ServiceBusEventConsumer>();

// Llamada síncrona a Property (sin pasar por el Gateway) para resolver el nombre de la provincia.
builder.Services.AddHttpClient<IPropertyClient, PropertyClient>(client =>
{
    var baseUrl = builder.Configuration["PropertyApi:BaseUrl"]
        ?? throw new InvalidOperationException("Falta PropertyApi:BaseUrl en la configuración.");

    client.BaseAddress = new Uri(baseUrl);
    client.Timeout = TimeSpan.FromSeconds(10);
});

// Validación del JWT con los mismos parámetros que Identity, el Gateway, Property, Analytics y Alerts.
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

app.MapHealthChecks("/health");
app.MapControllers();

app.Run();