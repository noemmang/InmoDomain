namespace Identity.Security;

public interface IPasswordHashingService
{
    string Hash(string password);
    bool Verify(string hashedPassword, string providedPassword);
}