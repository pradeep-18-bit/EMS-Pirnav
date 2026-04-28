namespace EmployeeManagementSystem.Interfaces
{
    public interface IEmailService
    {
        void SendOtp(string toEmail, string otp);
        void SendEmployeeCredentials(string toEmail, string employeeName, string password);

        Task SendEmailWithAttachment(
            string toEmail,
            string subject,
            string body,
            string attachmentPath);
    }

}
