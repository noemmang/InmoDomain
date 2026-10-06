namespace Identity.Events;

public interface IEventPublisher
{
    Task PublishPasswordChangedAsync(Guid userId);
}