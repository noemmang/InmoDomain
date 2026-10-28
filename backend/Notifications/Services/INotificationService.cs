using Notifications.Common;
using Notifications.Dtos;

namespace Notifications.Services;

public interface INotificationService
{
    Task<IEnumerable<NotificationDto>> GetByUserIdAsync(Guid userId, bool unreadOnly, int limit);
    Task<Result> MarkAsReadAsync(Guid id, Guid userId);
    Task MarkAllAsReadAsync(Guid userId);
    Task<Result> HideAsync(Guid id, Guid userId);
}