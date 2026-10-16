using Alerts.Models;

namespace Alerts.Repositories;

public interface IAlertRepository
{
    Task<IEnumerable<Alert>> GetByUserIdAsync(Guid userId);
    Task<IEnumerable<Alert>> GetActiveByProvinceCodesAsync(IReadOnlyCollection<string> provinceCodes);
    Task<Alert?> GetByIdAsync(Guid id);
    Task<bool> ExistsDuplicateAsync(
        Guid userId, string provinceCode, string metric, string condition, decimal threshold, Guid? excludeId);
    Task AddAsync(Alert alert);
    Task UpdateAsync(Alert alert);
    Task DeleteAsync(Alert alert);
}