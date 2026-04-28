using EmployeeManagementSystem.DTOs;
using EmployeeManagementSystem.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagementSystem.Controllers
{
    [ApiController]                       // ✅ ADD THIS
    [Route("api/[controller]")]          // ✅ ADD THIS
    public class RolesController : ControllerBase
    {
        private readonly IRoleService _service;

        public RolesController(IRoleService service)
        {
            _service = service;
        }

        // ✅ POST: Create Role
        [HttpPost]
        public async Task<IActionResult> CreateRole(CreateRoleDto dto)
        {
            var role = await _service.CreateRole(dto);
            return Ok(role);
        }

        // ✅ GET: Get Roles
        [HttpGet]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _service.GetRoles();
            return Ok(roles);
        }
        [HttpPut("{roleId}")]
        public async Task<IActionResult> UpdateRole(int roleId, CreateRoleDto dto)
        {
            var role = await _service.UpdateRole(roleId, dto);

            if (role == null)
                return NotFound("Role not found");

            return Ok(role);
        }
        [HttpDelete("{roleId}")]
        public async Task<IActionResult> DeleteRole(int roleId)
        {
            var result = await _service.DeleteRole(roleId);

            if (!result)
                return NotFound("Role not found");

            return Ok("Role deleted successfully");
        }
    }
}