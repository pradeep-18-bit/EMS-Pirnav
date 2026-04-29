using System.Diagnostics;
using System.Runtime.InteropServices;

namespace EmployeeManagementSystem.Helpers;

public static class LibreOfficeConverter
{
    public static void ConvertDocxToPdf(string docxPath, string pdfPath)
    {
        if (!File.Exists(docxPath))
            throw new FileNotFoundException($"DOCX file not found: {docxPath}", docxPath);

        var outputFolder = Path.GetDirectoryName(pdfPath)
            ?? throw new InvalidOperationException($"Unable to resolve output folder for: {pdfPath}");

        Directory.CreateDirectory(outputFolder);

        var sofficePath = ResolveSofficePath();
        var startInfo = new ProcessStartInfo
        {
            FileName = sofficePath,
            Arguments = $"--headless --convert-to pdf --outdir \"{outputFolder}\" \"{docxPath}\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var process = Process.Start(startInfo)
            ?? throw new InvalidOperationException("Failed to start LibreOffice conversion process.");

        var stdoutTask = process.StandardOutput.ReadToEndAsync();
        var stderrTask = process.StandardError.ReadToEndAsync();
        process.WaitForExit();
        var stdout = stdoutTask.GetAwaiter().GetResult();
        var stderr = stderrTask.GetAwaiter().GetResult();

        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException(
                $"LibreOffice failed to convert '{docxPath}' to PDF. Exit code: {process.ExitCode}. {stderr} {stdout}".Trim());
        }

        if (!File.Exists(pdfPath))
        {
            throw new FileNotFoundException(
                $"LibreOffice finished but the expected PDF was not created: {pdfPath}", pdfPath);
        }
    }

    private static string ResolveSofficePath()
    {
        var configuredPath = Environment.GetEnvironmentVariable("LIBREOFFICE_PATH");
        if (!string.IsNullOrWhiteSpace(configuredPath) && File.Exists(configuredPath))
            return configuredPath;

        var candidates = RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
            ? new[] { @"C:\Program Files\LibreOffice\program\soffice.exe" }
            : new[] { "/usr/bin/soffice", "/usr/local/bin/soffice" };

        var foundPath = candidates.FirstOrDefault(File.Exists);
        if (!string.IsNullOrWhiteSpace(foundPath))
            return foundPath;

        throw new FileNotFoundException(
            "LibreOffice executable was not found. Install LibreOffice or set LIBREOFFICE_PATH to the soffice executable.");
    }
}
