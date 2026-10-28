namespace Notifications.Dtos;

public class NotificationDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? ProvinceCode { get; set; }
    public bool Read { get; set; }
    public DateTime SentAt { get; set; }
}