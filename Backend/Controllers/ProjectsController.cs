using EmployeeManagementSystem.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProjectsController(AppDbContext context)
    {
        _context = context;
    }

    // ✅ GET All
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var projects = await _context.Projects
            .Include(p => p.Client)   // 🔥 REQUIRED
            .Select(p => new ProjectDto
            {
                Project_Name = p.Project_Name,
                Project_Id = p.Project_Id,
                ClientId = p.ClientId,   // 🔥 ADD THIS
                Client = p.Client != null ? p.Client.Client_Name : null,
                Start_Date = p.Start_Date,
                End_Date = p.End_Date,
                Team_Members = p.Team_Members,
                Status = p.Status
            })
            .ToListAsync();

        return Ok(projects);
    }

    // ✅ POST
    [HttpPost]
    public async Task<IActionResult> Create(ProjectDto dto)
    {
        var project = new Project
        {
            Project_Name = dto.Project_Name,
            Project_Id = dto.Project_Id,
            ClientId = dto.ClientId,
            Start_Date = dto.Start_Date,
            End_Date = dto.End_Date,
            Team_Members = dto.Team_Members,
            Status = dto.Status
        };

        await _context.Projects.AddAsync(project);
        await _context.SaveChangesAsync();

        return Ok("New Project created successfully");
    }
    // ✅ GET Project by Project_Id
    [HttpGet("{projectId}")]
    public async Task<IActionResult> GetByProjectId(string projectId)
    {
        var project = await _context.Projects
            .Include(p => p.Client)   // 🔥 REQUIRED
            .Where(p => p.Project_Id == projectId)
            .Select(p => new ProjectDto
            {
                Project_Name = p.Project_Name,
                Project_Id = p.Project_Id,
                ClientId = p.ClientId,   // 🔥 ADD THIS
                Client = p.Client != null ? p.Client.Client_Name : null,
                Start_Date = p.Start_Date,
                End_Date = p.End_Date,
                Team_Members = p.Team_Members,
                Status = p.Status
            })
            .FirstOrDefaultAsync();

        if (project == null)
            return NotFound("Project not found");

        return Ok(project);
    }

    // ✅ PUT (Using Project_Id)
    [HttpPut("{projectId}")]
    public async Task<IActionResult> Update(string projectId, ProjectDto dto)
    {
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Project_Id == projectId);

        if (project == null)
            return NotFound("Project not found");

        project.Project_Name = dto.Project_Name;
        project.Project_Id = dto.Project_Id;
        project.ClientId = dto.ClientId;
        project.Start_Date = dto.Start_Date;
        project.End_Date = dto.End_Date;
        project.Team_Members = dto.Team_Members;
        project.Status = dto.Status;

        await _context.SaveChangesAsync();

        return Ok("Updated project created successfully");
    }

    // ✅ DELETE (Using Project_Id)
    [HttpDelete("{projectId}")]
    public async Task<IActionResult> Delete(string projectId)
    {
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Project_Id == projectId);

        if (project == null)
            return NotFound("Project not found");

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();

        return Ok("Project deleted successfully");
    }
}