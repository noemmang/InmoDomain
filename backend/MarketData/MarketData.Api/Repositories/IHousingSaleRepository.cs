using MarketData.Data.Models;

namespace MarketData.Api.Repositories;

public interface IHousingSaleRepository
{
    Task<List<HousingSale>> GetByProvinceAndPeriodRangeAsync(string provinceCode, DateOnly? from, DateOnly? to);
}