using Microsoft.EntityFrameworkCore;
using Npgsql;
using Notifications.Data;
using Notifications.Models;

namespace Notifications.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly NotificationsDbContext _context;

    public NotificationRepository(NotificationsDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Notification>> GetVisibleByUserIdAsync(Guid userId, bool unreadOnly, int limit)
    {
        return await _context.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId && !n.Hidden && (!unreadOnly || !n.Read))
            .OrderByDescending(n => n.SentAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<Notification?> GetByIdAsync(Guid id)
    {
        return await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id);
    }

    // Devuelve false si ya existe una notificación con la misma clave de deduplicación.
    public async Task<bool> AddIfNewAsync(Notification notification)
    {
        if (notification.DeduplicationKey is not null)
        {
            var exists = await _context.Notifications
                .AnyAsync(n => n.DeduplicationKey == notification.DeduplicationKey);

            if (exists)
            {
                return false;
            }
        }

        await _context.Notifications.AddAsync(notification);

        try
        {
            await _context.SaveChangesAsync();
            return true;
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            _context.Entry(notification).State = EntityState.Detached;
            return false;
        }
    }

    public async Task UpdateAsync(Notification notification)
    {
        await _context.SaveChangesAsync();
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        await _context.Notifications
            .Where(n => n.UserId == userId && !n.Hidden && !n.Read)
            .ExecuteUpdateAsync(setters => setters.SetProperty(n => n.Read, true));
    }
}