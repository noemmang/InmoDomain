namespace Analytics.Middleware;

public class ApiKeyMiddleware
{
    private const string HeaderName = "X-Internal-Api-Key";

    private readonly RequestDelegate _next;

    public ApiKeyMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IConfiguration configuration)
    {
        var expectedKey = configuration["Security:InternalApiKey"];

        if (string.IsNullOrEmpty(expectedKey) ||
            !context.Request.Headers.TryGetValue(HeaderName, out var providedKey) ||
            providedKey != expectedKey)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return;
        }

        await _next(context);
    }
}