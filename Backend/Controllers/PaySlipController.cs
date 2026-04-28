using EmployeeManagementSystem.Data;
using EmployeeManagementSystem.Interfaces;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EmployeeManagementSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [EnableCors("AllowAll")]
    public class PaySlipController : ControllerBase
    {
        private readonly IPaySlipService _service;
        private readonly AppDbContext _context;

        public PaySlipController(IPaySlipService service, AppDbContext context)
        {
            _service = service;
            _context = context;
        }

        //--------------------------------
        // GENERATE SINGLE PAYSLIP
        //--------------------------------
        [HttpPost("generate")]
        public async Task<IActionResult> GeneratePaySlip(
            string employeeId,
            int year,
            string month,
            decimal? OtherDeductions)
        {
            var result = await _service.GeneratePaySlip(employeeId, year, month, OtherDeductions ?? 0);
            return Ok(result);
        }
        //--------------------------------
        // GENERATE ALL PAYSLIPS
        //--------------------------------
        [HttpPost("generate-all")]
        public async Task<IActionResult> GenerateAll(int year, string month)
        {
            var result = await _service.GenerateAllPaySlips(year, month);
            return Ok(result);
        }
        //--------------------------------
        // GET RECENT PAYSLIPS
        //--------------------------------
        [HttpGet("recent")]
        public async Task<IActionResult> GetRecent()
        {
            var data = await _service.GetRecentPayslips();
            return Ok(data);
        }
        //--------------------------------
        // PREVIEW PAYSLIP (INLINE VIEW)
        [HttpGet("preview/{id}")]
        public async Task<IActionResult> Preview(int id)
        {
            var payslip = await _context.PaySlips.FindAsync(id);

            if (payslip == null || !System.IO.File.Exists(payslip.FilePath))
                return NotFound("File not found");

            var fileBytes = System.IO.File.ReadAllBytes(payslip.FilePath);

            return File(fileBytes, "application/pdf"); // inline preview
        }
        //--------------------------------
        // DOWNLOAD PAYSLIP
        //--------------------------------
        [HttpGet("download/{id}")]
        public async Task<IActionResult> Download(int id)
        {
            var payslip = await _context.PaySlips.FindAsync(id);

            if (payslip == null || !System.IO.File.Exists(payslip.FilePath))
                return NotFound("File not found");

            var fileBytes = System.IO.File.ReadAllBytes(payslip.FilePath);

            return File(fileBytes, "application/pdf", Path.GetFileName(payslip.FilePath));
        }
        [HttpGet("my")]
        public async Task<IActionResult> GetMyPayslips()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;

            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.Email == email);

            if (employee == null)
                return BadRequest("Employee not found");

            var payslips = await _context.PaySlips
                .Where(p => p.EmployeeId == employee.Employee_Id)
                .OrderByDescending(p => p.Year)
                .ThenByDescending(p => p.Month)
                .ToListAsync();

            var baseUrl = $"{Request.Scheme}://{Request.Host}";

            var result = payslips.Select(p => new
            {
                p.Id,
                p.EmployeeId,
                p.Year,
                p.Month,
                p.CTC,
                p.GrossSalary,
                p.TotalDeductions,
                p.NetSalary,
                p.Generated_On,

                // ✅ ADD THESE LINKS
                PreviewUrl = $"{baseUrl}/api/payslip/preview/{p.Id}",
                DownloadUrl = $"{baseUrl}/api/payslip/download/{p.Id}"
            });

            return Ok(result);
        }
    }
}

