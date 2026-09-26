using Microsoft.AspNetCore.Mvc;
using Analytics.Services;

namespace Analytics.Controllers;

[ApiController]
[Route("api/v1/analytics")]
public class AnalyticsCompareController : ControllerBase
{
    private readonly ICompareService _compareService;

    public AnalyticsCompareController(ICompareService compareService)
    {
        _compareService = compareService;
    }

    [HttpGet("compare")]
    public async Task<IActionResult> Compare([FromQuery] string provinceCodes, [FromQuery] DateOnly? period)
    {
        if (string.IsNullOrWhiteSpace(provinceCodes) || period is null)
        {
            return BadRequest();
        }

        var codes = provinceCodes
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();

        if (codes.Count == 0)
        {
            return BadRequest();
        }

        var result = await _compareService.CompareAsync(codes, period.Value);
        return Ok(result);
    }
}