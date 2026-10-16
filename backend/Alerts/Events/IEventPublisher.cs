namespace Alerts.Events;

public interface IEventPublisher
{
    Task PublishAlertTriggeredAsync(AlertTriggeredEvent alertTriggeredEvent);
}