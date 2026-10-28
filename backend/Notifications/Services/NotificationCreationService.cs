using System.Globalization;
using Notifications.Common;
using Notifications.Events;
using Notifications.Integrations.Property;
using Notifications.Models;
using Notifications.Repositories;

namespace Notifications.Services;

public class NotificationCreationService : INotificationCreationService
{
    private static readonly CultureInfo SpanishCulture = CultureInfo.GetCultureInfo("es-ES");

    private static readonly IReadOnlyDictionary<string, string> MetricLabels = new Dictionary<string, string>
    {
        ["property_score"] = "Property Score",
        ["indice_precio"] = "Índice de precio",
        ["indice_tendencia_precio"] = "Índice de tendencia de precio",
        ["indice_actividad"] = "Índice de actividad",
        ["precio_m2"] = "Precio por m²"
    };

    private readonly INotificationRepository _notificationRepository;
    private readonly IPropertyClient _propertyClient;
    private readonly ILogger<NotificationCreationService> _logger;

    public NotificationCreationService(
        INotificationRepository notificationRepository,
        IPropertyClient propertyClient,
        ILogger<NotificationCreationService> logger)
    {
        _notificationRepository = notificationRepository;
        _propertyClient = propertyClient;
        _logger = logger;
    }

    public async Task CreateFromAlertTriggeredAsync(AlertTriggeredEvent alertTriggeredEvent)
    {
        if (alertTriggeredEvent.UserId == Guid.Empty || alertTriggeredEvent.AlertId == Guid.Empty)
        {
            throw new InvalidOperationException("El evento AlertaDisparada no contiene usuario_id o id_alerta válidos.");
        }

        var province = await ResolveProvinceLabelAsync(alertTriggeredEvent.ProvinceCode);

        var relation = alertTriggeredEvent.Condition == AlertConditions.GreaterThan
            ? "supera"
            : "queda por debajo de";

        var metricLabel = MetricLabels.TryGetValue(alertTriggeredEvent.Metric, out var label)
            ? label
            : alertTriggeredEvent.Metric;

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = alertTriggeredEvent.UserId,
            Type = NotificationTypes.Alert,
            Title = $"Alerta en {province}",
            Message = $"{metricLabel} en {province}: {FormatNumber(alertTriggeredEvent.Value)}, {relation} tu umbral de {FormatNumber(alertTriggeredEvent.Threshold)} ({FormatQuarter(alertTriggeredEvent.Period)}).",
            ProvinceCode = alertTriggeredEvent.ProvinceCode,
            SentAt = DateTime.UtcNow,
            DeduplicationKey = $"{NotificationTypes.Alert}:{alertTriggeredEvent.AlertId}:{alertTriggeredEvent.Period.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)}"
        };

        await SaveAsync(notification);
    }

    public async Task CreateFromPasswordChangedAsync(PasswordChangedEvent passwordChangedEvent)
    {
        if (passwordChangedEvent.UserId == Guid.Empty)
        {
            throw new InvalidOperationException("El evento ContrasenaCambiada no contiene un usuario_id válido.");
        }

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = passwordChangedEvent.UserId,
            Type = NotificationTypes.PasswordChanged,
            Title = "Contraseña cambiada",
            Message = "Tu contraseña se ha cambiado y se han cerrado tus sesiones activas. Si no has sido tú, restablécela desde la opción de recuperación de contraseña.",
            ProvinceCode = null,
            SentAt = DateTime.UtcNow,
            DeduplicationKey = passwordChangedEvent.EventId == Guid.Empty
                ? null
                : $"{NotificationTypes.PasswordChanged}:{passwordChangedEvent.EventId}"
        };

        await SaveAsync(notification);
    }

    private async Task SaveAsync(Notification notification)
    {
        var created = await _notificationRepository.AddIfNewAsync(notification);

        if (!created)
        {
            _logger.LogInformation(
                "Notificación omitida por duplicada (clave {DeduplicationKey}).", notification.DeduplicationKey);
            return;
        }

        _logger.LogInformation(
            "Notificación {Type} creada para el usuario {UserId}.", notification.Type, notification.UserId);
    }

    // Si Property no responde o no conoce la provincia, la notificación se crea igualmente con el código.
    private async Task<string> ResolveProvinceLabelAsync(string provinceCode)
    {
        try
        {
            var name = await _propertyClient.GetProvinceNameAsync(provinceCode);

            if (!string.IsNullOrWhiteSpace(name))
            {
                return name;
            }
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            _logger.LogWarning(ex, "No se pudo resolver el nombre de la provincia {ProvinceCode} en Property.", provinceCode);
        }

        return $"provincia {provinceCode}";
    }

    private static string FormatNumber(decimal value)
    {
        return value.ToString("0.##", SpanishCulture);
    }

    private static string FormatQuarter(DateOnly period)
    {
        return $"{(period.Month - 1) / 3 + 1}T {period.Year}";
    }
}