using System.ComponentModel.DataAnnotations;

namespace Identity.Dtos;

public class ForgotPasswordDto
{
    [Required]
    [EmailAddress]
    [StringLength(255)]
    public string Email { get; set; } = string.Empty;
}