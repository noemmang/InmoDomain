using System.Net.Http.Json;

namespace Identity.Security;

public class ResendEmailService : IEmailService
{
    private readonly HttpClient _httpClient;
    private readonly string _fromAddress;
    private readonly string _resetPasswordUrl;

    public ResendEmailService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _fromAddress = configuration["Resend:FromAddress"]
            ?? throw new InvalidOperationException("Falta Resend:FromAddress.");
        _resetPasswordUrl = configuration["Frontend:ResetPasswordUrl"]
            ?? throw new InvalidOperationException("Falta Frontend:ResetPasswordUrl.");
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string rawToken)
    {
        var link = $"{_resetPasswordUrl}?token={rawToken}";

        var response = await _httpClient.PostAsJsonAsync("emails", new
        {
            from = _fromAddress,
            to = new[] { toEmail },
            subject = "Recupera tu contraseña en InmoDomain",
            html = $"<p>Solicitaste restablecer tu contraseña. Este enlace caduca en 1 hora:</p>"
                 + $"<p><a href=\"{link}\">{link}</a></p>"
                 + $"<p>Si no fuiste tú, ignora este email.</p>"
        });

        response.EnsureSuccessStatusCode();
    }
}