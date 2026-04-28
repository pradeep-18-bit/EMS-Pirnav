public class ProjectDto
{
    public string Project_Name { get; set; } = string.Empty;
    public string Project_Id { get; set; } = string.Empty;
    public string? Client { get; set; }
    public int? ClientId { get; set; }
    public DateTime? Start_Date { get; set; }
    public DateTime? End_Date { get; set; }
    public string? Team_Members { get; set; }
    public string Status { get; set; } = string.Empty;
}