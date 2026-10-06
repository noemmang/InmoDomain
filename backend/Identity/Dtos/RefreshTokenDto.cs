using System.ComponentModel.DataAnnotations;

namespace Identity.Dtos;

public class RefreshTokenDto
{
    [Required]
    [StringLength(512)]
    public string RefreshToken { get; set; } = string.Empty;
}