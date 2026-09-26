using Analytics.Models;

namespace Analytics.Repositories;

public interface IPropertyScoreRepository
{
    Task<IEnumerable<PropertyScore>> GetHistoryAsync(string provinceCode, DateOnly? from, DateOnly? to);
    Task<PropertyScore?> GetByProvinceAndPeriodAsync(string provinceCode, DateOnly period);
    Task<PropertyScore?> GetLatestAsync(string provinceCode);
    Task<IEnumerable<PropertyScore>> GetByProvincesAndPeriodAsync(IReadOnlyCollection<string> provinceCodes, DateOnly period);
    Task UpsertAsync(PropertyScore propertyScore);
}