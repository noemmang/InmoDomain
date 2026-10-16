namespace Alerts.Services;

public interface IAlertEvaluationService
{
    Task EvaluateAsync(IReadOnlyCollection<string> provinceCodes);
}