using EmployeeManagementSystem.Data;

using EmployeeManagementSystem.DTOs;

using EmployeeManagementSystem.Interfaces;

using EmployeeManagementSystem.Models;

using Microsoft.AspNetCore.Mvc;

using Microsoft.EntityFrameworkCore;

using System.Security.Claims;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace EmployeeManagementSystem.Services

{

    public class AttendanceService : IAttendanceService

    {

        private readonly AppDbContext _context;

        private readonly IAdminNotificationService _notificationService;

        public AttendanceService(AppDbContext context, IAdminNotificationService notificationService)

        {

            _context = context;

            _notificationService = notificationService;

        }

        //---------------------------------------

        // HELPERS

        //---------------------------------------

        private DateTime ConvertToIST(DateTime utcTime)

        {

            var istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");

            return TimeZoneInfo.ConvertTimeFromUtc(utcTime, istZone);

        }

        private string MapStatus(string status)

        {

            return status switch

            {

                "P" => "Present",

                "A" => "Absent",

                "L" => "On Leave",

                "W" => "Weekend",

                "H" => "Holiday",

                _ => status

            };

        }

        private string FormatHours(int minutes)

        {

            var hrs = minutes / 60;

            var mins = minutes % 60;

            return $"{hrs}h {mins}m";

        }

        private async Task<Employee?> GetEmployee(ClaimsPrincipal user)

        {

            var email = user.FindFirst(ClaimTypes.Email)?.Value;

            return await _context.Employees.FirstOrDefaultAsync(e => e.Email == email);

        }

        //---------------------------------------

        // CHECK IN (FIXED ONLY HERE)

        //---------------------------------------

        public async Task<IActionResult> CheckIn(ClaimsPrincipal user)

        {

            var emp = await GetEmployee(user);

            if (emp == null)

                return new UnauthorizedObjectResult("Invalid user");

            var today = DateTime.UtcNow.Date;

            var existing = await _context.Attendance

                .FirstOrDefaultAsync(x => x.Employee_Id == emp.Employee_Id && x.Attendance_Date.Date == today);

            var now = DateTime.UtcNow;

            var ist = ConvertToIST(now);

            string status = ist.TimeOfDay > new TimeSpan(9, 30, 0) ? "Late" : "Present";

            if (existing != null)

            {

                // 🔥 FIX: update instead of blocking

                if (existing.Check_In != null)

                    return new BadRequestObjectResult("Already checked in");

                existing.Check_In = now;

                existing.Status = status;

                await _context.SaveChangesAsync();

                return new OkObjectResult("Check-in updated successfully");

            }

            _context.Attendance.Add(new Attendance

            {

                Employee_Id = emp.Employee_Id,

                Attendance_Date = today,

                Check_In = now,

                Status = status,

                WorkingMinutes = 0

            });

            await _context.SaveChangesAsync();

            return new OkObjectResult("Check-in successful");

        }

        //---------------------------------------

        // CHECK OUT

        //---------------------------------------

        public async Task<IActionResult> CheckOut(ClaimsPrincipal user)

        {

            var emp = await GetEmployee(user);

            if (emp == null) return new UnauthorizedObjectResult("Invalid user");

            var today = DateTime.UtcNow.Date;

            var att = await _context.Attendance

                .FirstOrDefaultAsync(x => x.Employee_Id == emp.Employee_Id && x.Attendance_Date.Date == today);

            if (att == null)

                return new BadRequestObjectResult("Check-in not found");

            if (att.Check_Out != null)

                return new BadRequestObjectResult("Already checked out");

            var now = DateTime.UtcNow;

            att.Check_Out = now;

            var minutes = (int)(now - att.Check_In.Value).TotalMinutes;

            att.WorkingMinutes = minutes;

            var hours = minutes / 60.0;

            if (hours < 4)
                att.Status = "Half Day";
            else
                att.Status = "Present";

            await _context.SaveChangesAsync();

            return new OkObjectResult("Check-out successful");

        }

        //---------------------------------------

        // ADMIN - TODAY

        //---------------------------------------

        public async Task<List<object>> GetTodayAttendance(string status = "All", string search = "")
        {
            var today = DateTime.UtcNow.Date;

            var employees = await _context.Employees
                .AsNoTracking()
                .AsNoTracking().ToListAsync();

            // ✅ Load all attendance once
            var attendanceList = await _context.Attendance
                .AsNoTracking()
                .Where(x => x.Attendance_Date == today)
               .AsNoTracking().ToListAsync();

            var result = new List<object>();

            foreach (var emp in employees)
            {
                var att = attendanceList
                    .FirstOrDefault(x => x.Employee_Id == emp.Employee_Id);

                string finalStatus = att != null ? MapStatus(att.Status) : "Absent";

                if (!string.Equals(status, "All", StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(finalStatus, status, StringComparison.OrdinalIgnoreCase))
                    continue;

                result.Add(new
                {
                    emp.Name,
                    emp.Department,
                    Status = finalStatus,
                    CheckIn = att?.Check_In != null ? (DateTime?)ConvertToIST(att.Check_In.Value) : null,
                    CheckOut = att?.Check_Out != null ? (DateTime?)ConvertToIST(att.Check_Out.Value) : null,
                    Hours = FormatHours(att?.WorkingMinutes ?? 0)
                });
            }

            return result;
        }

        //---------------------------------------

        // ADMIN - MONTHLY

        //---------------------------------------

        public async Task<List<AdminEmployeeAttendanceDto>> GetAllEmployeeAttendance(int month, int year)
        {
            var employees = await _context.Employees
                .AsNoTracking()
                .AsNoTracking().ToListAsync();

            // ✅ Preload data (MAIN OPTIMIZATION)
            var attendanceData = await _context.Attendance
                .AsNoTracking()
                .Where(x => x.Attendance_Date.Month == month && x.Attendance_Date.Year == year)
                .AsNoTracking().ToListAsync();

            var holidays = await _context.Holidays
                .AsNoTracking()
                .Where(h => h.Holiday_Date.Month == month && h.Holiday_Date.Year == year)
                .AsNoTracking().ToListAsync();

            var leaves = await _context.EmployeeLeaves
                .AsNoTracking()
                .Where(l => l.Status == "Approved")
                .AsNoTracking().ToListAsync();

            var result = new List<AdminEmployeeAttendanceDto>();

            foreach (var emp in employees)
            {
                var days = new List<AdminAttendanceDayDto>();

                for (int d = 1; d <= DateTime.DaysInMonth(year, month); d++)
                {
                    var date = new DateTime(year, month, d, 0, 0, 0, DateTimeKind.Utc);

                    // Weekend
                    if (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday)
                    {
                        days.Add(new AdminAttendanceDayDto
                        {
                            Day = d,
                            Status = "W"
                        });
                        continue;
                    }

                    // Holiday
                    var holiday = holidays.FirstOrDefault(h => h.Holiday_Date.Date == date.Date);
                    if (holiday != null)
                    {
                        days.Add(new AdminAttendanceDayDto
                        {
                            Day = d,
                            Status = "H"
                        });
                        continue;
                    }

                    // Leave
                    var leave = leaves.FirstOrDefault(l =>
                        l.EmployeeId == emp.Employee_Id &&
                        date >= l.FromDate &&
                        date <= l.ToDate);

                    if (leave != null)
                    {
                        days.Add(new AdminAttendanceDayDto
                        {
                            Day = d,
                            Status = "L"
                        });
                        continue;
                    }

                    // Attendance
                    var att = attendanceData.FirstOrDefault(x =>
                        x.Employee_Id == emp.Employee_Id &&
                        x.Attendance_Date.Date == date.Date);

                    days.Add(new AdminAttendanceDayDto
                    {
                        Day = d,
                        Status = att != null ? MapStatus(att.Status) : "Absent",
                        CheckIn = att?.Check_In != null ? ConvertToIST(att.Check_In.Value) : null,
                        CheckOut = att?.Check_Out != null ? ConvertToIST(att.Check_Out.Value) : null,
                        WorkingMinutes = att?.WorkingMinutes ?? 0
                    });
                }

                result.Add(new AdminEmployeeAttendanceDto
                {
                    EmployeeId = emp.Employee_Id,
                    EmployeeName = emp.Name,
                    Days = days
                });
            }

            return result;
        }

        //---------------------------------------

        // REQUIRED METHODS (UNCHANGED)

        //---------------------------------------

        public async Task<IActionResult> GetWeeklyAttendance(ClaimsPrincipal user)

        {

            var emp = await GetEmployee(user);

            if (emp == null)

                return new UnauthorizedObjectResult("Invalid user");

            var today = DateTime.UtcNow.Date;

            int diff = (7 + (today.DayOfWeek - DayOfWeek.Monday)) % 7;

            var monday = DateTime.SpecifyKind(today.AddDays(-diff), DateTimeKind.Utc);

            var weekEnd = monday.AddDays(7);

            var attendances = await _context.Attendance

                .Where(a => a.Employee_Id == emp.Employee_Id &&

                            a.Attendance_Date >= monday &&

                            a.Attendance_Date < weekEnd)

               .AsNoTracking().ToListAsync();

            var result = new List<object>();

            // ✅ WEEKEND FIX


            for (int i = 0; i < 7; i++)

            {

                var date = monday.AddDays(i);

                if (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday)
                {
                    result.Add(new
                    {
                        Day = date.DayOfWeek.ToString(),
                        Date = date.ToString("dd MMM yyyy"),
                        Status = "W",
                        CheckIn = (string?)null,
                        CheckOut = (string?)null,
                        Hours = "0h 0m"
                    });

                    continue; // 🔥 VERY IMPORTANT
                }

                // ✅ STEP 4: HOLIDAY CHECK
                var holiday = await _context.Holidays
      .FirstOrDefaultAsync(h => h.Holiday_Date.Date == date.Date);

                if (holiday != null)
                {
                    result.Add(new
                    {
                        Day = date.DayOfWeek.ToString(),
                        Date = date.ToString("dd MMM yyyy"),
                        Status = "H",
                        HolidayName = holiday.Holiday_Name,
                        CheckIn = (string?)null,
                        CheckOut = (string?)null,
                        Hours = "0h 0m"
                    });

                    continue;
                }
                var att = attendances

                    .FirstOrDefault(a => a.Attendance_Date.Date == date.Date);

                DateTime? checkIn = null;

                DateTime? checkOut = null;


                if (att?.Check_In != null)

                    checkIn = ConvertToIST(att.Check_In.Value);

                if (att?.Check_Out != null)

                    checkOut = ConvertToIST(att.Check_Out.Value);

                result.Add(new
                {
                    Day = date.DayOfWeek.ToString(),
                    Date = date.ToString("dd MMM yyyy"),   // ✅ ADD
                    Status = att != null
                    ? (att.Status == "Half Day" ? "HD"
                    : att.Status == "Present" ? "P"
                    : att.Status == "Late" ? "P"
                    : att.Status)
                    : "A",
                    CheckIn = checkIn?.ToString("hh:mm tt"),
                    CheckOut = checkOut?.ToString("hh:mm tt"),
                    Hours = att != null ? FormatHours(att.WorkingMinutes) : "0h 0m"
                });

            }

            return new OkObjectResult(result);

        }

        public async Task<IActionResult> GetPreviousWeekAttendance(ClaimsPrincipal user)

        {

            var emp = await GetEmployee(user);

            if (emp == null)

                return new UnauthorizedObjectResult("Invalid user");

            var today = DateTime.UtcNow.Date;

            int diff = (7 + (today.DayOfWeek - DayOfWeek.Monday)) % 7;

            var currentMonday = DateTime.SpecifyKind(today.AddDays(-diff), DateTimeKind.Utc);

            var monday = currentMonday.AddDays(-7); // ✅ previous week

            var weekEnd = monday.AddDays(7);

            var attendances = await _context.Attendance

                .Where(a => a.Employee_Id == emp.Employee_Id &&

                            a.Attendance_Date >= monday &&

                            a.Attendance_Date < weekEnd)

               .AsNoTracking().ToListAsync();

            var result = new List<object>();


            for (int i = 0; i < 7; i++)
            {
                var date = monday.AddDays(i);

                // ✅ Weekend
                if (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday)
                {
                    result.Add(new
                    {
                        Day = date.DayOfWeek.ToString(),
                        Date = date.ToString("dd MMM yyyy"),
                        Status = "W",
                        CheckIn = (string?)null,
                        CheckOut = (string?)null,
                        Hours = "0h 0m"
                    });
                    continue;
                }

                // ✅ STEP 4: HOLIDAY CHECK
                var holiday = await _context.Holidays
     .FirstOrDefaultAsync(h => h.Holiday_Date.Date == date.Date);

                if (holiday != null)
                {
                    result.Add(new
                    {
                        Day = date.DayOfWeek.ToString(),
                        Date = date.ToString("dd MMM yyyy"),
                        Status = "H",
                        HolidayName = holiday.Holiday_Name, // ✅ ADD THIS
                        CheckIn = (string?)null,
                        CheckOut = (string?)null,
                        Hours = "0h 0m"
                    });

                    continue;
                }

                var att = attendances
                    .FirstOrDefault(a => a.Attendance_Date.Date == date.Date);

                DateTime? checkIn = att?.Check_In != null ? ConvertToIST(att.Check_In.Value) : null;
                DateTime? checkOut = att?.Check_Out != null ? ConvertToIST(att.Check_Out.Value) : null;

                result.Add(new
                {
                    Day = date.DayOfWeek.ToString(),
                    Date = date.ToString("dd MMM yyyy"),
                    Status = att != null
                        ? (att.Status == "Half Day" ? "HD"
                        : att.Status == "Present" ? "P"
                        : att.Status == "Late" ? "P"
                        : att.Status)
                        : "A",

                    CheckIn = checkIn?.ToString("hh:mm tt"),
                    CheckOut = checkOut?.ToString("hh:mm tt"),
                    Hours = att != null ? FormatHours(att.WorkingMinutes) : "0h 0m"
                });
            }

            return new OkObjectResult(result);

        }

        // CURRENT MONTH ATTENDANCE

        public async Task<IActionResult> GetCurrentMonthAttendance(ClaimsPrincipal user)

        {

            var emp = await GetEmployee(user);

            if (emp == null)

                return new UnauthorizedObjectResult("Invalid user");

            var today = DateTime.UtcNow;

            // ✅ First day of current month

            var startOfMonth = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            // ✅ Tomorrow (to avoid time issues)

            var tomorrow = today.Date.AddDays(1);
            var employeeId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var attendances = await _context.Attendance

                .Where(a => a.Employee_Id == emp.Employee_Id &&

                            a.Attendance_Date >= startOfMonth &&

                            a.Attendance_Date < tomorrow)

                .AsNoTracking().ToListAsync();

            var totalDays = DateTime.DaysInMonth(today.Year, today.Month);

            var result = new List<object>();

            for (int day = 1; day <= totalDays; day++)

            {

                var date = DateTime.SpecifyKind(

    new DateTime(today.Year, today.Month, day),

    DateTimeKind.Utc

);

                // ✅ Weekend check

                if (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday)

                {

                    result.Add(new

                    {

                        Day = day,

                        Status = "W",

                        CheckIn = (DateTime?)null,

                        CheckOut = (DateTime?)null,

                        Hours = "0h 0m"

                    });

                    continue;

                }

                // ✅ Holiday check

                var holiday = await _context.Holidays
    .FirstOrDefaultAsync(h => h.Holiday_Date.Date == date.Date);

                if (holiday != null)
                {
                    result.Add(new
                    {
                        Day = date.Day,
                        Date = date.ToString("dd MMM yyyy"),
                        Status = "H",
                        HolidayName = holiday.Holiday_Name,
                        CheckIn = (string?)null,
                        CheckOut = (string?)null,
                        Hours = "0h 0m"
                    });

                    continue;
                }

                // ✅ Leave check

                var leave = await _context.EmployeeLeaves
    .FirstOrDefaultAsync(l => l.EmployeeId == employeeId &&
                             l.Status == "Approved" &&
                             date >= l.FromDate &&
                             date <= l.ToDate);

                if (leave != null)
                {
                    result.Add(new
                    {
                        Day = date.Day,
                        Date = date.ToString("dd MMM yyyy"),
                        Status = "L",
                        LeaveType = leave.LeaveType, // ✅ ADD THIS
                        CheckIn = (string?)null,
                        CheckOut = (string?)null,
                        Hours = "0h 0m"
                    });

                    continue;
                }

                var att = attendances

                    .FirstOrDefault(a => a.Attendance_Date.Date == date.Date);

                DateTime? checkIn = null;

                DateTime? checkOut = null;

                if (att?.Check_In != null)

                    checkIn = ConvertToIST(att.Check_In.Value);

                if (att?.Check_Out != null)

                    checkOut = ConvertToIST(att.Check_Out.Value);

                result.Add(new
                {
                    Day = day,
                    Status = att != null
        ? (att.Status == "Half Day" ? "HD"
        : att.Status == "Present" ? "P"
        : att.Status == "Late" ? "P"
        : att.Status)
        : "A",

                    CheckIn = checkIn?.ToString("hh:mm tt"),
                    CheckOut = checkOut?.ToString("hh:mm tt"),
                    Hours = att != null ? FormatHours(att.WorkingMinutes) : "0h 0m"
                });

            }

            return new OkObjectResult(result);

        }

        //PREVIOUS MONTH

        public async Task<IActionResult> GetPreviousMonthAttendance(ClaimsPrincipal user)

        {

            var emp = await GetEmployee(user);

            if (emp == null)

                return new UnauthorizedObjectResult("Invalid user");

            var today = DateTime.UtcNow;

            var firstDayCurrentMonth = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            var lastMonthEnd = firstDayCurrentMonth.AddDays(-1);

            var lastMonthStart = new DateTime(lastMonthEnd.Year, lastMonthEnd.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            var attendances = await _context.Attendance

                .Where(a => a.Employee_Id == emp.Employee_Id &&

                            a.Attendance_Date >= lastMonthStart &&

                            a.Attendance_Date <= lastMonthEnd)

                .AsNoTracking().ToListAsync();

            var totalDays = DateTime.DaysInMonth(lastMonthStart.Year, lastMonthStart.Month);

            var employeeId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;


            var result = new List<object>();

            for (int day = 1; day <= totalDays; day++)
            {
                var date = DateTime.SpecifyKind(
                    new DateTime(lastMonthStart.Year, lastMonthStart.Month, day),
                    DateTimeKind.Utc
                );

                // ✅ Weekend
                if (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday)
                {
                    result.Add(new
                    {
                        Day = day,
                        Status = "W",
                        CheckIn = (string?)null,
                        CheckOut = (string?)null,
                        Hours = "0h 0m"
                    });
                    continue;
                }

                // ✅ Holiday
                var holiday = await _context.Holidays
    .FirstOrDefaultAsync(h => h.Holiday_Date.Date == date.Date);

                if (holiday != null)
                {
                    result.Add(new
                    {
                        Day = date.Day,
                        Date = date.ToString("dd MMM yyyy"),
                        Status = "H",
                        HolidayName = holiday.Holiday_Name, // ✅ ADD
                        CheckIn = (string?)null,
                        CheckOut = (string?)null,
                        Hours = "0h 0m"
                    });

                    continue;
                }

                // ✅ Leave
                var leave = await _context.EmployeeLeaves
    .FirstOrDefaultAsync(l => l.EmployeeId == employeeId &&
                             l.Status == "Approved" &&
                             date >= l.FromDate &&
                             date <= l.ToDate);

                if (leave != null)
                {
                    result.Add(new
                    {
                        Day = date.Day,
                        Date = date.ToString("dd MMM yyyy"),
                        Status = "L",
                        LeaveType = leave.LeaveType, // ✅ ADD THIS
                        CheckIn = (string?)null,
                        CheckOut = (string?)null,
                        Hours = "0h 0m"
                    });

                    continue;
                }

                var att = attendances
                    .FirstOrDefault(a => a.Attendance_Date.Date == date.Date);

                DateTime? checkIn = att?.Check_In != null ? ConvertToIST(att.Check_In.Value) : null;
                DateTime? checkOut = att?.Check_Out != null ? ConvertToIST(att.Check_Out.Value) : null;

                result.Add(new
                {
                    Day = day,
                    Status = att != null
                        ? (att.Status == "Half Day" ? "HD"
                        : att.Status == "Present" ? "P"
                        : att.Status == "Late" ? "P"
                        : att.Status)
                        : "A",

                    CheckIn = checkIn?.ToString("hh:mm tt"),
                    CheckOut = checkOut?.ToString("hh:mm tt"),
                    Hours = att != null ? FormatHours(att.WorkingMinutes) : "0h 0m"
                });
            }

            return new OkObjectResult(result);

        }

        public async Task CheckMissedCheckIns() { }

        public async Task CheckMissingCheckouts()

        {
            Console.WriteLine("Auto checkout running...");
            var nowUtc = DateTime.UtcNow;
            var today = nowUtc.Date;

            var istNow = ConvertToIST(nowUtc);

            var officeEndTime = new TimeSpan(18, 0, 0); // 6 PM
            var autoCheckoutTime = officeEndTime.Add(TimeSpan.FromMinutes(30)); // 6:30 PM

            if (istNow.TimeOfDay < autoCheckoutTime)
                return;

            var records = await _context.Attendance
                .Where(a =>
                    a.Attendance_Date.Date == today &&
                    a.Check_In != null &&
                    a.Check_Out == null)
                .AsNoTracking().ToListAsync();

            var istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");

            foreach (var att in records)
            {
                var autoCheckoutIst = new DateTime(
                    istNow.Year,
                    istNow.Month,
                    istNow.Day,
                    autoCheckoutTime.Hours,
                    autoCheckoutTime.Minutes,
                    0,
                    DateTimeKind.Unspecified
                );

                var autoCheckoutUtc = TimeZoneInfo.ConvertTimeToUtc(autoCheckoutIst, istZone);

                att.Check_Out = autoCheckoutUtc;

                var minutes = (int)(att.Check_Out.Value - att.Check_In.Value).TotalMinutes;
                att.WorkingMinutes = minutes;

                var hours = minutes / 60.0;

                if (hours < 4)
                    att.Status = "Half Day";
                else
                    att.Status = "Present";
            }

            await _context.SaveChangesAsync();
        }

        public async Task<object> GetTodayStats()
        {
            await CheckMissingCheckouts();

            var today = DateTime.UtcNow.Date;

            var totalEmployees = await _context.Employees.CountAsync();

            var todayAttendance = await _context.Attendance
                .Where(a => a.Attendance_Date.Date == today)
                .AsNoTracking().ToListAsync();

            var presentCount = todayAttendance.Count(a => a.Status == "Present");

            var lateCount = todayAttendance.Count(a => a.Status == "Late");

            var absentCount = totalEmployees - presentCount;

            return new
            {
                TotalEmployees = totalEmployees,
                Present = presentCount,
                Absent = absentCount,
                Late = lateCount
            };
        }


        public async Task<IActionResult> GetMonthAttendance(
    ClaimsPrincipal user,
    int month,
    int year)
        {
            var emp = await GetEmployee(user);
            if (emp == null)
                return new UnauthorizedObjectResult("Invalid user");

            var employeeId = emp.Employee_Id;

            var daysInMonth = DateTime.DaysInMonth(year, month);

            var result = new List<object>();

            for (int i = 1; i <= daysInMonth; i++)
            {
                var date = DateTime.SpecifyKind(
    new DateTime(year, month, i),
    DateTimeKind.Utc
);

                // ✅ WEEKEND
                if (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday)
                {
                    result.Add(new
                    {
                        Day = i,
                        Date = date.ToString("dd MMM yyyy"),
                        Status = "W",
                        HolidayName = (string?)null,
                        LeaveType = (string?)null,
                        CheckIn = (string?)null,
                        CheckOut = (string?)null,
                        Hours = "0h 0m"
                    });
                    continue;
                }

                // ✅ HOLIDAY
                var holiday = await _context.Holidays
                    .FirstOrDefaultAsync(h => h.Holiday_Date.Date == date.Date);

                if (holiday != null)
                {
                    result.Add(new
                    {
                        Day = i,
                        Date = date.ToString("dd MMM yyyy"),
                        Status = "H",
                        HolidayName = holiday.Holiday_Name,
                        LeaveType = (string?)null,
                        CheckIn = (string?)null,
                        CheckOut = (string?)null,
                        Hours = "0h 0m"
                    });
                    continue;
                }

                // ✅ LEAVE
                var leave = await _context.EmployeeLeaves
                    .FirstOrDefaultAsync(l => l.EmployeeId == employeeId &&
                                             l.Status == "Approved" &&
                                             date >= l.FromDate &&
                                             date <= l.ToDate);

                if (leave != null)
                {
                    result.Add(new
                    {
                        Day = i,
                        Date = date.ToString("dd MMM yyyy"),
                        Status = "L",
                        HolidayName = (string?)null,
                        LeaveType = leave.LeaveType,
                        CheckIn = (string?)null,
                        CheckOut = (string?)null,
                        Hours = "0h 0m"
                    });
                    continue;
                }

                // ✅ ATTENDANCE
                var att = await _context.Attendance
                    .FirstOrDefaultAsync(a => a.Employee_Id == employeeId &&
                                             a.Attendance_Date.Date == date.Date);

                DateTime? checkIn = null;
                DateTime? checkOut = null;

                if (att?.Check_In != null)
                    checkIn = ConvertToIST(att.Check_In.Value);

                if (att?.Check_Out != null)
                    checkOut = ConvertToIST(att.Check_Out.Value);

                result.Add(new
                {
                    Day = i,
                    Date = date.ToString("dd MMM yyyy"),
                    Status = att != null
                        ? (att.Status == "Half Day" ? "HD"
                          : att.Status == "Present" ? "P"
                          : att.Status == "Late" ? "P"
                          : att.Status)
                        : "A",
                    HolidayName = (string?)null,
                    LeaveType = (string?)null,
                    CheckIn = checkIn?.ToString("hh:mm tt"),
                    CheckOut = checkOut?.ToString("hh:mm tt"),
                    Hours = att != null ? FormatHours(att.WorkingMinutes) : "0h 0m"
                });
            }

            return new OkObjectResult(result);
        }

        public async Task<object> GetYearlySummary(int year)
        {
            var result = new List<object>();

            for (int month = 1; month <= 12; month++)
            {
                var startDate = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
                var endDate = startDate.AddMonths(1);

                var attendance = await _context.Attendance
                    .Where(a => a.Attendance_Date >= startDate &&
                                a.Attendance_Date < endDate)
                   .AsNoTracking().ToListAsync();

                var presentCount = attendance.Count(a => a.Status == "Present");
                var lateCount = attendance.Count(a => a.Status == "Late");

                // Optional: you can calculate absent based on employee count
                var totalEmployees = await _context.Employees.CountAsync();
                var workingDays = DateTime.DaysInMonth(year, month);

                var totalExpected = totalEmployees * workingDays;

                var absentCount = totalExpected - (presentCount + lateCount);

                result.Add(new
                {
                    Month = new DateTime(year, month, 1).ToString("MMMM"),
                    Present = presentCount,
                    Late = lateCount,
                    Absent = absentCount
                });
            }

            return result;
        }

        public async Task<IActionResult> AdminUpdateAttendance(string employeeId, DateTime date, DateTime? checkIn, DateTime? checkOut)
        {
            if (date.Date > DateTime.UtcNow.Date)
                return new BadRequestObjectResult("Cannot mark future attendance");

            if (checkIn == null && checkOut == null)
                return new BadRequestObjectResult("Provide at least check-in or check-out");

            if (checkIn != null && checkOut != null && checkOut < checkIn)
                return new BadRequestObjectResult("Check-out cannot be before check-in");
            var utcDate = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);

            var attendance = await _context.Attendance
                .FirstOrDefaultAsync(a =>
                    a.Employee_Id == employeeId &&
                    a.Attendance_Date.Date == utcDate);

            var istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");

            DateTime? checkInUtc = null;
            DateTime? checkOutUtc = null;

            if (checkIn != null)
                checkInUtc = TimeZoneInfo.ConvertTimeToUtc(
                    DateTime.SpecifyKind(checkIn.Value, DateTimeKind.Unspecified),
                    istZone
                );

            if (checkOut != null)
                checkOutUtc = TimeZoneInfo.ConvertTimeToUtc(
                    DateTime.SpecifyKind(checkOut.Value, DateTimeKind.Unspecified),
                    istZone
                );

            // ✅ Create if not exists
            if (attendance == null)
            {
                attendance = new Attendance
                {
                    Employee_Id = employeeId,
                    Attendance_Date = utcDate,
                    Check_In = checkInUtc,
                    Check_Out = checkOutUtc
                };

                _context.Attendance.Add(attendance);
            }
            else
            {
                // ✅ Update existing
                if (checkInUtc != null)
                    attendance.Check_In = checkInUtc;

                if (checkOutUtc != null)
                    attendance.Check_Out = checkOutUtc;
            }

            // ✅ Calculate working hours
            if (attendance.Check_In != null && attendance.Check_Out != null)
            {
                var minutes = (int)(attendance.Check_Out.Value - attendance.Check_In.Value).TotalMinutes;
                attendance.WorkingMinutes = minutes;

                var hours = minutes / 60.0;

                if (hours < 4)
                    attendance.Status = "Half Day";
                else
                    attendance.Status = "Present";
            }

            await _context.SaveChangesAsync();

            return new OkObjectResult("Attendance updated by admin");
        }

        //ATTENDANCE SUMMARY

        public async Task<AttendanceSummaryDto> GetMonthlyAttendanceSummary(string employeeId, int month, int year)
        {
            var start = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
            var end = start.AddMonths(1);

            var attendances = await _context.Attendance
                .AsNoTracking()
                .Where(a => a.Employee_Id == employeeId &&
                            a.Attendance_Date >= start &&
                            a.Attendance_Date < end)
               .AsNoTracking().ToListAsync();

            // ✅ Preload
            var holidays = await _context.Holidays
                .AsNoTracking()
                .Where(h => h.Holiday_Date >= start && h.Holiday_Date < end)
                .AsNoTracking().ToListAsync();

            var leaves = await _context.EmployeeLeaves
                .AsNoTracking()
                .Where(l => l.EmployeeId == employeeId && l.Status == "Approved")
               .AsNoTracking().ToListAsync();

            decimal present = 0;
            int absent = 0;

            int totalDays = DateTime.DaysInMonth(year, month);

            for (int day = 1; day <= totalDays; day++)
            {
                var date = new DateTime(year, month, day, 0, 0, 0, DateTimeKind.Utc);

                if (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday)
                    continue;

                var isHoliday = holidays.Any(h => h.Holiday_Date.Date == date.Date);
                if (isHoliday)
                    continue;

                var isLeave = leaves.Any(l =>
                    date >= l.FromDate && date <= l.ToDate);

                if (isLeave)
                {
                    present++;
                    continue;
                }

                var att = attendances
                    .FirstOrDefault(a => a.Attendance_Date.Date == date.Date);

                if (att != null)
                {
                    if (att.Status == "Half Day")
                        present += 0.5m;
                    else
                        present += 1;
                }
                else
                {
                    absent++;
                }
            }

            return new AttendanceSummaryDto
            {
                PresentDays = present,
                AbsentDays = absent
            };
        }



    }

    }

