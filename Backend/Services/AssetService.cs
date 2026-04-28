using EmployeeManagementSystem.Data;

using EmployeeManagementSystem.DTOs;

using EmployeeManagementSystem.Interfaces;

using EmployeeManagementSystem.Models;

using Microsoft.EntityFrameworkCore;
 
namespace EmployeeManagementSystem.Services

{

    public class AssetService : IAssetService

    {

        private readonly IUserNotificationService _notificationService;

        private readonly AppDbContext _context;
 
        public AssetService(

            AppDbContext context,

            IUserNotificationService notificationService)

        {

            _context = context;

            _notificationService = notificationService;

        }
 
        // ================= CREATE ASSET =================

        public async Task<string> CreateAsset(AssetDto dto)

        {

            var imagePaths = new List<string>();
 
            if (dto.Images != null && dto.Images.Count > 0)

            {

                foreach (var image in dto.Images)

                {

                    var fileName = Guid.NewGuid().ToString() + Path.GetExtension(image.FileName);

                    var folder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads/assets");
 
                    if (!Directory.Exists(folder))

                        Directory.CreateDirectory(folder);
 
                    var filePath = Path.Combine(folder, fileName);
 
                    using (var stream = new FileStream(filePath, FileMode.Create))

                    {

                        await image.CopyToAsync(stream);

                    }
 
                    imagePaths.Add("/uploads/assets/" + fileName);

                }

            }
 
            var asset = new Asset

            {

                AssetName = dto.AssetName,

                SerialNo = dto.SerialNo,

                Status = dto.Status ?? "Available",

                AssignedTo = dto.AssignedTo,

                CreatedAt = DateTime.UtcNow,

                ImagePaths = string.Join(",", imagePaths)

            };
 
            _context.Assets.Add(asset);

            await _context.SaveChangesAsync();
 
            return "Asset created successfully";

        }
 
        // ================= GET ALL =================

        public async Task<List<Asset>> GetAllAssets()

        {

            return await _context.Assets.ToListAsync();

        }
 
        // ================= GET BY ID =================

        public async Task<Asset?> GetAssetById(int id)

        {

            return await _context.Assets.FindAsync(id);

        }
 
        // ================= UPDATE =================

        public async Task<string> UpdateAsset(int id, AssetDto dto)

        {

            var asset = await _context.Assets.FindAsync(id);
 
            if (asset == null)

                return "Asset not found";
 
            var imagePaths = new List<string>();
 
            // Keep old images

            if (!string.IsNullOrWhiteSpace(dto.ExistingImages))

            {

                imagePaths = dto.ExistingImages

                    .Split(",", StringSplitOptions.RemoveEmptyEntries)

                    .Select(x => x.Trim())

                    .Where(x => !string.IsNullOrWhiteSpace(x))

                    .ToList();

            }
 
            // Add newly uploaded images

            if (dto.Images != null && dto.Images.Count > 0)

            {

                foreach (var image in dto.Images)

                {

                    var fileName = Guid.NewGuid().ToString() + Path.GetExtension(image.FileName);

                    var folder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads/assets");
 
                    if (!Directory.Exists(folder))

                        Directory.CreateDirectory(folder);
 
                    var filePath = Path.Combine(folder, fileName);
 
                    using (var stream = new FileStream(filePath, FileMode.Create))

                    {

                        await image.CopyToAsync(stream);

                    }
 
                    imagePaths.Add("/uploads/assets/" + fileName);

                }

            }
 
            asset.AssetName = dto.AssetName;

            asset.SerialNo = dto.SerialNo;

            asset.Status = dto.Status ?? "Available";

            asset.AssignedTo = dto.Status == "Assigned" ? dto.AssignedTo : null;

            asset.ImagePaths = string.Join(",", imagePaths);
 
            await _context.SaveChangesAsync();
 
            return "Asset updated successfully";

        }
 
        // ================= ASSIGN ASSET =================

        public async Task<string> AssignAsset(int id, string employeeId)

        {

            var asset = await _context.Assets.FindAsync(id);
 
            if (asset == null)

                return "Asset not found";
 
            asset.AssignedTo = employeeId;

            asset.Status = "Assigned";
 
            await _context.SaveChangesAsync();
 
            return "Asset assigned successfully";

        }
 
        // ================= RETURN ASSET =================

        public async Task<string> ReturnAsset(int id)

        {

            var asset = await _context.Assets.FindAsync(id);
 
            if (asset == null)

                return "Asset not found";
 
            asset.AssignedTo = null;

            asset.Status = "Available";
 
            await _context.SaveChangesAsync();
 
            return "Asset returned successfully";

        }
 
        // ================= DELETE =================

        public async Task<string> DeleteAsset(int id)

        {

            var asset = await _context.Assets.FindAsync(id);
 
            if (asset == null)

                return "Asset not found";
 
            _context.Assets.Remove(asset);

            await _context.SaveChangesAsync();
 
            return "Asset deleted successfully";

        }

    }

}
 