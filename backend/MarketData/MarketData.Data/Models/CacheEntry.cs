namespace MarketData.Data.Models;

public class CacheEntry
{
    public Guid Id { get; set; }
    public string CacheKey { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
}