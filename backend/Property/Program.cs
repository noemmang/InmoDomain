using System.Security.Cryptography;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Property.Data;
using Property.Repositories;
using Property.Services;

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

builder.Services.AddDbContext<PropertyDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Property")));

builder.Services.AddScoped<IProvinceRepository, ProvinceRepository>();
builder.Services.AddScoped<IFavoriteRepository, FavoriteRepository>();
builder.Services.AddScoped<IProvinceService, ProvinceService>();
builder.Services.AddScoped<IFavoriteService, FavoriteService>();

// Validación del JWT con los mismos parámetros que Identity y el Gateway.
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