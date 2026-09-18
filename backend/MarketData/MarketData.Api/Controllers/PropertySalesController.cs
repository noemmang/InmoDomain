using Microsoft.AspNetCore.Mvc;
using MarketData.Api.Services;

namespace MarketData.Api.Controllers;

[ApiController]
[Route("api/v1/property-sales")]
public class PropertySalesController : ControllerBase
{
    private readonly IHousingSaleService _housingSaleService;

    public PropertySalesController(IHousingSaleService housingSaleService)
    {
        _housingSaleService = housingSaleService;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string provinceCode, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
    {
        if (string.IsNullOrWhiteSpace(provinceCode))
        {
            return BadRequest();
        }

        var sales = await _housingSaleService.GetByProvinceAndPeriodRangeAsync(provinceCode, from, to);
        return Ok(sales);
    }
}