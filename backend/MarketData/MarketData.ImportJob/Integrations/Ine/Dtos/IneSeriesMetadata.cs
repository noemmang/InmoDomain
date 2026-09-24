using System.Text.Json.Serialization;

namespace MarketData.ImportJob.Integrations.Ine.Dtos;

// Una entrada por cada variable que identifica la serie (p. ej. Provincias,
// Estado de la vivienda, Titulo de adquisicion, Tipo de dato). Id es el id del
// VALOR concreto de esa variable (p. ej. Id=5 -> Almeria dentro de la variable
// Provincias), no el id de la variable en si.
public class IneSeriesMetadata
{
    [JsonPropertyName("Id")]
    public int Id { get; set; }

    [JsonPropertyName("T3_Variable")]
    public string Variable { get; set; } = string.Empty;

    [JsonPropertyName("Nombre")]
    public string Nombre { get; set; } = string.Empty;

    [JsonPropertyName("Codigo")]
    public string Codigo { get; set; } = string.Empty;
}
