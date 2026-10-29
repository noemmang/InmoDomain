using MarketData.ImportJob.Import;

namespace MarketData.ImportJob.Events;

public interface IEventPublisher
{
    Task PublishImportedAsync(string topic, IReadOnlyList<ChangedPeriod> changes);
}