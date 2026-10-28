using Notifications.Events;

namespace Notifications.Services;

public interface INotificationCreationService
{
    Task CreateFromAlertTriggeredAsync(AlertTriggeredEvent alertTriggeredEvent);
    Task CreateFromPasswordChangedAsync(PasswordChangedEvent passwordChangedEvent);
}