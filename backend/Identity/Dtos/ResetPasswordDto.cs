using System.ComponentModel.DataAnnotations;

namespace Identity.Dtos;

public class ResetPasswordDto
{
    [Required]
    [StringLength(512)]
    public string Token { get; set; } = string.Empty;

    [Required]
    [StringLength(128, MinimumLength = 8)]
    public string NewPassword { get; set; } = string.Empty;
}