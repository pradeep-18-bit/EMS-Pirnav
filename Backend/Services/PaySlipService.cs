using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using EmployeeManagementSystem.Data;
using EmployeeManagementSystem.Helpers;
using EmployeeManagementSystem.Interfaces;
using EmployeeManagementSystem.Models;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace EmployeeManagementSystem.Services
{
    public class PaySlipService : IPaySlipService
    {
        private readonly AppDbContext _context;
        private readonly IAttendanceService _attendanceService;
        private readonly IHttpContextAccessor _httpContextAccessor;


        public PaySlipService(AppDbContext context, IAttendanceService attendanceService, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _attendanceService = attendanceService;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<string> GeneratePaySlip(string employeeId, int year, string month, decimal OtherDeductions)
        {
            //--------------------------------
            // FETCH EMPLOYEE (OPTIMIZED)
            //--------------------------------
            var employee = await _context.Employees
                .AsNoTracking()
                .Include(e => e.BankDetails)
                .FirstOrDefaultAsync(e => e.Employee_Id == employeeId);

            if (employee == null)
                throw new Exception("Employee not found");

            //--------------------------------
            // FETCH PERSONAL INFO (OPTIMIZED)
            //--------------------------------
            var personalInfo = await _context.EmployeePersonalInfos
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Employee_Id == employeeId);


            if (!DateTime.TryParseExact(
         month.Trim(),
         "MMMM",
         CultureInfo.InvariantCulture,
         DateTimeStyles.None,
         out DateTime parsedMonth))
            {
                throw new Exception($"Invalid month format: {month}");
            }

            int monthNumber = parsedMonth.Month; int yearValue = year;

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
            // SALARY CALCULATIONS (UNCHANGED)
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

            int workingDays = totalWorkingDays;

            decimal perDaySalary = workingDays > 0
                ? totalEarnings / workingDays
                : 0;

            decimal earnedSalary = perDaySalary * presentDays;

            if (netSalary < 0)
                netSalary = 0;

            string netSalaryWords = NumberToWords((long)netSalary) + " Only";

            //--------------------------------
            // MONTH
            //--------------------------------
            string monthYear = $"{month.ToUpper()} {year}";

            //--------------------------------
            // TEMPLATE PATH
            //--------------------------------
            var templatePath = Path.Combine(
                Directory.GetCurrentDirectory(),
                "Templates",
                "PaySlipTemplate 1 (1).docx");

            var outputFolder = Path.Combine(
     Directory.GetCurrentDirectory(),
     "wwwroot",
     "GeneratedPayslips");

            if (!Directory.Exists(outputFolder))
                Directory.CreateDirectory(outputFolder);

            var fileName =
                $"Payslip_{employee.Employee_Id}_{employee.Name}_{DateTime.Now:yyyyMMddHHmmss}.docx";

            var outputPath = Path.Combine(outputFolder, fileName);

            File.Copy(templatePath, outputPath, true);

            //--------------------------------
            // WORD BOOKMARK REPLACEMENT
            //--------------------------------
            using (WordprocessingDocument wordDoc =
                WordprocessingDocument.Open(outputPath, true))
            {
                ReplaceBookmark(wordDoc, "CandidateName", employee.Name);
                ReplaceBookmark(wordDoc, "EmployeeID", employee.Employee_Id);
                ReplaceBookmark(wordDoc, "Position", employee.RoleName);
                ReplaceBookmark(wordDoc, "Department", employee.Department);
                ReplaceBookmark(wordDoc, "Month", monthYear);

                ReplaceBookmark(wordDoc, "JoiningDate",
                    employee.JoiningDate.ToString("dd/MM/yyyy"));

                ReplaceBookmark(wordDoc, "BankAccountNumber",
                    employee.BankDetails?.Account_Number ?? "");

                ReplaceBookmark(wordDoc, "BankName",
                    employee.BankDetails?.Bank_Name ?? "");

                ReplaceBookmark(wordDoc, "UAN",
                    employee.BankDetails?.UAN_Number ?? "");

                ReplaceBookmark(wordDoc, "PF",
                    employee.BankDetails?.PF_Account_Number ?? "");

                ReplaceBookmark(wordDoc, "PAN",
                    personalInfo?.PanNumber ?? "");

                ReplaceBookmark(wordDoc, "Location",
     string.IsNullOrEmpty(personalInfo?.Location)
         ? "Hyderabad"
         : personalInfo.Location);

                ReplaceBookmark(wordDoc, "Basic", basic.ToString("N0"));
                ReplaceBookmark(wordDoc, "HRA", hra.ToString("N0"));
                ReplaceBookmark(wordDoc, "ConveyanceAllowance", conveyance.ToString("N0"));
                ReplaceBookmark(wordDoc, "Medical", medical.ToString("N0"));
                ReplaceBookmark(wordDoc, "Special", specialAllowance.ToString("N0"));

                ReplaceBookmark(wordDoc, "TotalEarnings", totalEarnings.ToString("N0"));
                ReplaceBookmark(wordDoc, "OtherDeduction", OtherDeductions.ToString("N0"));
                ReplaceBookmark(wordDoc, "TotalDeduction", totalDeductions.ToString("N0"));
                ReplaceBookmark(wordDoc, "NetSalary", netSalary.ToString("N0"));

                ReplaceBookmark(wordDoc, "ProfessionalTax", professionalTax.ToString("N0"));
                ReplaceBookmark(wordDoc, "PFAmount", pf.ToString("N0"));

                ReplaceBookmark(wordDoc, "InWords", netSalaryWords);

                ReplaceBookmark(wordDoc, "TotalWorkingDays", totalWorkingDays.ToString());
                ReplaceBookmark(wordDoc, "LOPDays", lopDays.ToString());
                ReplaceBookmark(wordDoc, "PaidDays", paidDays.ToString());
            }

            //--------------------------------
            // DOCX → PDF
            //--------------------------------
            var pdfPath = outputPath.Replace(".docx", ".pdf");

            ConvertDocxToPdf(outputPath, pdfPath);

            if (File.Exists(outputPath))
            {
                File.Delete(outputPath);
            }

            //--------------------------------
            // SAVE TO DATABASE
            //--------------------------------
            //--------------------------------
            // SAVE TO DATABASE (WITH DUPLICATE CHECK)
            //--------------------------------
            var exists = await _context.PaySlips
                .AnyAsync(p => p.EmployeeId == employee.Employee_Id
                            && p.Month == month
                            && p.Year == year);

            if (exists)
            {
                Console.WriteLine($"Already exists: {employee.Employee_Id} - {month} {year}");
                return "Skipped";
            }
            var fileNameOnly = Path.GetFileName(pdfPath);
            var relativePath = $"/GeneratedPayslips/{fileNameOnly}";

            var request = _httpContextAccessor.HttpContext?.Request;
            var baseUrl = request == null ? string.Empty : $"{request.Scheme}://{request.Host}";

            var remoteUrl = string.IsNullOrWhiteSpace(baseUrl) ? relativePath : baseUrl + relativePath;

            var payslip = new PaySlip
            {
                EmployeeId = employee.Employee_Id,
                CTC = employee.CTC,
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

            return remoteUrl;
        }

        //--------------------------------
        // BULK PAYSLIP GENERATION (OPTIMIZED)
        //--------------------------------
        public async Task<List<string>> GenerateAllPaySlips(int year, string month)
        {
            var employeeIds = await _context.Employees
                .AsNoTracking()
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
        // GET ALL PAYSLIPS (OPTIMIZED)
        //--------------------------------
        public async Task<List<PaySlip>> GetRecentPayslips()
        {
            return await _context.PaySlips
                .AsNoTracking()
                .OrderByDescending(x => x.Id)
                .ToListAsync();
        }

        //--------------------------------
        // DOCX → PDF
        //--------------------------------
        private void ConvertDocxToPdf(string docxPath, string pdfPath)
        {
            LibreOfficeConverter.ConvertDocxToPdf(docxPath, pdfPath);
        }

        //--------------------------------
        // NUMBER TO WORDS
        //--------------------------------
        public static string NumberToWords(long number)
        {
            if (number == 0)
                return "Zero";

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
                var unitsMap = new[]
                {
                    "Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
                    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen",
                    "Sixteen","Seventeen","Eighteen","Nineteen"
                };

                var tensMap = new[]
                {
                    "Zero","Ten","Twenty","Thirty","Forty","Fifty",
                    "Sixty","Seventy","Eighty","Ninety"
                };

                if (number < 20)
                    words += unitsMap[number];
                else
                {
                    words += tensMap[number / 10];
                    if ((number % 10) > 0)
                        words += " " + unitsMap[number % 10];
                }
            }

            return words;
        }

        //--------------------------------
        // BOOKMARK METHOD (UNCHANGED)
        //--------------------------------
        private void ReplaceBookmark(
            WordprocessingDocument doc,
            string bookmarkName,
            string text)
        {
            var bookmark = doc.MainDocumentPart.RootElement
                .Descendants<BookmarkStart>()
                .FirstOrDefault(b => b.Name == bookmarkName);

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
    }
}
