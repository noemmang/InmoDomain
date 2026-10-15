using Alerts.Common;
using Alerts.Dtos;

namespace Alerts.Services;

public interface IAlertService
{
    Task<IEnumerable<AlertDto>> GetByUserIdAsync(Guid userId);
    Task<Result<AlertDto>> CreateAsync(Guid userId, CreateAlertDto dto);
    Task<Result<AlertDto>> UpdateAsync(Guid id, Guid userId, UpdateAlertDto dto);
    Task<Result> DeleteAsync(Guid id, Guid userId);
}