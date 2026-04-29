using EmployeeManagementSystem.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Net;
using System.Net.Mail;

namespace EmployeeManagementSystem.Services
{
    public class EmailService : IEmailService
    {
        private readonly string _host;
        private readonly int _port;
        private readonly string _fromEmail;
        private readonly string _appPassword;
        private readonly string _loginUrl;

        public EmailService(IConfiguration configuration)
        {
            _host = configuration["EmailSettings:Host"] ?? "smtp.gmail.com";
            _port = int.TryParse(configuration["EmailSettings:Port"], out var port) ? port : 587;
            _fromEmail = configuration["EmailSettings:Username"] ?? "";
            _appPassword = configuration["EmailSettings:Password"] ?? "";
            _loginUrl = configuration["Frontend:LoginUrl"] ?? "";
        }

        public void SendOtp(string toEmail, string otp)
        {
            using (var smtp = CreateSmtpClient())
            {
                var message = new MailMessage();
                message.From = new MailAddress(_fromEmail);
                message.To.Add(toEmail);
                message.Subject = "Password Reset OTP";
                message.Body = $"Your OTP is: {otp}";
                message.IsBodyHtml = false;

                smtp.Send(message);
            }
        }

        public async Task SendEmailWithAttachment(
            string toEmail,
            string subject,
            string body,
            string attachmentPath)
        {
            using (var smtp = CreateSmtpClient())
            {
                var message = new MailMessage();
                message.From = new MailAddress(_fromEmail);
                message.To.Add(toEmail);
                message.Subject = subject;
                message.Body = body;
                message.IsBodyHtml = false;

                if (File.Exists(attachmentPath))
                {
                    message.Attachments.Add(new Attachment(attachmentPath));
                }

                await smtp.SendMailAsync(message);
            }
        }

        public void SendEmployeeCredentials(string toEmail, string employeeName, string password)
        {
            using (var smtp = CreateSmtpClient())
            {
                var message = new MailMessage();
                message.From = new MailAddress(_fromEmail);
                message.To.Add(toEmail);
                message.Subject = "EMS Login Details";

                message.Body = $"Hello {employeeName},\n\n" +
                               $"Your account is created.\n\n" +
                               $"Login Link: {_loginUrl}\n" +
                               $"Temporary Password: {password}\n\n" +
                               $"Please change your password after login.";

                smtp.Send(message);
            }
        }

        private SmtpClient CreateSmtpClient()
        {
            if (string.IsNullOrWhiteSpace(_fromEmail) || string.IsNullOrWhiteSpace(_appPassword))
            {
                throw new InvalidOperationException("EmailSettings:Username and EmailSettings:Password must be configured.");
            }

            return new SmtpClient(_host, _port)
            {
                EnableSsl = true,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(_fromEmail, _appPassword),
                DeliveryMethod = SmtpDeliveryMethod.Network
            };
        }
    }
}
