namespace Identity.Security;

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(string toEmail, string rawToken);
}