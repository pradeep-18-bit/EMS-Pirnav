using EmployeeManagementSystem.Data;
using EmployeeManagementSystem.DTOs;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementSystem.Services
{
    public class ReportsService
    {
        private readonly AppDbContext _context;

        public ReportsService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<AllReportsDTO> GetAllReports()
        {
            // ✅ Basic Counts
            var totalEmployees = await _context.Employees.CountAsync();
            var totalDepartments = await _context.Departments.CountAsync();

            // ✅ UTC Date Range (PostgreSQL safe)
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);

            // ✅ Get today's attendance records once (optimized)
            var todayAttendance = await _context.Attendance
                .Where(a => a.Attendance_Date >= today && a.Attendance_Date < tomorrow)
                .ToListAsync();

            // ✅ Normalize status (lowercase safely)
            var workingStatuses = new[] { "present", "late" };

            var presentToday = todayAttendance
                .Count(a => a.Status != null &&
                            workingStatuses.Contains(a.Status.ToLower()));

            var leaveToday = todayAttendance
                .Count(a => a.Status != null &&
                            a.Status.ToLower() == "leave");

            // ✅ Final Absent Calculation (CORRECT)
            var absentToday = totalEmployees - (presentToday + leaveToday);

            // Tasks & Projects
            var totalTasks = await _context.TaskManagement.CountAsync();
            var totalProjects = await _context.Projects.CountAsync();

            // Leaves
            var totalLeaves = await _context.EmployeeLeaves.CountAsync();

            // ✅ Salary (UTC safe)
            var now = DateTime.UtcNow;

            var startOfMonth = new DateTime(
                now.Year,
                now.Month,
                1,
                0, 0, 0,
                DateTimeKind.Utc
            );

            var startOfNextMonth = startOfMonth.AddMonths(1);

            var totalSalaryPaid = await _context.PaySlips
                .Where(p => p.Generated_On >= startOfMonth &&
                            p.Generated_On < startOfNextMonth)
                .SumAsync(p => (decimal?)p.NetSalary) ?? 0;

            return new AllReportsDTO
            {
                TotalEmployees = totalEmployees,
                TotalDepartments = totalDepartments,
                PresentToday = presentToday,
                AbsentToday = absentToday,
                TotalTasks = totalTasks,
                TotalProjects = totalProjects,
                TotalLeaves = totalLeaves,
                TotalSalaryPaid = totalSalaryPaid,
                CurrentMonth = now.ToString("MMMM yyyy")
            };
        }
    }
}