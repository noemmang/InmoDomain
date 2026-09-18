using MarketData.Api.Dtos;

namespace MarketData.Api.Services;

public interface IHousingSaleService
{
    Task<List<HousingSaleDto>> GetByProvinceAndPeriodRangeAsync(string provinceCode, DateOnly? from, DateOnly? to);
}