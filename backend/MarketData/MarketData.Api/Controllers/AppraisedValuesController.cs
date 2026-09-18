using Microsoft.AspNetCore.Mvc;
using MarketData.Api.Services;

namespace MarketData.Api.Controllers;

[ApiController]
[Route("api/v1/appraised-values")]
public class AppraisedValuesController : ControllerBase
{
    private readonly IAppraisedValueService _appraisedValueService;

    public AppraisedValuesController(IAppraisedValueService appraisedValueService)
    {
        _appraisedValueService = appraisedValueService;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string provinceCode, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
    {
        if (string.IsNullOrWhiteSpace(provinceCode))
        {
            return BadRequest();
        }

        var values = await _appraisedValueService.GetByProvinceAndPeriodRangeAsync(provinceCode, from, to);
        return Ok(values);
    }
}