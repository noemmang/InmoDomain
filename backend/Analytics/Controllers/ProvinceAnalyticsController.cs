using Microsoft.AspNetCore.Mvc;
using Analytics.Services;

namespace Analytics.Controllers;

[ApiController]
[Route("api/v1/provinces")]
public class ProvinceAnalyticsController : ControllerBase
{
    private readonly IProvinceAnalyticsService _provinceAnalyticsService;

    public ProvinceAnalyticsController(IProvinceAnalyticsService provinceAnalyticsService)
    {
        _provinceAnalyticsService = provinceAnalyticsService;
    }

    [HttpGet("{provinceCode}/analytics")]
    public async Task<IActionResult> Get(
        string provinceCode,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] int? trendQuarters)
    {
        var userId = TryGetAuthenticatedUserId();
        var accessToken = userId is null ? null : TryGetBearerToken();

        var result = await _provinceAnalyticsService.GetAsync(provinceCode, from, to, trendQuarters, userId, accessToken);

        return Ok(result);
    }

    private Guid? TryGetAuthenticatedUserId()
    {
        if (User.Identity?.IsAuthenticated != true)
        {
            return null;
        }

        var subClaim = User.FindFirst("sub")?.Value;

        return Guid.TryParse(subClaim, out var userId) ? userId : null;
    }

    private string? TryGetBearerToken()
    {
        var header = Request.Headers.Authorization.ToString();
        const string prefix = "Bearer ";

        return header.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
            ? header[prefix.Length..].Trim()
            : null;
    }
}