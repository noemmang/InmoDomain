using Analytics.Common;
using Analytics.Dtos;

namespace Analytics.Services;

public interface IMetricValueService
{
    Task<Result<MetricValueDto>> GetAsync(string provinceCode, string metric);
}