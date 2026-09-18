using Microsoft.EntityFrameworkCore;
using Property.Data;
using Property.Models;

namespace Property.Repositories;

public class FavoriteRepository : IFavoriteRepository
{
    private readonly PropertyDbContext _context;

    public FavoriteRepository(PropertyDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Favorite>> GetByUserIdAsync(Guid userId)
    {
        return await _context.Favorites.AsNoTracking().Where(f => f.UserId == userId).ToListAsync();
    }

    public async Task<Favorite?> GetByIdAsync(Guid id)
    {
        return await _context.Favorites.FirstOrDefaultAsync(f => f.Id == id);
    }

    public async Task<bool> ExistsForUserAndProvinceAsync(Guid userId, string provinceCode)
    {
        return await _context.Favorites.AnyAsync(f => f.UserId == userId && f.ProvinceCode == provinceCode);
    }

    public async Task AddAsync(Favorite favorite)
    {
        await _context.Favorites.AddAsync(favorite);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Favorite favorite)
    {
        _context.Favorites.Remove(favorite);
        await _context.SaveChangesAsync();
    }
}