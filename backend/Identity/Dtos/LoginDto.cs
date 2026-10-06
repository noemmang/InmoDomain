using System.ComponentModel.DataAnnotations;

namespace Identity.Dtos;

public class LoginDto
{
    [Required]
    [EmailAddress]
    [StringLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(128)]
    public string Password { get; set; } = string.Empty;
}