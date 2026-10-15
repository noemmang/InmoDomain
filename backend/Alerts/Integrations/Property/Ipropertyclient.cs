namespace Alerts.Integrations.Property;

public interface IPropertyClient
{
    Task<bool> ProvinceExistsAsync(string provinceCode);
}