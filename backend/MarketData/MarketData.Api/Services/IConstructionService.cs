using MarketData.Api.Dtos;

namespace MarketData.Api.Services;

public interface IConstructionService
{
    Task<List<ConstructionActivityDto>> GetByProvinceAndPeriodRangeAsync(string provinceCode, DateOnly? from, DateOnly? to);
}
