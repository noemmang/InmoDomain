using System.ComponentModel.DataAnnotations;

namespace Identity.Dtos;

public class UpdateProfileDto
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(255)]
    public string Email { get; set; } = string.Empty;

    // Data URL en base64 de la foto de perfil. Null elimina la foto actual.
    [Base64Image]
    public string? ProfilePhoto { get; set; }
}