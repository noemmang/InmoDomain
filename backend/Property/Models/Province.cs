namespace Property.Models;

public class Province
{
    public Guid Id { get; set; }
    public string CodeIne { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string AutonomousCommunity { get; set; } = string.Empty;
    public int Population { get; set; }
}