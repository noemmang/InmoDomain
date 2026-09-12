using Microsoft.AspNetCore.Mvc;
using Property.Common;
using Property.Dtos;
using Property.Services;

namespace Property.Controllers;

[ApiController]
[Route("api/v1/favorites")]
public class FavoritesController : ControllerBase
{
    private readonly IFavoriteService _favoriteService;

    public FavoritesController(IFavoriteService favoriteService)
    {
        _favoriteService = favoriteService;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyFavorites()
    {
        var userId = GetUserId();
        var favorites = await _favoriteService.GetByUserIdAsync(userId);
        return Ok(favorites);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateFavoriteDto dto)
    {
        var userId = GetUserId();
        var result = await _favoriteService.CreateAsync(userId, dto);

        if (!result.IsSuccess)
        {
            return result.Error switch
            {
                ResultError.NotFound => NotFound(),
                ResultError.Conflict => Conflict(),
                _ => StatusCode(500)
            };
        }

        return CreatedAtAction(nameof(GetMyFavorites), null, result.Value);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetUserId();
        var result = await _favoriteService.DeleteAsync(id, userId);

        if (!result.IsSuccess)
        {
            return NotFound();
        }

        return NoContent();
    }

    private Guid GetUserId()
    {
        throw new NotImplementedException("Se implementará al integrar la validación de JWT en una fase posterior.");
    }
}