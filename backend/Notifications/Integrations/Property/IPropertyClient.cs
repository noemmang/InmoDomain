namespace Notifications.Integrations.Property;

public interface IPropertyClient
{
    Task<string?> GetProvinceNameAsync(string provinceCode);
}