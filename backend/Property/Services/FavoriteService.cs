using Property.Common;
using Property.Dtos;
using Property.Models;
using Property.Repositories;

namespace Property.Services;

public class FavoriteService : IFavoriteService
{
    private readonly IFavoriteRepository _favoriteRepository;
    private readonly IProvinceRepository _provinceRepository;

    public FavoriteService(IFavoriteRepository favoriteRepository, IProvinceRepository provinceRepository)
    {
        _favoriteRepository = favoriteRepository;
        _provinceRepository = provinceRepository;
    }

    public async Task<IEnumerable<FavoriteDto>> GetByUserIdAsync(Guid userId)
    {
        var favorites = await _favoriteRepository.GetByUserIdAsync(userId);

        var dtos = new List<FavoriteDto>();
        foreach (var favorite in favorites)
        {
            var province = await _provinceRepository.GetByCodeIneAsync(favorite.ProvinceCode);
            dtos.Add(MapToDto(favorite, province));
        }

        return dtos;
    }

    public async Task<Result<FavoriteDto>> CreateAsync(Guid userId, CreateFavoriteDto dto)
    {
        var province = await _provinceRepository.GetByCodeIneAsync(dto.ProvinceCode);

        if (province is null)
        {
            return Result<FavoriteDto>.Failure(ResultError.NotFound);
        }

        var alreadyExists = await _favoriteRepository.ExistsForUserAndProvinceAsync(userId, dto.ProvinceCode);

        if (alreadyExists)
        {
            return Result<FavoriteDto>.Failure(ResultError.Conflict);
        }

        var favorite = new Favorite
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ProvinceCode = dto.ProvinceCode,
            CreatedAt = DateTime.UtcNow
        };

        await _favoriteRepository.AddAsync(favorite);

        return Result<FavoriteDto>.Success(MapToDto(favorite, province));
    }

    public async Task<Result> DeleteAsync(Guid id, Guid userId)
    {
        var favorite = await _favoriteRepository.GetByIdAsync(id);

        if (favorite is null || favorite.UserId != userId)
        {
            return Result.Failure(ResultError.NotFound);
        }

        await _favoriteRepository.DeleteAsync(favorite);

        return Result.Success();
    }

    private static FavoriteDto MapToDto(Favorite favorite, Province? province)
    {
        return new FavoriteDto
        {
            Id = favorite.Id,
            ProvinceCode = favorite.ProvinceCode,
            ProvinceName = province?.Name ?? string.Empty,
            CreatedAt = favorite.CreatedAt
        };
    }
}