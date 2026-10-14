using System.Security.Cryptography;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

var publicKeyBase64 = builder.Configuration["Jwt:PublicKey"]
    ?? throw new InvalidOperationException("Falta Jwt:PublicKey en User Secrets.");
var issuer = builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException("Falta Jwt:Issuer en la configuración.");
var audience = builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException("Falta Jwt:Audience en la configuración.");

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? throw new InvalidOperationException("Falta Cors:AllowedOrigins en la configuración.");

var authPermitLimit = builder.Configuration.GetValue<int?>("RateLimiting:Auth:PermitLimit")
    ?? throw new InvalidOperationException("Falta RateLimiting:Auth:PermitLimit en la configuración.");
var authWindowSeconds = builder.Configuration.GetValue<int?>("RateLimiting:Auth:WindowSeconds")
    ?? throw new InvalidOperationException("Falta RateLimiting:Auth:WindowSeconds en la configuración.");

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

// Validación del JWT con los mismos parámetros que usa Identity para sus endpoints protegidos.
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

// Política "authenticated" referenciada desde las rutas protegidas de YARP.
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("authenticated", policy => policy.RequireAuthenticatedUser());
});

// CORS: solo los orígenes del frontend configurados.
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy => policy
        .WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod());
});

// Limitador por IP para las rutas públicas de autenticación (ventana fija).
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = authPermitLimit,
                Window = TimeSpan.FromSeconds(authWindowSeconds),
                QueueLimit = 0
            }));
});

builder.Services
    .AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

app.UseCors("frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapReverseProxy();

app.Run();