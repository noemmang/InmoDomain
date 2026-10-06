using System.Net.Http.Headers;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Identity.Data;
using Identity.Events;
using Identity.Repositories;
using Identity.Security;
using Identity.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<IdentityDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Identity")));

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddSingleton<IPasswordHashingService, PasswordHashingService>();
builder.Services.AddSingleton<IJwtService, JwtService>();
builder.Services.AddSingleton<IEventPublisher, ServiceBusEventPublisher>();

builder.Services.AddHttpClient<IEmailService, ResendEmailService>(client =>
{
    var baseUrl = builder.Configuration["Resend:BaseUrl"]
        ?? throw new InvalidOperationException("Falta Resend:BaseUrl en la configuración.");
    var apiKey = builder.Configuration["Resend:ApiKey"]
        ?? throw new InvalidOperationException("Falta Resend:ApiKey en la configuración.");

    client.BaseAddress = new Uri(baseUrl);
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
});

var privateKeyBase64 = builder.Configuration["Jwt:PrivateKey"]
    ?? throw new InvalidOperationException("Falta Jwt:PrivateKey en User Secrets.");
var issuer = builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException("Falta Jwt:Issuer en la configuración.");
var audience = builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException("Falta Jwt:Audience en la configuración.");

using var privateRsa = RSA.Create();
privateRsa.ImportRSAPrivateKey(Convert.FromBase64String(privateKeyBase64), out _);

var publicRsa = RSA.Create();
publicRsa.ImportRSAPublicKey(privateRsa.ExportRSAPublicKey(), out _);
var validationKey = new RsaSecurityKey(publicRsa);

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