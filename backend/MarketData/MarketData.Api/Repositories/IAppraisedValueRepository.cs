using MarketData.Data.Models;

namespace MarketData.Api.Repositories;

public interface IAppraisedValueRepository
{
    Task<List<AppraisedValue>> GetByProvinceAndPeriodRangeAsync(string provinceCode, DateOnly? from, DateOnly? to);
}