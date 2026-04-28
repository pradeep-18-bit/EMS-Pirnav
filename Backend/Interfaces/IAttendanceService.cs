using Microsoft.AspNetCore.Mvc;

using EmployeeManagementSystem.DTOs;

using System.Security.Claims;

namespace EmployeeManagementSystem.Interfaces

{

    public interface IAttendanceService

    {

        //---------------------------------------

        // EMPLOYEE ACTIONS

        //---------------------------------------

        Task<IActionResult> CheckIn(ClaimsPrincipal user);

        Task<IActionResult> CheckOut(ClaimsPrincipal user);

        //---------------------------------------

        // USER ATTENDANCE VIEWS

        //---------------------------------------

        Task<IActionResult> GetWeeklyAttendance(ClaimsPrincipal user);

        Task<IActionResult> GetPreviousWeekAttendance(ClaimsPrincipal user);

        Task<IActionResult> GetCurrentMonthAttendance(ClaimsPrincipal user);

        Task<IActionResult> GetPreviousMonthAttendance(ClaimsPrincipal user);

        Task<IActionResult> GetMonthAttendance(ClaimsPrincipal user, int month, int year);

        //---------------------------------------

        // ADMIN ATTENDANCE (DAILY + MONTHLY)

        //---------------------------------------

        Task<List<object>> GetTodayAttendance(string status = "All", string search = "");

        Task<List<AdminEmployeeAttendanceDto>> GetAllEmployeeAttendance(int month, int year);

        Task<IActionResult> AdminUpdateAttendance(string employeeId, DateTime date, DateTime? checkIn, DateTime? checkOut);

        Task<AttendanceSummaryDto> GetMonthlyAttendanceSummary(string employeeId, int month, int year);

        //---------------------------------------

        // NOTIFICATIONS / BACKGROUND JOBS

        //---------------------------------------

        Task CheckMissedCheckIns();

        Task CheckMissingCheckouts();

        //---------------------------------------

        // OPTIONAL (GOOD FOR DASHBOARD)

        //---------------------------------------

        Task<object> GetTodayStats();        // present, late, absent counts

        Task<object> GetYearlySummary(int year); // yearly report

    }

}
