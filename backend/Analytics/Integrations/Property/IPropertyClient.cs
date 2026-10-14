namespace Analytics.Integrations.Property;

public class FavoriteDto
{
    public string ProvinceCode { get; set; } = string.Empty;
}

public interface IPropertyClient
{
    Task<IReadOnlyList<FavoriteDto>> GetFavoritesAsync(string accessToken);
}