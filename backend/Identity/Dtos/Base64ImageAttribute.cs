using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace Identity.Dtos;

// Valida que el valor sea una imagen PNG, JPEG o WebP en formato data URL con base64
// y que no supere el tamaño máximo. Null o vacío son válidos (significa "sin foto").
[AttributeUsage(AttributeTargets.Property)]
public sealed partial class Base64ImageAttribute : ValidationAttribute
{
    // Máximo de caracteres del data URL completo (~1,5 MB de imagen una vez decodificada).
    public const int MaxLength = 2_000_000;

    [GeneratedRegex(@"^data:image/(png|jpeg|webp);base64,(?<data>[A-Za-z0-9+/]+={0,2})$", RegexOptions.CultureInvariant)]
    private static partial Regex DataUrlRegex();

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is null) return ValidationResult.Success;
        if (value is not string text) return new ValidationResult("La foto de perfil no es válida.");
        if (text.Length == 0) return ValidationResult.Success;

        if (text.Length > MaxLength)
        {
            return new ValidationResult("La foto de perfil es demasiado grande.");
        }

        var match = DataUrlRegex().Match(text);
        if (!match.Success)
        {
            return new ValidationResult("La foto de perfil debe ser una imagen PNG, JPEG o WebP en base64.");
        }

        var data = match.Groups["data"].Value;
        var buffer = new byte[data.Length];
        if (!Convert.TryFromBase64String(data, buffer, out _))
        {
            return new ValidationResult("La foto de perfil no es base64 válido.");
        }

        return ValidationResult.Success;
    }
}