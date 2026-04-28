using EmployeeManagementSystem.Data;
using EmployeeManagementSystem.DTOs;
using EmployeeManagementSystem.Interfaces;
using EmployeeManagementSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementSystem.Services
{
    public class EmployeeService : IEmployeeService
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IAdminNotificationService _adminNotificationService;
        private readonly IUserNotificationService _notificationService;

        public EmployeeService(
      AppDbContext context,
      IUserNotificationService notificationService,
      IAdminNotificationService adminNotificationService,
      IEmailService emailService)
        {
            _context = context;
            _notificationService = notificationService;
            _adminNotificationService = adminNotificationService;
            _emailService = emailService; // 👈 IMPORTANT
        }

        // ✅ ADD EMPLOYEE
        public async Task<object> AddEmployee(EmployeeDto dto)
        {
            // 1. Check duplicate
            var exists = await _context.Employees
                .AnyAsync(e => e.Employee_Id == dto.Employee_Id);

            if (exists)
                throw new Exception("Employee ID already exists");

            // 2. Convert RoleName → RoleId
            var role = await _context.Roles
                .FirstOrDefaultAsync(r => r.Name == dto.RoleName);

            if (role == null)
                throw new Exception("Invalid Role Name");

            // 3. Create Employee
            var password = Guid.NewGuid().ToString().Substring(0, 8);
            var employee = new Employee
            {
                Employee_Id = dto.Employee_Id,
                Name = dto.Name,
                Department = dto.Department,
                RoleId = role.RoleId,
                RoleName = role.Name,
                CTC = dto.CTC,
                Status = dto.Status,
                Email = dto.Email,
                JoiningDate = dto.JoiningDate,
                Password=password
            }; 

            // ✅ STEP 1: SAVE EMPLOYEE FIRST
            _context.Employees.Add(employee);
            await _context.SaveChangesAsync();
            _emailService.SendEmployeeCredentials(
                    employee.Email,
                    employee.Name,
                    password
                        );
            // ✅ STEP 2: NOW ADD LEAVE BALANCE (AFTER EMPLOYEE EXISTS)
            _context.EmployeeLeaveBalances.Add(new EmployeeLeaveBalance
            {
                Employee_Id = employee.Employee_Id,
                Earned_Total = 10,
                Earned_Used = 0,
                Casual_Total = 12,
                Casual_Used = 0,
                Sick_Total = 10,
                Sick_Used = 0
            });

            // 5. Department count
            var dept = await _context.Departments
                .FirstOrDefaultAsync(d => d.DepartmentName == dto.Department);

            if (dept != null)
                dept.MembersCount += 1;

            // 6. Activity log
            _context.ActivityLogs.Add(new ActivityLog
            {
                Activity = $"Employee {dto.Name} added",
                CreatedAt = DateTime.UtcNow
            });

            // ✅ SAVE AGAIN (for leave + dept + logs)
            await _context.SaveChangesAsync();

            // 7. Sync Role → User table
            if (!string.IsNullOrEmpty(employee.Email))
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == employee.Email);

                if (user != null)
                {
                    user.RoleId = role.RoleId;
                    await _context.SaveChangesAsync();
                }
            }

            // 8. Notifications
            await _adminNotificationService.CreateNotification(
                "New Employee Added",
                $"{employee.Name} has joined the company"
            );

            await _notificationService.CreateNotification(new UserNotificationDto
            {
                Employee_Id = employee.Employee_Id,
                Title = "Welcome to EMS",
                Message = $"Welcome {employee.Name}, your employee account has been created."
            });

            return employee;
        }
        // ✅ GET ALL
        public async Task<List<Employee>> GetAllEmployees()
        {
            return await _context.Employees.ToListAsync();
        }

        // ✅ UPDATE EMPLOYEE
        public async Task<Employee?> UpdateEmployee(string employeeId, EmployeeDto dto)
        {
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.Employee_Id == employeeId);

            if (employee == null)
                return null;

            // 🔥 STORE OLD DEPARTMENT
            var oldDepartment = employee.Department;

            // 🔥 Convert RoleName → RoleId
            var role = await _context.Roles
                .FirstOrDefaultAsync(r => r.Name == dto.RoleName);

            if (role == null)
                throw new Exception("Invalid Role Name");

            // ✅ UPDATE FIELDS
            employee.Name = dto.Name;
            employee.Department = dto.Department;
            employee.RoleId = role.RoleId;
            employee.RoleName = role.Name;
            employee.CTC = dto.CTC;
            employee.Status = dto.Status;
            employee.Email = dto.Email;
            employee.JoiningDate = dto.JoiningDate;

            // 🔥 HANDLE DEPARTMENT COUNT CHANGE
            if (oldDepartment != dto.Department)
            {
                // OLD DEPARTMENT -1
                var oldDept = await _context.Departments
                    .FirstOrDefaultAsync(d => d.DepartmentName == oldDepartment);

                if (oldDept != null && oldDept.MembersCount > 0)
                    oldDept.MembersCount -= 1;

                // NEW DEPARTMENT +1
                var newDept = await _context.Departments
                    .FirstOrDefaultAsync(d => d.DepartmentName == dto.Department);

                if (newDept != null)
                    newDept.MembersCount += 1;
            }

            // 🔥 Sync user role
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == employee.Email);

            if (user != null)
                user.RoleId = role.RoleId;

            // 🔥 Activity log
            _context.ActivityLogs.Add(new ActivityLog
            {
                Activity = $"Employee {dto.Name} updated",
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            return employee;
        }

        // ✅ DELETE EMPLOYEE
        public async Task<string> DeleteEmployee(string employeeId)
        {
            var emp = await _context.Employees
                .FirstOrDefaultAsync(e => e.Employee_Id == employeeId);

            if (emp == null)
                return "Employee not found";

            // Department count
            var dept = await _context.Departments
                .FirstOrDefaultAsync(d => d.DepartmentName == emp.Department);

            if (dept != null && dept.MembersCount > 0)
                dept.MembersCount -= 1;

            _context.Employees.Remove(emp);

            _context.ActivityLogs.Add(new ActivityLog
            {
                Activity = $"Employee {emp.Name} deleted",
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            return "Employee deleted successfully";
        }
    }
}