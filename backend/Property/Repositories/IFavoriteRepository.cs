using Property.Models;

namespace Property.Repositories;

public interface IFavoriteRepository
{
    Task<IEnumerable<Favorite>> GetByUserIdAsync(Guid userId);
    Task<Favorite?> GetByIdAsync(Guid id);
    Task<bool> ExistsForUserAndProvinceAsync(Guid userId, string provinceCode);
    Task AddAsync(Favorite favorite);
    Task DeleteAsync(Favorite favorite);
}