using Identity.Common;
using Identity.Dtos;

namespace Identity.Services;

public interface IAuthService
{
    Task<Result<AuthResponseDto>> RegisterAsync(RegisterDto dto);
    Task<Result<AuthResponseDto>> LoginAsync(LoginDto dto);
    Task<Result<AuthResponseDto>> RefreshAsync(RefreshTokenDto dto);
    Task<Result> LogoutAsync(RefreshTokenDto dto);
    Task<Result> ForgotPasswordAsync(ForgotPasswordDto dto);
    Task<Result> ResetPasswordAsync(ResetPasswordDto dto);
    Task<Result<UserProfileDto>> GetProfileAsync(Guid userId);
    Task<Result<UserProfileDto>> UpdateProfileAsync(Guid userId, UpdateProfileDto dto);
    Task<Result> ChangePasswordAsync(Guid userId, ChangePasswordDto dto);
}