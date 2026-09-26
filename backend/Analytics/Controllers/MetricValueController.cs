using Microsoft.AspNetCore.Mvc;
using Analytics.Common;
using Analytics.Services;

namespace Analytics.Controllers;

[ApiController]
[Route("internal/v1")]
public class MetricValueController : ControllerBase
{
    private readonly IMetricValueService _metricValueService;

    public MetricValueController(IMetricValueService metricValueService)
    {
        _metricValueService = metricValueService;
    }

    [HttpGet("metric-value")]
    public async Task<IActionResult> Get([FromQuery] string provinceCode, [FromQuery] string metric)
    {
        if (string.IsNullOrWhiteSpace(provinceCode) || !MetricNames.All.Contains(metric))
        {
            return BadRequest();
        }

        var result = await _metricValueService.GetAsync(provinceCode, metric);

        if (!result.IsSuccess)
        {
            return NotFound();
        }

        return Ok(result.Value);
    }
}