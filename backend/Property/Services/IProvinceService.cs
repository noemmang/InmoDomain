using Property.Common;
using Property.Dtos;

namespace Property.Services;

public interface IProvinceService
{
    Task<IEnumerable<ProvinceDto>> GetAllAsync();
    Task<Result<ProvinceDto>> GetByCodeAsync(string provinceCode);
}