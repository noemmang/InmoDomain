using Property.Common;
using Property.Dtos;

namespace Property.Services;

public interface IFavoriteService
{
    Task<IEnumerable<FavoriteDto>> GetByUserIdAsync(Guid userId);
    Task<Result<FavoriteDto>> CreateAsync(Guid userId, CreateFavoriteDto dto);
    Task<Result> DeleteAsync(Guid id, Guid userId);
}