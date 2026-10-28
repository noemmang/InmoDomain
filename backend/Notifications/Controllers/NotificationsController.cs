using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Notifications.Services;

namespace Notifications.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetMine([FromQuery] bool unreadOnly = false, [FromQuery] int limit = 50)
    {
        var notifications = await _notificationService.GetByUserIdAsync(GetUserId(), unreadOnly, limit);
        return Ok(notifications);
    }

    [HttpPut("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var result = await _notificationService.MarkAsReadAsync(id, GetUserId());

        if (!result.IsSuccess)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        await _notificationService.MarkAllAsReadAsync(GetUserId());
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _notificationService.HideAsync(id, GetUserId());

        if (!result.IsSuccess)
        {
            return NotFound();
        }

        return NoContent();
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