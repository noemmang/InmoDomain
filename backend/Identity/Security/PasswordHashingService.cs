using Microsoft.AspNetCore.Identity;

namespace Identity.Security;

public class PasswordHashingService : IPasswordHashingService
{
    private readonly PasswordHasher<object> _hasher = new();
    private static readonly object DummyUser = new();

    public string Hash(string password)
    {
        return _hasher.HashPassword(DummyUser, password);
    }

    public bool Verify(string hashedPassword, string providedPassword)
    {
        var result = _hasher.VerifyHashedPassword(DummyUser, hashedPassword, providedPassword);
        return result is PasswordVerificationResult.Success or PasswordVerificationResult.SuccessRehashNeeded;
    }
}