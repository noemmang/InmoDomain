namespace MarketData.ImportJob.Integrations.Istac;

// Codigo de territorio del ISTAC (NUTS) -> codigo INE de provincia.
// Verificado contra el fichero real: 63 territorios = Espana + 10 CCAA pluriprovinciales
// + 52 provincias/ciudades (las uniprovinciales y Ceuta/Melilla vienen con codigo NUTS2).
// Las filas de Espana y de las CCAA pluriprovinciales no estan aqui a proposito: se descartan
// para no duplicar datos (se recomponen sumando provincias; comprobado que cuadran).
public static class IstacTerritoryCodes
{
    public static readonly IReadOnlyDictionary<string, string> ToProvinceCode = new Dictionary<string, string>
    {
        ["ES111"] = "15", // A Coruna
        ["ES112"] = "27", // Lugo
        ["ES113"] = "32", // Ourense
        ["ES114"] = "36", // Pontevedra
        ["ES12"] = "33",  // Asturias
        ["ES13"] = "39",  // Cantabria
        ["ES211"] = "01", // Araba/Alava
        ["ES212"] = "20", // Gipuzkoa
        ["ES213"] = "48", // Bizkaia
        ["ES22"] = "31",  // Navarra
        ["ES23"] = "26",  // La Rioja
        ["ES241"] = "22", // Huesca
        ["ES242"] = "44", // Teruel
        ["ES243"] = "50", // Zaragoza
        ["ES30"] = "28",  // Madrid
        ["ES411"] = "05", // Avila
        ["ES412"] = "09", // Burgos
        ["ES413"] = "24", // Leon
        ["ES414"] = "34", // Palencia
        ["ES415"] = "37", // Salamanca
        ["ES416"] = "40", // Segovia
        ["ES417"] = "42", // Soria
        ["ES418"] = "47", // Valladolid
        ["ES419"] = "49", // Zamora
        ["ES421"] = "02", // Albacete
        ["ES422"] = "13", // Ciudad Real
        ["ES423"] = "16", // Cuenca
        ["ES424"] = "19", // Guadalajara
        ["ES425"] = "45", // Toledo
        ["ES431"] = "06", // Badajoz
        ["ES432"] = "10", // Caceres
        ["ES511"] = "08", // Barcelona
        ["ES512"] = "17", // Girona
        ["ES513"] = "25", // Lleida
        ["ES514"] = "43", // Tarragona
        ["ES521"] = "03", // Alicante
        ["ES522"] = "12", // Castellon
        ["ES523"] = "46", // Valencia
        ["ES53"] = "07",  // Baleares
        ["ES611"] = "04", // Almeria
        ["ES612"] = "11", // Cadiz
        ["ES613"] = "14", // Cordoba
        ["ES614"] = "18", // Granada
        ["ES615"] = "21", // Huelva
        ["ES616"] = "23", // Jaen
        ["ES617"] = "29", // Malaga
        ["ES618"] = "41", // Sevilla
        ["ES62"] = "30",  // Murcia
        ["ES63"] = "51",  // Ceuta
        ["ES64"] = "52",  // Melilla
        ["ES701"] = "35", // Las Palmas
        ["ES702"] = "38"  // Santa Cruz de Tenerife
    };
}
