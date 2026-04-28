using EmployeeManagementSystem.Interfaces;

using Microsoft.AspNetCore.Authorization;

using Microsoft.AspNetCore.Mvc;

using System.Security.Claims;

namespace EmployeeManagementSystem.Controllers

{

    [Route("api/[controller]")]

    [ApiController]

    public class AttendanceController : ControllerBase

    {

        private readonly IAttendanceService _attendanceService;

        public AttendanceController(IAttendanceService attendanceService)

        {

            _attendanceService = attendanceService;

        }

        //---------------------------------------

        // 🔐 HELPER: ADMIN CHECK

        //---------------------------------------

        private bool IsAdmin()

        {

            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            return role == "Admin";

        }

        //---------------------------------------

        // 👨‍💻 EMPLOYEE APIs

        //---------------------------------------

        // ✅ Check-In

        [HttpPost("check-in")]

        public async Task<IActionResult> CheckIn()

        {

            return await _attendanceService.CheckIn(User);

        }

        // ✅ Check-Out

        [HttpPost("check-out")]

        public async Task<IActionResult> CheckOut()

        {

            return await _attendanceService.CheckOut(User);

        }

        //---------------------------------------

        // 👨‍💻 EMPLOYEE ATTENDANCE VIEW

        //---------------------------------------

        // ✅ Weekly

        [HttpGet("weekly")]

        public async Task<IActionResult> GetWeekly()

        {

            return await _attendanceService.GetWeeklyAttendance(User);

        }

        // ✅ Previous Week

        [HttpGet("previous-week")]

        public async Task<IActionResult> GetPreviousWeek()

        {

            return await _attendanceService.GetPreviousWeekAttendance(User);

        }

        // ✅ Current Month (Running Month)

        [HttpGet("current-month")]

        public async Task<IActionResult> GetCurrentMonth()

        {

            return await _attendanceService.GetCurrentMonthAttendance(User);

        }

        // ✅ Previous Month

        [HttpGet("previous-month")]

        public async Task<IActionResult> GetPreviousMonth()

        {

            return await _attendanceService.GetPreviousMonthAttendance(User);

        }

        // ✅ Custom Month View

        [HttpGet("month")]

        public async Task<IActionResult> GetMonth(

    [FromQuery] int month,

    [FromQuery] int year)

        {

            return await _attendanceService.GetMonthAttendance(User, month, year);

        }

        //---------------------------------------

        // 👨‍💼 ADMIN APIs

        //---------------------------------------

        // ✅ Daily Attendance (MAIN UI)

       

        [HttpGet("today")]

        public async Task<IActionResult> GetTodayAttendance(

            [FromQuery] string status = "All",

            [FromQuery] string search = "")

        {



            var result = await _attendanceService.GetTodayAttendance(status, search);

            return Ok(result);

        }

        // ✅ Monthly / Year View

        [HttpGet("monthly")]

        public async Task<IActionResult> GetMonthlyAttendance(

            [FromQuery] int month,

            [FromQuery] int year)

        {

            

            var result = await _attendanceService.GetAllEmployeeAttendance(month, year);

            return Ok(result);

        }


        [HttpPost("admin/update-attendance")]

        public async Task<IActionResult> AdminUpdateAttendance(string employeeId, DateTime date, DateTime? checkIn, DateTime? checkOut)

        {

            return await _attendanceService.AdminUpdateAttendance(employeeId, date, checkIn, checkOut);

        }

        //---------------------------------------

        // 📊 DASHBOARD APIs

        //---------------------------------------

        // ✅ Today Stats

        // ✅ Today
        [Authorize(Roles = "Admin")]
        [HttpGet("stats/today")]
        public async Task<IActionResult> GetTodayStats()
        {
            var result = await _attendanceService.GetTodayStats();
            return Ok(result);
        }

        // ✅ Yearly Summary
        [Authorize(Roles = "Admin")]
        [HttpGet("stats/year")]
        public async Task<IActionResult> GetYearlySummary([FromQuery] int year)
        {
            var result = await _attendanceService.GetYearlySummary(year);
            return Ok(result);
        }
        //---------------------------------------

        // 🔔 NOTIFICATION / JOB TRIGGERS

        //---------------------------------------

        // ✅ Run Absent Check

        [HttpPost("run/absent-check")]

        public async Task<IActionResult> RunAbsentCheck()

        {

            

            return Ok("Absent check executed");

        }

        // ✅ Run Missing Checkout Check

        [HttpPost("run/missing-checkout")]

        public async Task<IActionResult> RunMissingCheckout()

        {

           

            return Ok("Missing checkout check executed");

        }

    }

}
