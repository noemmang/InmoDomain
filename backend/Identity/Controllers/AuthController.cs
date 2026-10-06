using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Identity.Common;
using Identity.Dtos;
using Identity.Services;

namespace Identity.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var result = await _authService.RegisterAsync(dto);

        if (!result.IsSuccess)
        {
            return result.Error switch
            {
                ResultError.Conflict => Conflict(),
                _ => StatusCode(500)
            };
        }

        return CreatedAtAction(nameof(GetMe), null, result.Value);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var result = await _authService.LoginAsync(dto);

        if (!result.IsSuccess)
        {
            return result.Error switch
            {
                ResultError.Invalid => Unauthorized(),
                _ => StatusCode(500)
            };
        }

        return Ok(result.Value);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenDto dto)
    {
        var result = await _authService.RefreshAsync(dto);

        if (!result.IsSuccess)
        {
            return result.Error switch
            {
                ResultError.Invalid => Unauthorized(),
                _ => StatusCode(500)
            };
        }

        return Ok(result.Value);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenDto dto)
    {
        await _authService.LogoutAsync(dto);
        return NoContent();
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        await _authService.ForgotPasswordAsync(dto);
        return NoContent();
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        var result = await _authService.ResetPasswordAsync(dto);

        if (!result.IsSuccess)
        {
            return result.Error switch
            {
                ResultError.Invalid => BadRequest(),
                _ => StatusCode(500)
            };
        }

        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await _authService.GetProfileAsync(userId);

        if (!result.IsSuccess)
        {
            return NotFound();
        }

        return Ok(result.Value);
    }

    [Authorize]
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileDto dto)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await _authService.UpdateProfileAsync(userId, dto);

        if (!result.IsSuccess)
        {
            return result.Error switch
            {
                ResultError.NotFound => NotFound(),
                ResultError.Conflict => Conflict(),
                _ => StatusCode(500)
            };
        }

        return Ok(result.Value);
    }

    [Authorize]
    [HttpPut("me/password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await _authService.ChangePasswordAsync(userId, dto);

        if (!result.IsSuccess)
        {
            return result.Error switch
            {
                ResultError.NotFound => NotFound(),
                ResultError.Invalid => BadRequest(),
                _ => StatusCode(500)
            };
        }

        return NoContent();
    }

    private bool TryGetUserId(out Guid userId)
    {
        return Guid.TryParse(User.FindFirst("sub")?.Value, out userId);
    }
}