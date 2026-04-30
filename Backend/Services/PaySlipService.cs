using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using EmployeeManagementSystem.Data;
using EmployeeManagementSystem.Interfaces;
using EmployeeManagementSystem.Models;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using System.Globalization;
using System.Runtime.InteropServices;

namespace EmployeeManagementSystem.Services
{
    public class PaySlipService : IPaySlipService
    {
        private readonly AppDbContext _context;
        private readonly IAttendanceService _attendanceService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public PaySlipService(AppDbContext context,
                              IAttendanceService attendanceService,
                              IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _attendanceService = attendanceService;
            _httpContextAccessor = httpContextAccessor;
        }

        //--------------------------------
        // GENERATE SINGLE PAYSLIP
        //--------------------------------
        public async Task<string> GeneratePaySlip(string employeeId, int year, string month, decimal OtherDeductions)
        {
            var employee = await _context.Employees
                .AsNoTracking()
                .Include(e => e.BankDetails)
                .FirstOrDefaultAsync(e => e.Employee_Id == employeeId);

            if (employee == null)
                throw new Exception("Employee not found");

            var personalInfo = await _context.EmployeePersonalInfos
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Employee_Id == employeeId);

            //--------------------------------
            // MONTH
            //--------------------------------
            if (!DateTime.TryParseExact(
                month.Trim(),
                "MMMM",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out DateTime parsedMonth))
            {
                throw new Exception($"Invalid month format: {month}");
            }

            int monthNumber = parsedMonth.Month;
            int yearValue = year;

            //--------------------------------
            // ATTENDANCE
            //--------------------------------
            var summary = await _attendanceService
                .GetMonthlyAttendanceSummary(employee.Employee_Id, monthNumber, yearValue);

            int absentDays = summary.AbsentDays;
            decimal presentDays = summary.PresentDays;

            int totalDaysInMonth = DateTime.DaysInMonth(yearValue, monthNumber);
            int weekendDays = (int)(totalDaysInMonth - (presentDays + absentDays));

            int totalWorkingDays = (int)(presentDays + absentDays + weekendDays);
            int lopDays = absentDays;
            decimal paidDays = presentDays + weekendDays;

            //--------------------------------
            // CALCULATIONS (UNCHANGED)
            //--------------------------------
            decimal annualCTC = employee.CTC;
            decimal monthlyCTC = annualCTC / 12;

            decimal ratio = (decimal)paidDays / totalDaysInMonth;

            decimal basic = Math.Round((monthlyCTC * 0.3817m) * ratio);
            decimal hra = Math.Round((basic * 0.40m));
            decimal conveyance = Math.Round(1600 * ratio);
            decimal medical = Math.Round(1250 * ratio);

            decimal pf = Math.Round(basic * 0.12m);
            decimal gross = (monthlyCTC * ratio) - pf;

            decimal specialAllowance =
                gross - (basic + hra + conveyance + medical);

            decimal totalEarnings =
                basic + hra + conveyance + medical + specialAllowance;

            decimal professionalTax = 200;

            decimal totalDeductions =
                pf + professionalTax + OtherDeductions;

            decimal netSalary =
                totalEarnings - totalDeductions;

            if (netSalary < 0)
                netSalary = 0;

            string netSalaryWords = NumberToWords((long)netSalary) + " Only";

            //--------------------------------
            // TEMPLATE
            //--------------------------------
            var templatePath = Path.Combine(
                Directory.GetCurrentDirectory(),
                "Templates",
                "PayslipTemplate 1 (1).docx");

            if (!File.Exists(templatePath))
                throw new Exception($"Template not found: {templatePath}");

            var outputFolder = Path.Combine(
                Directory.GetCurrentDirectory(),
                "wwwroot",
                "GeneratedPayslips");

            if (!Directory.Exists(outputFolder))
                Directory.CreateDirectory(outputFolder);

            var fileName = $"Payslip_{employee.Employee_Id}_{DateTime.Now:yyyyMMddHHmmss}.docx";
            var outputPath = Path.Combine(outputFolder, fileName);

            File.Copy(templatePath, outputPath, true);

            //--------------------------------
            // REPLACE BOOKMARKS
            //--------------------------------
            using (WordprocessingDocument wordDoc =
                WordprocessingDocument.Open(outputPath, true))
            {
                ReplaceBookmark(wordDoc, "CandidateName", employee.Name);
                ReplaceBookmark(wordDoc, "EmployeeID", employee.Employee_Id);
                ReplaceBookmark(wordDoc, "Position", employee.RoleName);
                ReplaceBookmark(wordDoc, "Department", employee.Department);
                ReplaceBookmark(wordDoc, "Month", $"{month.ToUpper()} {year}");

                ReplaceBookmark(wordDoc, "JoiningDate",
                    employee.JoiningDate.ToString("dd/MM/yyyy"));

                ReplaceBookmark(wordDoc, "Basic", basic.ToString("N0"));
                ReplaceBookmark(wordDoc, "HRA", hra.ToString("N0"));
                ReplaceBookmark(wordDoc, "TotalEarnings", totalEarnings.ToString("N0"));
                ReplaceBookmark(wordDoc, "TotalDeduction", totalDeductions.ToString("N0"));
                ReplaceBookmark(wordDoc, "NetSalary", netSalary.ToString("N0"));
                ReplaceBookmark(wordDoc, "InWords", netSalaryWords);

                ReplaceBookmark(wordDoc, "TotalWorkingDays", totalWorkingDays.ToString());
                ReplaceBookmark(wordDoc, "LOPDays", lopDays.ToString());
                ReplaceBookmark(wordDoc, "PaidDays", paidDays.ToString());
            }

            //--------------------------------
            // DOCX → PDF
            //--------------------------------
            var pdfPath = outputPath.Replace(".docx", ".pdf");

            var process = new Process();
            var sofficePath = RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                ? @"C:\Program Files\LibreOffice\program\soffice.exe"
                : "/usr/bin/soffice";

            process.StartInfo.FileName = sofficePath;
            process.StartInfo.Arguments =
                $"--headless --convert-to pdf \"{outputPath}\" --outdir \"{outputFolder}\"";

            process.StartInfo.CreateNoWindow = true;
            process.StartInfo.UseShellExecute = false;

            process.Start();
            process.WaitForExit();

            if (!File.Exists(pdfPath))
                throw new Exception("PDF generation failed.");

            if (File.Exists(outputPath))
                File.Delete(outputPath);

            //--------------------------------
            // SAVE
            //--------------------------------
            var payslip = new PaySlip
            {
                EmployeeId = employee.Employee_Id,
                Month = month,
                Year = year,
                GrossSalary = gross,
                NetSalary = netSalary,
                TotalDeductions = totalDeductions,
                OtherDeductions = OtherDeductions,
                FilePath = pdfPath,
                Generated_On = DateTime.Now
            };

            _context.PaySlips.Add(payslip);
            await _context.SaveChangesAsync();

            //--------------------------------
            // RETURN URL
            //--------------------------------
            var request = _httpContextAccessor.HttpContext?.Request;
            var baseUrl = request != null ? $"{request.Scheme}://{request.Host}" : "";

            var fileNameOnly = Path.GetFileName(pdfPath);
            return baseUrl + $"/GeneratedPayslips/{fileNameOnly}";
        }

        //--------------------------------
        // BULK GENERATION (FIXED ERROR)
        //--------------------------------
        public async Task<List<string>> GenerateAllPaySlips(int year, string month)
        {
            var employeeIds = await _context.Employees
                .Select(e => e.Employee_Id)
                .ToListAsync();

            var result = new List<string>();

            foreach (var empId in employeeIds)
            {
                var filePath = await GeneratePaySlip(empId, year, month, 0);
                result.Add(filePath);
            }

            return result;
        }

        //--------------------------------
        // GET RECENT (FIXED ERROR)
        //--------------------------------
        public async Task<List<PaySlip>> GetRecentPayslips()
        {
            return await _context.PaySlips
                .OrderByDescending(x => x.Id)
                .ToListAsync();
        }

        //--------------------------------
        // BOOKMARK
        //--------------------------------
        private void ReplaceBookmark(WordprocessingDocument doc, string name, string text)
        {
            var bookmark = doc.MainDocumentPart.RootElement
                .Descendants<BookmarkStart>()
                .FirstOrDefault(b => b.Name == name);

            if (bookmark != null)
            {
                var run = bookmark.NextSibling<Run>();
                if (run != null)
                {
                    run.RemoveAllChildren<Text>();
                    run.Append(new Text(text));
                }
            }
        }

        //--------------------------------
        // NUMBER TO WORDS (UNCHANGED)
        //--------------------------------
        public static string NumberToWords(long number)
        {
            if (number == 0) return "Zero";

            string words = "";

            if ((number / 100000) > 0)
            {
                words += NumberToWords(number / 100000) + " Lakh ";
                number %= 100000;
            }

            if ((number / 1000) > 0)
            {
                words += NumberToWords(number / 1000) + " Thousand ";
                number %= 1000;
            }

            if ((number / 100) > 0)
            {
                words += NumberToWords(number / 100) + " Hundred ";
                number %= 100;
            }

            if (number > 0)
            {
                var units = new[]
                {
                    "Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
                    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen",
                    "Sixteen","Seventeen","Eighteen","Nineteen"
                };

                var tens = new[]
                {
                    "Zero","Ten","Twenty","Thirty","Forty","Fifty",
                    "Sixty","Seventy","Eighty","Ninety"
                };

                if (number < 20)
                    words += units[number];
                else
                {
                    words += tens[number / 10];
                    if ((number % 10) > 0)
                        words += " " + units[number % 10];
                }
            }

            return words;
        }
    }
}