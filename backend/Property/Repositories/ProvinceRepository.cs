using Microsoft.EntityFrameworkCore;
using Property.Data;
using Property.Models;

namespace Property.Repositories;

public class ProvinceRepository : IProvinceRepository
{
    private readonly PropertyDbContext _context;

    public ProvinceRepository(PropertyDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Province>> GetAllAsync()
    {
        return await _context.Provinces.AsNoTracking().ToListAsync();
    }

    public async Task<Province?> GetByCodeIneAsync(string codeIne)
    {
        return await _context.Provinces.AsNoTracking().FirstOrDefaultAsync(p => p.CodeIne == codeIne);
    }
}