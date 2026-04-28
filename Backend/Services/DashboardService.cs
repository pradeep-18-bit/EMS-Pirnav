using EmployeeManagementSystem.Data;
using EmployeeManagementSystem.DTOs;
using EmployeeManagementSystem.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementSystem.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _context;

        public DashboardService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<DashboardResponseDto> GetDashboardData()
        {
            var utcNow = DateTime.UtcNow;
            var today = utcNow.Date;

            var istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");

            // Total Employees
            var totalEmployees = await _context.Employees.CountAsync();

            // Total Departments
            var totalDepartments = await _context.Departments.CountAsync();

            // Active Projects
            var activeProjects = await _context.Projects
                .Where(p => p.Status == "Active")
                .CountAsync();

            // Attendance Today
            var totalAttendance = await _context.Attendance
                .Where(a => a.Attendance_Date == today)
                .CountAsync();

            double attendancePercentage = 0;

            if (totalEmployees > 0)
            {
                attendancePercentage = (double)totalAttendance / totalEmployees * 100;
            }

            // Activities from last 2 hours
            var activityExpiry = utcNow.AddHours(-2);

            var activityLogs = await _context.ActivityLogs
                .Where(a => a.CreatedAt >= activityExpiry)
                .OrderByDescending(a => a.CreatedAt)
                .Take(5)
                .Select(a => new
                {
                    a.Activity,
                    a.CreatedAt
                })
                .ToListAsync();

            var recentActivities = activityLogs
                .Select(a => new RecentActivityDto
                {
                    Activity = a.Activity,
                    Time = GetTimeAgo(
                        TimeZoneInfo.ConvertTimeFromUtc(a.CreatedAt, istZone)
                    )
                })
                .ToList();

            // Upcoming Holidays
            var upcomingHolidays = await _context.Holidays
                .Where(h => h.Holiday_Date >= today)
                .OrderBy(h => h.Holiday_Date)
                .Take(3)
                .Select(h => new UpComingHolidayDto
                {
                    HolidayName = h.Holiday_Name,
                    Date = h.Holiday_Date
                })
                .ToListAsync();

            return new DashboardResponseDto
            {
                TotalEmployees = totalEmployees,
                TotalDepartments = totalDepartments,
                ActiveProjects = activeProjects,
                AttendancePercentage = Math.Round(attendancePercentage, 2),
                RecentActivities = recentActivities,
                UpcomingHolidays = upcomingHolidays
            };
        }

        private static string GetTimeAgo(DateTime dateTime)
        {
            var timeSpan = DateTime.Now - dateTime;

            if (timeSpan.TotalSeconds < 60)
                return $"{timeSpan.Seconds} seconds ago";

            if (timeSpan.TotalMinutes < 60)
                return $"{timeSpan.Minutes} minutes ago";

            if (timeSpan.TotalHours < 24)
                return $"{timeSpan.Hours} hours ago";

            if (timeSpan.TotalDays < 7)
                return $"{timeSpan.Days} days ago";

            return dateTime.ToString("dd MMM yyyy");
        }
    }
}