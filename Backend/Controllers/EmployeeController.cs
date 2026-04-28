using EmployeeManagementSystem.DTOs;
using EmployeeManagementSystem.Services;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeesController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;

        public EmployeesController(IEmployeeService employeeService)
        {
            _employeeService = employeeService;
        }

        // ADD EMPLOYEE
        [HttpPost]
        public async Task<IActionResult> AddEmployee(EmployeeDto dto)
        {
            var result = await _employeeService.AddEmployee(dto);

            return Ok(new
            {
                message = "Employee added successfully",
                data = result
            });
        }

        // GET ALL EMPLOYEES
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var employees = await _employeeService.GetAllEmployees();
            return Ok(employees);
        }

        // UPDATE EMPLOYEE
        [HttpPut("{employeeId}")]
        public async Task<IActionResult> UpdateEmployee(string employeeId, EmployeeDto dto)
        {
            var employee = await _employeeService.UpdateEmployee(employeeId, dto);

            if (employee == null)
                return NotFound("Employee not found");

            return Ok(employee);
        }

        // DELETE EMPLOYEE
        [HttpDelete("{employeeId}")]
        public async Task<IActionResult> Delete(string employeeId)
        {
            var result = await _employeeService.DeleteEmployee(employeeId);

            if (result == "Employee not found")
                return NotFound(result);

            return Ok(result);
        }
    }
}