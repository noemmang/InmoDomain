using Microsoft.EntityFrameworkCore;
using Alerts.Data;
using Alerts.Models;

namespace Alerts.Repositories;

public class AlertRepository : IAlertRepository
{
    private readonly AlertsDbContext _context;

    public AlertRepository(AlertsDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Alert>> GetByUserIdAsync(Guid userId)
    {
        return await _context.Alerts
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }

    public async Task<Alert?> GetByIdAsync(Guid id)
    {
        return await _context.Alerts.FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<bool> ExistsDuplicateAsync(
        Guid userId, string provinceCode, string metric, string condition, decimal threshold, Guid? excludeId)
    {
        return await _context.Alerts.AnyAsync(a =>
            a.UserId == userId &&
            a.ProvinceCode == provinceCode &&
            a.Metric == metric &&
            a.Condition == condition &&
            a.Threshold == threshold &&
            (excludeId == null || a.Id != excludeId));
    }

    public async Task AddAsync(Alert alert)
    {
        await _context.Alerts.AddAsync(alert);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Alert alert)
    {
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Alert alert)
    {
        _context.Alerts.Remove(alert);
        await _context.SaveChangesAsync();
    }
}