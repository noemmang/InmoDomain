using MarketData.Api.Dtos;
using MarketData.Api.Repositories;

namespace MarketData.Api.Services;

public class HousingSaleService : IHousingSaleService
{
    private readonly IHousingSaleRepository _repository;

    public HousingSaleService(IHousingSaleRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<HousingSaleDto>> GetByProvinceAndPeriodRangeAsync(string provinceCode, DateOnly? from, DateOnly? to)
    {
        var sales = await _repository.GetByProvinceAndPeriodRangeAsync(provinceCode, from, to);

        return sales.Select(s => new HousingSaleDto
        {
            ProvinceCode = s.ProvinceCode,
            Period = s.Period,
            HousingStatus = s.HousingStatus,
            OperationsCount = s.OperationsCount
        }).ToList();
    }
}