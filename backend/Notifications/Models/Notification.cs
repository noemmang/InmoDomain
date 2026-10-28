namespace Notifications.Models;

public class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? ProvinceCode { get; set; }
    public bool Read { get; set; }
    public bool Hidden { get; set; }
    public DateTime SentAt { get; set; }
    public string? DeduplicationKey { get; set; }
}