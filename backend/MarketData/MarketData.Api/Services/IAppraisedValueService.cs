using MarketData.Api.Dtos;

namespace MarketData.Api.Services;

public interface IAppraisedValueService
{
    Task<List<AppraisedValueDto>> GetByProvinceAndPeriodRangeAsync(string provinceCode, DateOnly? from, DateOnly? to);
}