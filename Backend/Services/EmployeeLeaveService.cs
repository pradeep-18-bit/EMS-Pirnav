using EmployeeManagementSystem.Data;

using EmployeeManagementSystem.Interfaces;

using EmployeeManagementSystem.Models;

using Microsoft.AspNetCore.Mvc;

using Microsoft.EntityFrameworkCore;

using System.Security.Claims;

public class EmployeeLeaveService : IEmployeeLeaveService

{

    private readonly AppDbContext _context;

    private readonly IAdminNotificationService _notificationService;

    public EmployeeLeaveService(

    AppDbContext context,

    IAdminNotificationService notificationService)

    {

        _context = context;

        _notificationService = notificationService;

    }

    public async Task<IActionResult> ApplyLeave(EmployeeLeaveDto dto, ClaimsPrincipal user)

    {

        var email = user.FindFirst(ClaimTypes.Email)?.Value?.Trim().ToLower();

        var employee = await _context.Employees

        .FirstOrDefaultAsync(e => e.Email.ToLower() == email);

        if (employee == null)

            return new BadRequestObjectResult("Employee not found");

        var leave = new EmployeeLeave

        {

            EmployeeId = employee.Employee_Id,

            EmployeeName = employee.Name,

            LeaveType = dto.LeaveType,

            FromDate = dto.FromDate,

            ToDate = dto.ToDate,

            Reason = dto.Reason,

            Status = "Pending",

            CreatedAt = DateTime.UtcNow

        };

        await _context.EmployeeLeaves.AddAsync(leave);

        await _context.SaveChangesAsync();


        // 🔔 ADMIN NOTIFICATION

        _context.AdminNotifications.Add(new AdminNotification

        {

            Title = "Leave Request",

            Message = $"{employee.Name} applied for leave",

            UserRole = "Admin",

            IsRead = false,

            CreatedAt = DateTime.UtcNow

        });

        await _context.SaveChangesAsync();

        return new OkObjectResult("Leave applied successfully");

    }
    public async Task<IActionResult> UpdateStatus(int id, string status)
    {
        var leave = await _context.EmployeeLeaves.FindAsync(id);

        if (leave == null)
            return new NotFoundObjectResult("Leave not found");

        var fromDate = DateTime.SpecifyKind(leave.FromDate, DateTimeKind.Utc);
        var toDate = DateTime.SpecifyKind(leave.ToDate, DateTimeKind.Utc);

        //---------------------------------------
        // ✅ STORE OLD STATUS (IMPORTANT FIX)
        //---------------------------------------
        var oldStatus = leave.Status;

        //---------------------------------------
        // ✅ CHECK BEFORE UPDATE (KEEP YOUR LOGIC)
        //---------------------------------------
        if (leave.Status == "Approved" && status == "Approved")
            return new BadRequestObjectResult("Already approved");

        //---------------------------------------
        // GET BALANCE
        //---------------------------------------
        var balance = await _context.EmployeeLeaveBalances
            .FirstOrDefaultAsync(b => b.Employee_Id == leave.EmployeeId);

        if (balance == null)
        {
            balance = new EmployeeLeaveBalance
            {
                Employee_Id = leave.EmployeeId
            };
            _context.EmployeeLeaveBalances.Add(balance);
            await _context.SaveChangesAsync();
        }

        int days = await CalculateWorkingDays(fromDate, toDate);
        var leaveType = leave.LeaveType?.Trim().ToLower();

        //---------------------------------------
        // ✅ CASE 1: Pending/Rejected → Approved
        //---------------------------------------
        if (oldStatus != "Approved" && status == "Approved")
        {
            switch (leaveType)
            {
                case "casual":
                    balance.Casual_Used += days;
                    break;

                case "sick":
                    balance.Sick_Used += days;
                    break;

                case "earned":
                case "earned leave":
                    balance.Earned_Used += days;
                    break;
            }
        }

        //---------------------------------------
        // ✅ CASE 2: Approved → Rejected
        //---------------------------------------
        if (oldStatus == "Approved" && status == "Rejected")
        {
            switch (leaveType)
            {
                case "casual":
                    balance.Casual_Used -= days;
                    break;

                case "sick":
                    balance.Sick_Used -= days;
                    break;

                case "earned":
                case "earned leave":
                    balance.Earned_Used -= days;
                    break;
            }
        }

        //---------------------------------------
        // UPDATE STATUS
        //---------------------------------------
        leave.Status = status;

        //---------------------------------------
        await _context.SaveChangesAsync();

        return new OkObjectResult("Leave updated successfully");
    }

    public async Task<IActionResult> GetAllLeaves()

    {

        var leaves = await _context.EmployeeLeaves.ToListAsync();

        return new OkObjectResult(leaves);

    }

    public async Task<IActionResult> GetMyLeaves(ClaimsPrincipal user)

    {

        var email = user.FindFirst(ClaimTypes.Email)?.Value?.Trim().ToLower();

        var employee = await _context.Employees

        .FirstOrDefaultAsync(e => e.Email.ToLower() == email);

        var leaves = await _context.EmployeeLeaves

            .Where(l => l.EmployeeId == employee.Employee_Id)

            .ToListAsync();

        return new OkObjectResult(leaves);

    }

    public async Task<IActionResult> GetBalance(ClaimsPrincipal user)

    {

        // STEP 1: GET EMAIL FROM TOKEN

        var email = user.FindFirst(ClaimTypes.Email)?.Value?.Trim().ToLower();

        if (string.IsNullOrEmpty(email))

            return new UnauthorizedObjectResult("Invalid token");

        // STEP 2: GET EMPLOYEE

        var employee = await _context.Employees

        .FirstOrDefaultAsync(e => e.Email.ToLower() == email);

        if (employee == null)

            return new BadRequestObjectResult("Employee not found");

        // STEP 3: GET LEAVE BALANCE

        var balance = await _context.EmployeeLeaveBalances

            .FirstOrDefaultAsync(b => b.Employee_Id == employee.Employee_Id);

        if (balance == null)

        {

            balance = new EmployeeLeaveBalance

            {

                Employee_Id = employee.Employee_Id

                // totals will use DB default values

            };

            _context.EmployeeLeaveBalances.Add(balance);

            await _context.SaveChangesAsync();

        }

        // STEP 4: RETURN DATA

        return new OkObjectResult(new

        {

            Earned = new

            {

                Total = balance.Earned_Total,

                Used = balance.Earned_Used,

                Remaining = balance.Earned_Total - balance.Earned_Used

            },

            Casual = new

            {

                Total = balance.Casual_Total,

                Used = balance.Casual_Used,

                Remaining = balance.Casual_Total - balance.Casual_Used

            },

            Sick = new

            {

                Total = balance.Sick_Total,

                Used = balance.Sick_Used,

                Remaining = balance.Sick_Total - balance.Sick_Used

            }

        });

    }


    public async Task<IActionResult> Delete(int id)

    {

        var leave = await _context.EmployeeLeaves.FindAsync(id);

        if (leave == null)

            return new NotFoundObjectResult("Leave not found");

        _context.EmployeeLeaves.Remove(leave);

        await _context.SaveChangesAsync();

        return new OkObjectResult("Leave deleted");

    }

    public async Task<IActionResult> CancelLeave(int id, ClaimsPrincipal user)

    {

        var email = user.FindFirst(ClaimTypes.Email)?.Value?.Trim().ToLower();

        var employee = await _context.Employees

            .FirstOrDefaultAsync(e => e.Email.ToLower() == email);

        if (employee == null)

            return new BadRequestObjectResult("Employee not found");

        var leave = await _context.EmployeeLeaves

            .FirstOrDefaultAsync(l => l.Id == id && l.EmployeeId == employee.Employee_Id);

        if (leave == null)

            return new NotFoundObjectResult("Leave not found");

        if (leave.Status == "Rejected")

            return new BadRequestObjectResult("Already rejected");

        // 👉 If already approved → revert balance

        if (leave.Status == "Approved")

        {

            var balance = await _context.EmployeeLeaveBalances

                .FirstOrDefaultAsync(b => b.Employee_Id == employee.Employee_Id);

            if (balance != null)

            {

                var fromDate = DateTime.SpecifyKind(leave.FromDate, DateTimeKind.Utc);

                var toDate = DateTime.SpecifyKind(leave.ToDate, DateTimeKind.Utc);

                int days = await CalculateWorkingDays(fromDate, toDate);
                var leaveType = leave.LeaveType?.Trim().ToLower();

               switch (leaveType)
{
    case "casual":
        balance.Casual_Used -= days;
        break;

    case "sick":
        balance.Sick_Used -= days;
        break;

    case "earned":
    case "earned leave":
        balance.Earned_Used -= days;
        break;
}

            }

        }

        leave.Status = "Cancelled";

        await _context.SaveChangesAsync();

        return new OkObjectResult("Leave cancelled successfully");

    }

    private async Task<int> CalculateWorkingDays(DateTime fromDate, DateTime toDate)

    {

        int days = 0;

        for (var date = fromDate.Date; date <= toDate.Date; date = date.AddDays(1))

        {

            // Skip weekends

            if (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday)

                continue;

            // Skip holidays

            var isHoliday = await _context.Holidays

                .AnyAsync(h => h.Holiday_Date.Date == date);

            if (isHoliday)

                continue;

            days++;

        }

        return days;

    }

}

