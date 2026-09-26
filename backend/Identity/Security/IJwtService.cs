using Identity.Models;

namespace Identity.Security;

public interface IJwtService
{
    (string Token, DateTime ExpiresAt) GenerateAccessToken(User user);
}