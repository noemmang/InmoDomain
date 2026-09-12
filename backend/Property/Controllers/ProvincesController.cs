using Microsoft.AspNetCore.Mvc;
using Property.Common;
using Property.Services;

namespace Property.Controllers;

[ApiController]
[Route("api/v1/provinces")]
public class ProvincesController : ControllerBase
{
    private readonly IProvinceService _provinceService;

    public ProvincesController(IProvinceService provinceService)
    {
        _provinceService = provinceService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var provinces = await _provinceService.GetAllAsync();
        return Ok(provinces);
    }

    [HttpGet("{provinceCode}")]
    public async Task<IActionResult> GetByCode(string provinceCode)
    {
        var result = await _provinceService.GetByCodeAsync(provinceCode);

        if (!result.IsSuccess)
        {
            return NotFound();
        }

        return Ok(result.Value);
    }
}