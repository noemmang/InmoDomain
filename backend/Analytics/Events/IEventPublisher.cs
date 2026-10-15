namespace Analytics.Events;

public interface IEventPublisher
{
    Task PublishIndicesRecalculatedAsync(DateOnly period, IReadOnlyCollection<string> provinceCodes);
}