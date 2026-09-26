namespace Identity.Models;

public class User
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PasswordHash { get; set; }
    public string AuthProvider { get; set; } = "local";
    public DateTime RegisteredAt { get; set; }
    public DateTime LastAccessAt { get; set; }
    public string? RecoveryTokenHash { get; set; }
    public DateTime? RecoveryTokenExpiresAt { get; set; }
}