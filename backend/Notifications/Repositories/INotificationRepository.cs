using Notifications.Models;

namespace Notifications.Repositories;

public interface INotificationRepository
{
    Task<IEnumerable<Notification>> GetVisibleByUserIdAsync(Guid userId, bool unreadOnly, int limit);
    Task<Notification?> GetByIdAsync(Guid id);
    Task<bool> AddIfNewAsync(Notification notification);
    Task UpdateAsync(Notification notification);
    Task MarkAllAsReadAsync(Guid userId);
}