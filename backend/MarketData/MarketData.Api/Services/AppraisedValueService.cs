using MarketData.Api.Dtos;
using MarketData.Api.Repositories;

namespace MarketData.Api.Services;

public class AppraisedValueService : IAppraisedValueService
{
    private readonly IAppraisedValueRepository _repository;

    public AppraisedValueService(IAppraisedValueRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<AppraisedValueDto>> GetByProvinceAndPeriodRangeAsync(string provinceCode, DateOnly? from, DateOnly? to)
    {
        var values = await _repository.GetByProvinceAndPeriodRangeAsync(provinceCode, from, to);

        return values.Select(v => new AppraisedValueDto
        {
            ProvinceCode = v.ProvinceCode,
            Period = v.Period,
            Age = v.Age,
            PricePerSquareMeter = v.PricePerSquareMeter
        }).ToList();
    }
}