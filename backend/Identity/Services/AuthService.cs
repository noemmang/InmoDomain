using Identity.Common;
using Identity.Dtos;
using Identity.Events;
using Identity.Models;
using Identity.Repositories;
using Identity.Security;

namespace Identity.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly IPasswordHashingService _passwordHasher;
    private readonly IJwtService _jwtService;
    private readonly IEmailService _emailService;
    private readonly IEventPublisher _eventPublisher;

    private readonly TimeSpan _refreshTokenLifetime = TimeSpan.FromDays(30);
    private readonly TimeSpan _recoveryTokenLifetime = TimeSpan.FromHours(1);

    public AuthService(
        IUserRepository userRepository,
        IRefreshTokenRepository refreshTokenRepository,
        IPasswordHashingService passwordHasher,
        IJwtService jwtService,
        IEmailService emailService,
        IEventPublisher eventPublisher)
    {
        _userRepository = userRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
        _emailService = emailService;
        _eventPublisher = eventPublisher;
    }

    public async Task<Result<AuthResponseDto>> RegisterAsync(RegisterDto dto)
    {
        var email = NormalizeEmail(dto.Email);

        if (await _userRepository.GetByEmailAsync(email) is not null)
        {
            return Result<AuthResponseDto>.Failure(ResultError.Conflict);
        }

        var now = DateTime.UtcNow;
        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Email = email,
            PasswordHash = _passwordHasher.Hash(dto.Password),
            AuthProvider = "local",
            RegisteredAt = now,
            LastAccessAt = now
        };

        await _userRepository.AddAsync(user);

        return Result<AuthResponseDto>.Success(await IssueTokensAsync(user));
    }

    public async Task<Result<AuthResponseDto>> LoginAsync(LoginDto dto)
    {
        var user = await _userRepository.GetByEmailAsync(NormalizeEmail(dto.Email));
        if (user is null || user.PasswordHash is null || !_passwordHasher.Verify(user.PasswordHash, dto.Password))
        {
            return Result<AuthResponseDto>.Failure(ResultError.Invalid);
        }

        user.LastAccessAt = DateTime.UtcNow;
        await _userRepository.UpdateAsync(user);

        return Result<AuthResponseDto>.Success(await IssueTokensAsync(user));
    }

    public async Task<Result<AuthResponseDto>> RefreshAsync(RefreshTokenDto dto)
    {
        var storedToken = await _refreshTokenRepository.GetByTokenHashAsync(TokenHasher.Hash(dto.RefreshToken));

        if (storedToken is null || storedToken.RevokedAt is not null || storedToken.ExpiresAt < DateTime.UtcNow)
        {
            return Result<AuthResponseDto>.Failure(ResultError.Invalid);
        }

        var user = await _userRepository.GetByIdAsync(storedToken.UserId);
        if (user is null)
        {
            return Result<AuthResponseDto>.Failure(ResultError.Invalid);
        }

        storedToken.RevokedAt = DateTime.UtcNow;
        await _refreshTokenRepository.UpdateAsync(storedToken);

        return Result<AuthResponseDto>.Success(await IssueTokensAsync(user));
    }

    public async Task<Result> LogoutAsync(RefreshTokenDto dto)
    {
        var storedToken = await _refreshTokenRepository.GetByTokenHashAsync(TokenHasher.Hash(dto.RefreshToken));

        if (storedToken is not null && storedToken.RevokedAt is null)
        {
            storedToken.RevokedAt = DateTime.UtcNow;
            await _refreshTokenRepository.UpdateAsync(storedToken);
        }

        return Result.Success();
    }

    public async Task<Result> ForgotPasswordAsync(ForgotPasswordDto dto)
    {
        var user = await _userRepository.GetByEmailAsync(NormalizeEmail(dto.Email));
        if (user is null)
        {
            return Result.Success();
        }

        var rawToken = TokenHasher.GenerateRawToken();
        user.RecoveryTokenHash = TokenHasher.Hash(rawToken);
        user.RecoveryTokenExpiresAt = DateTime.UtcNow.Add(_recoveryTokenLifetime);
        await _userRepository.UpdateAsync(user);

        await _emailService.SendPasswordResetEmailAsync(user.Email, rawToken);

        return Result.Success();
    }

    public async Task<Result> ResetPasswordAsync(ResetPasswordDto dto)
    {
        var user = await _userRepository.GetByRecoveryTokenHashAsync(TokenHasher.Hash(dto.Token));

        if (user is null || user.RecoveryTokenExpiresAt is null || user.RecoveryTokenExpiresAt < DateTime.UtcNow)
        {
            return Result.Failure(ResultError.Invalid);
        }

        user.PasswordHash = _passwordHasher.Hash(dto.NewPassword);
        user.RecoveryTokenHash = null;
        user.RecoveryTokenExpiresAt = null;
        await _userRepository.UpdateAsync(user);

        await _refreshTokenRepository.RevokeAllActiveForUserAsync(user.Id);
        await _eventPublisher.PublishPasswordChangedAsync(user.Id);

        return Result.Success();
    }

    public async Task<Result<UserProfileDto>> GetProfileAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        return user is null
            ? Result<UserProfileDto>.Failure(ResultError.NotFound)
            : Result<UserProfileDto>.Success(ToProfileDto(user));
    }

    public async Task<Result<UserProfileDto>> UpdateProfileAsync(Guid userId, UpdateProfileDto dto)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null)
        {
            return Result<UserProfileDto>.Failure(ResultError.NotFound);
        }

        var email = NormalizeEmail(dto.Email);
        if (!string.Equals(user.Email, email, StringComparison.Ordinal))
        {
            if (await _userRepository.GetByEmailAsync(email) is not null)
            {
                return Result<UserProfileDto>.Failure(ResultError.Conflict);
            }
        }

        user.Name = dto.Name;
        user.Email = email;
        await _userRepository.UpdateAsync(user);

        return Result<UserProfileDto>.Success(ToProfileDto(user));
    }

    public async Task<Result> ChangePasswordAsync(Guid userId, ChangePasswordDto dto)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null)
        {
            return Result.Failure(ResultError.NotFound);
        }

        if (user.PasswordHash is null || !_passwordHasher.Verify(user.PasswordHash, dto.CurrentPassword))
        {
            return Result.Failure(ResultError.Invalid);
        }

        user.PasswordHash = _passwordHasher.Hash(dto.NewPassword);
        await _userRepository.UpdateAsync(user);

        await _refreshTokenRepository.RevokeAllActiveForUserAsync(userId);
        await _eventPublisher.PublishPasswordChangedAsync(userId);

        return Result.Success();
    }

    private async Task<AuthResponseDto> IssueTokensAsync(User user)
    {
        var (accessToken, accessTokenExpiresAt) = _jwtService.GenerateAccessToken(user);

        var rawRefreshToken = TokenHasher.GenerateRawToken();
        var refreshTokenExpiresAt = DateTime.UtcNow.Add(_refreshTokenLifetime);

        await _refreshTokenRepository.AddAsync(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = TokenHasher.Hash(rawRefreshToken),
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = refreshTokenExpiresAt
        });

        return new AuthResponseDto
        {
            AccessToken = accessToken,
            AccessTokenExpiresAt = accessTokenExpiresAt,
            RefreshToken = rawRefreshToken,
            RefreshTokenExpiresAt = refreshTokenExpiresAt
        };
    }

    private static UserProfileDto ToProfileDto(User user) => new()
    {
        Id = user.Id,
        Name = user.Name,
        Email = user.Email,
        RegisteredAt = user.RegisteredAt
    };

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}