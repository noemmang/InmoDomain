using Property.Models;

namespace Property.Repositories;

public interface IProvinceRepository
{
    Task<IEnumerable<Province>> GetAllAsync();
    Task<Province?> GetByCodeIneAsync(string codeIne);
}