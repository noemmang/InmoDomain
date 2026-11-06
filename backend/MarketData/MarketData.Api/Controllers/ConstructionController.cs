using Microsoft.AspNetCore.Mvc;
using MarketData.Api.Services;

namespace MarketData.Api.Controllers;

[ApiController]
[Route("api/v1/construction")]
public class ConstructionController : ControllerBase
{
    private readonly IConstructionService _constructionService;

    public ConstructionController(IConstructionService constructionService)
    {
        _constructionService = constructionService;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string provinceCode, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
    {
        if (string.IsNullOrWhiteSpace(provinceCode))
        {
            return BadRequest();
        }

        var activities = await _constructionService.GetByProvinceAndPeriodRangeAsync(provinceCode, from, to);
        return Ok(activities);
    }
}
