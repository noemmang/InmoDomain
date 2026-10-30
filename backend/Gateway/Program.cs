using System.Security.Cryptography;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

var publicKeyBase64 = builder.Configuration["Jwt:PublicKey"]
    ?? throw new InvalidOperationException("Falta Jwt:PublicKey en User Secrets.");
var issuer = builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException("Falta Jwt:Issuer en la configuración.");
var audience = builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException("Falta Jwt:Audience en la configuración.");

// Orígenes CORS por entorno: Development los toma de appsettings.Development.json; en el resto
// llegan por variable de entorno (Cors__AllowedOrigins__0, Cors__AllowedOrigins__1, ...).
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
if (allowedOrigins.Length == 0 && !builder.Environment.IsDevelopment())
{
    throw new InvalidOperationException("Falta Cors:AllowedOrigins: define al menos un origen (Cors__AllowedOrigins__0).");
}

// Un origen válido es esquema + host (+ puerto), sin ruta ni barra final ni comodines.
foreach (var origin in allowedOrigins)
{
    if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)
        || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
        || uri.AbsolutePath != "/"
        || origin.EndsWith('/'))
    {
        throw new InvalidOperationException($"Origen CORS no válido: '{origin}'. Formato esperado: https://dominio[:puerto].");
    }
}

// Con ForwardedHeaders:Enabled=true el Gateway toma la IP real del cliente de X-Forwarded-For.
// Solo debe activarse detrás del ingress de Container Apps, que añade la IP del cliente como último valor.
var forwardedHeadersEnabled = builder.Configuration.GetValue<bool>("ForwardedHeaders:Enabled");

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

if (forwardedHeadersEnabled)
{
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;

        // El ingress no tiene una IP conocida y fija; la confianza se limita a un único salto (ForwardLimit = 1),
        // es decir, al último valor de X-Forwarded-For, que es el que añade el ingress y no el cliente.
        options.KnownIPNetworks.Clear();
        options.KnownProxies.Clear();
        options.ForwardLimit = 1;
    });
}

builder.Services.AddHealthChecks();

builder.Services
    .AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

// Debe ir antes del limitador de peticiones, que particiona por IP.
if (forwardedHeadersEnabled)
{
    app.UseForwardedHeaders();
}

app.UseCors("frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// Sonda de salud propia del Gateway: ninguna ruta de YARP reenvía /health a los servicios.
app.MapHealthChecks("/health");
app.MapReverseProxy();

app.Run();