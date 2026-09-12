namespace Property.Dtos;

public class FavoriteDto
{
    public Guid Id { get; set; }
    public string ProvinceCode { get; set; } = string.Empty;
    public string ProvinceName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}