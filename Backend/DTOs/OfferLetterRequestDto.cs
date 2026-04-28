namespace EmployeeManagementSystem.DTOs
{
    public class OfferLetterRequestDto
   
    {
        public string Candidate_Name { get; set; }
        public string Email { get; set; }   // NEW
        public string Address { get; set; }
        public string Position {  get; set; }
        public DateTime Joining_Date { get; set; }
        public decimal CTC_Annual { get; set; }
    }
}
