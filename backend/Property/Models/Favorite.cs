namespace Property.Models;

public class Favorite
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string ProvinceCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}