using Notifications.Common;
using Notifications.Dtos;
using Notifications.Models;
using Notifications.Repositories;

namespace Notifications.Services;

public class NotificationService : INotificationService
{
    private const int MinLimit = 1;
    private const int MaxLimit = 100;

    private readonly INotificationRepository _notificationRepository;

    public NotificationService(INotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    public async Task<IEnumerable<NotificationDto>> GetByUserIdAsync(Guid userId, bool unreadOnly, int limit)
    {
        var notifications = await _notificationRepository.GetVisibleByUserIdAsync(
            userId, unreadOnly, Math.Clamp(limit, MinLimit, MaxLimit));

        return notifications.Select(MapToDto).ToList();
    }

    public async Task<Result> MarkAsReadAsync(Guid id, Guid userId)
    {
        var notification = await _notificationRepository.GetByIdAsync(id);

        // Ajena, inexistente u oculta: el mismo 404 para no filtrar la existencia de notificaciones ajenas.
        if (notification is null || notification.UserId != userId || notification.Hidden)
        {
            return Result.Failure(ResultError.NotFound);
        }

        if (!notification.Read)
        {
            notification.Read = true;
            await _notificationRepository.UpdateAsync(notification);
        }

        return Result.Success();
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        await _notificationRepository.MarkAllAsReadAsync(userId);
    }

    public async Task<Result> HideAsync(Guid id, Guid userId)
    {
        var notification = await _notificationRepository.GetByIdAsync(id);

        if (notification is null || notification.UserId != userId || notification.Hidden)
        {
            return Result.Failure(ResultError.NotFound);
        }

        notification.Hidden = true;
        await _notificationRepository.UpdateAsync(notification);

        return Result.Success();
    }

    private static NotificationDto MapToDto(Notification notification)
    {
        return new NotificationDto
        {
            Id = notification.Id,
            Type = notification.Type,
            Title = notification.Title,
            Message = notification.Message,
            ProvinceCode = notification.ProvinceCode,
            Read = notification.Read,
            SentAt = notification.SentAt
        };
    }
}