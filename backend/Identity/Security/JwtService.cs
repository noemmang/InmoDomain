using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography;
using Identity.Models;

namespace Identity.Security;

public class JwtService : IJwtService
{
    private readonly RsaSecurityKey _signingKey;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly TimeSpan _accessTokenLifetime = TimeSpan.FromMinutes(15);
    private readonly JsonWebTokenHandler _handler = new();

    public JwtService(IConfiguration configuration)
    {
        var privateKeyBase64 = configuration["Jwt:PrivateKey"]
            ?? throw new InvalidOperationException("Falta Jwt:PrivateKey en User Secrets.");

        var rsa = RSA.Create();
        rsa.ImportRSAPrivateKey(Convert.FromBase64String(privateKeyBase64), out _);
        _signingKey = new RsaSecurityKey(rsa);

        _issuer = configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("Falta Jwt:Issuer.");
        _audience = configuration["Jwt:Audience"] ?? throw new InvalidOperationException("Falta Jwt:Audience.");
    }

    public (string Token, DateTime ExpiresAt) GenerateAccessToken(User user)
    {
        var expiresAt = DateTime.UtcNow.Add(_accessTokenLifetime);

        var descriptor = new SecurityTokenDescriptor
        {
            Issuer = _issuer,
            Audience = _audience,
            IssuedAt = DateTime.UtcNow,
            Expires = expiresAt,
            Claims = new Dictionary<string, object>
            {
                [JwtRegisteredClaimNames.Sub] = user.Id.ToString(),
                [JwtRegisteredClaimNames.Email] = user.Email
            },
            SigningCredentials = new SigningCredentials(_signingKey, SecurityAlgorithms.RsaSha256)
        };

        return (_handler.CreateToken(descriptor), expiresAt);
    }
}