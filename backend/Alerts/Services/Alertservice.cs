using Alerts.Common;
using Alerts.Dtos;
using Alerts.Integrations.Property;
using Alerts.Models;
using Alerts.Repositories;

namespace Alerts.Services;

public class AlertService : IAlertService
{
    private readonly IAlertRepository _alertRepository;
    private readonly IPropertyClient _propertyClient;
    private readonly ILogger<AlertService> _logger;

    public AlertService(
        IAlertRepository alertRepository,
        IPropertyClient propertyClient,
        ILogger<AlertService> logger)
    {
        _alertRepository = alertRepository;
        _propertyClient = propertyClient;
        _logger = logger;
    }

    public async Task<IEnumerable<AlertDto>> GetByUserIdAsync(Guid userId)
    {
        var alerts = await _alertRepository.GetByUserIdAsync(userId);
        return alerts.Select(MapToDto).ToList();
    }

    public async Task<Result<AlertDto>> CreateAsync(Guid userId, CreateAlertDto dto)
    {
        var provinceResult = await ValidateProvinceAsync(dto.ProvinceCode);

        if (!provinceResult.IsSuccess)
        {
            return Result<AlertDto>.Failure(provinceResult.Error);
        }

        var threshold = Math.Round(dto.Threshold!.Value, 2);

        var isDuplicate = await _alertRepository.ExistsDuplicateAsync(
            userId, dto.ProvinceCode, dto.Metric, dto.Condition, threshold, excludeId: null);

        if (isDuplicate)
        {
            return Result<AlertDto>.Failure(ResultError.Conflict);
        }

        var alert = new Alert
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ProvinceCode = dto.ProvinceCode,
            Metric = dto.Metric,
            Condition = dto.Condition,
            Threshold = threshold,
            Active = true,
            CreatedAt = DateTime.UtcNow
        };

        await _alertRepository.AddAsync(alert);

        return Result<AlertDto>.Success(MapToDto(alert));
    }

    public async Task<Result<AlertDto>> UpdateAsync(Guid id, Guid userId, UpdateAlertDto dto)
    {
        var alert = await _alertRepository.GetByIdAsync(id);

        if (alert is null || alert.UserId != userId)
        {
            return Result<AlertDto>.Failure(ResultError.NotFound);
        }

        var provinceChanged = alert.ProvinceCode != dto.ProvinceCode;

        if (provinceChanged)
        {
            var provinceResult = await ValidateProvinceAsync(dto.ProvinceCode);

            if (!provinceResult.IsSuccess)
            {
                return Result<AlertDto>.Failure(provinceResult.Error);
            }
        }

        var threshold = Math.Round(dto.Threshold!.Value, 2);

        var isDuplicate = await _alertRepository.ExistsDuplicateAsync(
            userId, dto.ProvinceCode, dto.Metric, dto.Condition, threshold, excludeId: id);

        if (isDuplicate)
        {
            return Result<AlertDto>.Failure(ResultError.Conflict);
        }

        // Cambiar provincia, métrica, condición o umbral equivale a una alerta nueva:
        // se reinicia el periodo del último disparo para que pueda avisar de nuevo en este trimestre.
        var definitionChanged = provinceChanged
            || alert.Metric != dto.Metric
            || alert.Condition != dto.Condition
            || alert.Threshold != threshold;

        alert.ProvinceCode = dto.ProvinceCode;
        alert.Metric = dto.Metric;
        alert.Condition = dto.Condition;
        alert.Threshold = threshold;
        alert.Active = dto.Active!.Value;

        if (definitionChanged)
        {
            alert.LastTriggeredPeriod = null;
        }

        await _alertRepository.UpdateAsync(alert);

        return Result<AlertDto>.Success(MapToDto(alert));
    }

    public async Task<Result> DeleteAsync(Guid id, Guid userId)
    {
        var alert = await _alertRepository.GetByIdAsync(id);

        if (alert is null || alert.UserId != userId)
        {
            return Result.Failure(ResultError.NotFound);
        }

        await _alertRepository.DeleteAsync(alert);

        return Result.Success();
    }

    private async Task<Result> ValidateProvinceAsync(string provinceCode)
    {
        try
        {
            var exists = await _propertyClient.ProvinceExistsAsync(provinceCode);
            return exists ? Result.Success() : Result.Failure(ResultError.Invalid);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            _logger.LogError(ex, "No se pudo validar la provincia {ProvinceCode} contra Property.", provinceCode);
            return Result.Failure(ResultError.Unavailable);
        }
    }

    private static AlertDto MapToDto(Alert alert)
    {
        return new AlertDto
        {
            Id = alert.Id,
            ProvinceCode = alert.ProvinceCode,
            Metric = alert.Metric,
            Condition = alert.Condition,
            Threshold = alert.Threshold,
            Active = alert.Active,
            CreatedAt = alert.CreatedAt,
            LastTriggeredAt = alert.LastTriggeredAt,
            LastTriggeredPeriod = alert.LastTriggeredPeriod
        };
    }
}