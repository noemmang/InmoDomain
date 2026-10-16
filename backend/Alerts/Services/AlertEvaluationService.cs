using Alerts.Common;
using Alerts.Events;
using Alerts.Integrations.Analytics;
using Alerts.Models;
using Alerts.Repositories;

namespace Alerts.Services;

public class AlertEvaluationService : IAlertEvaluationService
{
    private readonly IAlertRepository _alertRepository;
    private readonly IAnalyticsClient _analyticsClient;
    private readonly IEventPublisher _eventPublisher;
    private readonly ILogger<AlertEvaluationService> _logger;

    public AlertEvaluationService(
        IAlertRepository alertRepository,
        IAnalyticsClient analyticsClient,
        IEventPublisher eventPublisher,
        ILogger<AlertEvaluationService> logger)
    {
        _alertRepository = alertRepository;
        _analyticsClient = analyticsClient;
        _eventPublisher = eventPublisher;
        _logger = logger;
    }

    public async Task EvaluateAsync(IReadOnlyCollection<string> provinceCodes)
    {
        var alerts = (await _alertRepository.GetActiveByProvinceCodesAsync(provinceCodes)).ToList();

        if (alerts.Count == 0)
        {
            return;
        }

        var failures = new List<Exception>();

        // Una sola consulta a Analytics por cada par (provincia, métrica), aunque varias alertas lo compartan.
        foreach (var group in alerts.GroupBy(a => (a.ProvinceCode, a.Metric)))
        {
            try
            {
                await EvaluateGroupAsync(group.Key.ProvinceCode, group.Key.Metric, group);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error evaluando alertas de la provincia {ProvinceCode} y la métrica {Metric}.",
                    group.Key.ProvinceCode,
                    group.Key.Metric);
                failures.Add(ex);
            }
        }

        // El mensaje se reintenta; las alertas ya disparadas no se repiten gracias a periodo_ultimo_disparo.
        if (failures.Count > 0)
        {
            throw new AggregateException("Fallo al evaluar algunas alertas.", failures);
        }
    }

    private async Task EvaluateGroupAsync(string provinceCode, string metric, IEnumerable<Alert> alerts)
    {
        var metricValue = await _analyticsClient.GetMetricValueAsync(provinceCode, metric);

        // Sin dato todavía, o métrica sin valor calculado (property_score nulo en filas recién creadas).
        if (metricValue?.Value is null)
        {
            return;
        }

        var value = metricValue.Value.Value;

        foreach (var alert in alerts)
        {
            // Una sola vez por periodo de dato: no repetir si ya disparó para este periodo o uno posterior.
            if (alert.LastTriggeredPeriod is not null && alert.LastTriggeredPeriod >= metricValue.Period)
            {
                continue;
            }

            if (!IsConditionMet(alert, value))
            {
                continue;
            }

            await TriggerAsync(alert, value, metricValue.Period);
        }
    }

    private async Task TriggerAsync(Alert alert, decimal value, DateOnly period)
    {
        // Primero se publica y después se marca: si la publicación falla, la alerta sigue pendiente
        // y se reintenta; el caso inverso perdería el aviso.
        await _eventPublisher.PublishAlertTriggeredAsync(new AlertTriggeredEvent
        {
            EventId = Guid.NewGuid(),
            OccurredAt = DateTimeOffset.UtcNow,
            AlertId = alert.Id,
            UserId = alert.UserId,
            ProvinceCode = alert.ProvinceCode,
            Metric = alert.Metric,
            Condition = alert.Condition,
            Threshold = alert.Threshold,
            Value = value,
            Period = period
        });

        alert.LastTriggeredAt = DateTime.UtcNow;
        alert.LastTriggeredPeriod = period;
        await _alertRepository.UpdateAsync(alert);

        _logger.LogInformation(
            "Alerta {AlertId} disparada: {Metric} = {Value} ({Condition} {Threshold}) en provincia {ProvinceCode}, periodo {Period}.",
            alert.Id, alert.Metric, value, alert.Condition, alert.Threshold, alert.ProvinceCode, period);
    }

    private static bool IsConditionMet(Alert alert, decimal value)
    {
        return alert.Condition switch
        {
            AlertConditions.GreaterThan => value > alert.Threshold,
            AlertConditions.LessThan => value < alert.Threshold,
            _ => false
        };
    }
}