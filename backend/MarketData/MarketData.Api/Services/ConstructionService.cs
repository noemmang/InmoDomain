using MarketData.Api.Dtos;
using MarketData.Api.Repositories;

namespace MarketData.Api.Services;

public class ConstructionService : IConstructionService
{
    private readonly IConstructionRepository _repository;

    public ConstructionService(IConstructionRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<ConstructionActivityDto>> GetByProvinceAndPeriodRangeAsync(string provinceCode, DateOnly? from, DateOnly? to)
    {
        var activities = await _repository.GetByProvinceAndPeriodRangeAsync(provinceCode, from, to);

        return activities.Select(a => new ConstructionActivityDto
        {
            ProvinceCode = a.ProvinceCode,
            Period = a.Period,
            Phase = a.Phase,
            Regime = a.Regime,
            DwellingsCount = a.DwellingsCount,
            IsProvisional = a.IsProvisional
        }).ToList();
    }
}
