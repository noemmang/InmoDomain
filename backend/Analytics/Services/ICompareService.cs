using Analytics.Dtos;

namespace Analytics.Services;

public interface ICompareService
{
    Task<IEnumerable<CompareEntryDto>> CompareAsync(IReadOnlyCollection<string> provinceCodes, DateOnly period);
}