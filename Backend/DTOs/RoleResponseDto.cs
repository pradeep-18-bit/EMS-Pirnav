namespace EmployeeManagementSystem.DTOs
{
    public class RoleResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int UsersCount {  get; set; }
    }
}
