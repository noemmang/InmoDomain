namespace MarketData.ImportJob.Integrations.Mivau;

// Mapeo del texto de territorio tal como aparece en los .XLS de MIVAU (columna B)
// al codigo INE de provincia. Verificado identico en las 8 combinaciones fichero x
// hoja (35101500.XLS / 35102000.XLS x 4 hojas cada uno). El nombre leido del .XLS
// debe pasarse por Trim() antes de esta busqueda.
public static class MivauProvinceNames
{
    public static readonly IReadOnlyDictionary<string, string> ByRawName = new Dictionary<string, string>
    {
        ["Almería"] = "04",
        ["Cádiz"] = "11",
        ["Córdoba"] = "14",
        ["Granada"] = "18",
        ["Huelva"] = "21",
        ["Jaén"] = "23",
        ["Málaga"] = "29",
        ["Sevilla"] = "41",
        ["Huesca"] = "22",
        ["Teruel"] = "44",
        ["Zaragoza"] = "50",
        ["Asturias (Principado de )"] = "33",
        ["Balears (Illes)"] = "07",
        ["Palmas (Las)"] = "35",
        ["Santa Cruz de Tenerife"] = "38",
        ["Cantabria"] = "39",
        ["Ávila"] = "05",
        ["Burgos"] = "09",
        ["León"] = "24",
        ["Palencia"] = "34",
        ["Salamanca"] = "37",
        ["Segovia"] = "40",
        ["Soria"] = "42",
        ["Valladolid"] = "47",
        ["Zamora"] = "49",
        ["Albacete"] = "02",
        ["Ciudad Real"] = "13",
        ["Cuenca"] = "16",
        ["Guadalajara"] = "19",
        ["Toledo"] = "45",
        ["Barcelona"] = "08",
        ["Girona"] = "17",
        ["Lleida"] = "25",
        ["Tarragona"] = "43",
        ["Alicante/Alacant"] = "03",
        ["Castellón/Castelló"] = "12",
        ["Valencia/València"] = "46",
        ["Badajoz"] = "06",
        ["Cáceres"] = "10",
        ["Coruña (A)"] = "15",
        ["Lugo"] = "27",
        ["Ourense"] = "32",
        ["Pontevedra"] = "36",
        ["Madrid (Comunidad de)"] = "28",
        ["Murcia (Región de)"] = "30",
        ["Navarra (Comunidad Foral de)"] = "31",
        ["Araba/Alava"] = "01",
        ["Gipuzkoa"] = "20",
        ["Bizkaia"] = "48",
        ["Rioja (La)"] = "26",
        ["Ceuta"] = "51",
        ["Melilla"] = "52"
    };
}