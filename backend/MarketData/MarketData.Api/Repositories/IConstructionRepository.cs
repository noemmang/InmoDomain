using MarketData.Data.Models;

namespace MarketData.Api.Repositories;

public interface IConstructionRepository
{
    Task<List<ConstructionActivity>> GetByProvinceAndPeriodRangeAsync(string provinceCode, DateOnly? from, DateOnly? to);
}
