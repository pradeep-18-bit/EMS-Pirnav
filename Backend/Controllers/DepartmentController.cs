using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployeeManagementSystem.Data;

[ApiController]
[Route("api/[controller]")]
public class DepartmentsController : ControllerBase
{
    private readonly AppDbContext _context;

    public DepartmentsController(AppDbContext context)
    {
        _context = context;
    }

    // ✅ Create Department
    [HttpPost]
    public async Task<IActionResult> Create(DepartmentDto dto)
    {
        var department = new Department
        {
            DepartmentName = dto.DepartmentName,
            DepartmentHead = dto.DepartmentHead,
            Building = dto.Building,
            Status = dto.Status,
            MembersCount = dto.MembersCount,
            Department_Id= dto.Department_Id,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Departments.AddAsync(department);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Department created successfully"});
    }

    // ✅ Get All
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var departments = await _context.Departments.ToListAsync();
        return Ok(departments);
    }

    // ✅ Get By Id
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var department = await _context.Departments.FindAsync(id);

        if (department == null)
            return NotFound("Department not found");

        return Ok(department);
    }

    // ✅ Update Department
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, DepartmentDto dto)
    {
        var department = await _context.Departments.FindAsync(id);

        if (department == null)
            return NotFound("Department not found");

        department.DepartmentName = dto.DepartmentName;
        department.DepartmentHead = dto.DepartmentHead;
        department.Building = dto.Building;
        department.Status = dto.Status;
        department.Department_Id = dto.Department_Id;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Department updated successfully"});
    }

    // ✅ Delete Department
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var department = await _context.Departments.FindAsync(id);

        if (department == null)
            return NotFound("Department not found");

        _context.Departments.Remove(department);
        await _context.SaveChangesAsync();

        return Ok("Department deleted successfully");
    }
}
