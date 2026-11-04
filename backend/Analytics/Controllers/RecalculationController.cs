using Microsoft.AspNetCore.Mvc;
using Analytics.Services;

namespace Analytics.Controllers;

[ApiController]
[Route("internal/v1")]
public class RecalculationController : ControllerBase
{
    private readonly IRangeRecalculationService _rangeRecalculationService;

    public RecalculationController(IRangeRecalculationService rangeRecalculationService)
    {
        _rangeRecalculationService = rangeRecalculationService;
    }

    [HttpPost("recalculate")]
    public async Task<IActionResult> Recalculate(
        [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, [FromQuery] string? provinceCodes)
    {
        if (from is null || to is null || from > to)
        {
            return BadRequest();
        }

        var codes = string.IsNullOrWhiteSpace(provinceCodes)
            ? null
            : provinceCodes
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToList();

        try
        {
            var result = await _rangeRecalculationService.RecalculateAsync(from.Value, to.Value, codes);
            return Ok(result);
        }
        catch (HttpRequestException)
        {
            // Market Data o Property no responden: no se guarda nada a medias que se pueda confundir con un éxito.
            return StatusCode(StatusCodes.Status503ServiceUnavailable);
        }
    }
}