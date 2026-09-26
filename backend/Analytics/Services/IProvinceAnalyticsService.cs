using Analytics.Dtos;

namespace Analytics.Services;

public interface IProvinceAnalyticsService
{
    Task<ProvinceAnalyticsDto> GetAsync(string provinceCode, DateOnly? from, DateOnly? to, int? trendQuarters, Guid? userId);
}