using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Alerts.Common;
using Alerts.Dtos;
using Alerts.Services;

namespace Alerts.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/alerts")]
public class AlertsController : ControllerBase
{
    private readonly IAlertService _alertService;

    public AlertsController(IAlertService alertService)
    {
        _alertService = alertService;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyAlerts()
    {
        var alerts = await _alertService.GetByUserIdAsync(GetUserId());
        return Ok(alerts);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAlertDto dto)
    {
        var result = await _alertService.CreateAsync(GetUserId(), dto);

        if (!result.IsSuccess)
        {
            return MapError(result.Error);
        }

        return CreatedAtAction(nameof(GetMyAlerts), null, result.Value);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAlertDto dto)
    {
        var result = await _alertService.UpdateAsync(id, GetUserId(), dto);

        if (!result.IsSuccess)
        {
            return MapError(result.Error);
        }

        return Ok(result.Value);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _alertService.DeleteAsync(id, GetUserId());

        if (!result.IsSuccess)
        {
            return MapError(result.Error);
        }

        return NoContent();
    }

    private IActionResult MapError(ResultError error)
    {
        return error switch
        {
            ResultError.NotFound => NotFound(),
            ResultError.Conflict => Conflict(),
            ResultError.Invalid => BadRequest(),
            ResultError.Unavailable => StatusCode(StatusCodes.Status503ServiceUnavailable),
            _ => StatusCode(StatusCodes.Status500InternalServerError)
        };
    }

    // Extrae el usuario_id del claim "sub" del JWT ya validado.
    private Guid GetUserId()
    {
        var subClaim = User.FindFirst("sub")?.Value;

        if (!Guid.TryParse(subClaim, out var userId))
        {
            throw new InvalidOperationException("El JWT validado no contiene un claim 'sub' con un Guid válido.");
        }

        return userId;
    }
}