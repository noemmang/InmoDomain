namespace MarketData.ImportJob.Integrations.Ine;

// IDs numericos de variable/valor de la tabla 6150 (Tempus3), verificados contra
// VARIABLES_TABLA/6150 y VALORES_GRUPOSTABLA/6150/{idGrupo}. Usados para construir
// el parametro tv=idVariable:idValor de DATOS_TABLA/6150.
public static class IneMetadataCatalog
{
    public const int ProvinceVariableId = 115;
    public const int RegimeVariableId = 503;
    public const int DwellingStatusVariableId = 345;

    // Clave: codigo INE de provincia (2 digitos). Mismo Id que la variable generica
    // del catalogo INE; confirmado sin discrepancias frente al grupo propio de la tabla 6150.
    public static readonly IReadOnlyDictionary<string, int> ProvinceValueIds = new Dictionary<string, int>
    {
        ["01"] = 2,
        ["02"] = 3,
        ["03"] = 4,
        ["04"] = 5,
        ["05"] = 6,
        ["06"] = 7,
        ["07"] = 8,
        ["08"] = 9,
        ["09"] = 10,
        ["10"] = 11,
        ["11"] = 12,
        ["12"] = 13,
        ["13"] = 14,
        ["14"] = 15,
        ["15"] = 16,
        ["16"] = 17,
        ["17"] = 18,
        ["18"] = 19,
        ["19"] = 20,
        ["20"] = 21,
        ["21"] = 22,
        ["22"] = 23,
        ["23"] = 24,
        ["24"] = 25,
        ["25"] = 26,
        ["26"] = 27,
        ["27"] = 28,
        ["28"] = 29,
        ["29"] = 30,
        ["30"] = 31,
        ["31"] = 32,
        ["32"] = 53,
        ["33"] = 33,
        ["34"] = 34,
        ["35"] = 35,
        ["36"] = 36,
        ["37"] = 37,
        ["38"] = 38,
        ["39"] = 39,
        ["40"] = 40,
        ["41"] = 41,
        ["42"] = 42,
        ["43"] = 43,
        ["44"] = 44,
        ["45"] = 45,
        ["46"] = 46,
        ["47"] = 47,
        ["48"] = 48,
        ["49"] = 49,
        ["50"] = 50,
        ["51"] = 51,
        ["52"] = 52
    };

    // NO SE USA en el ImportJob: verificado contra respuestas reales de DATOS_TABLA/6150
    // que el INE no publica una serie que cruce regimen y estado (son dos desgloses
    // independientes, no combinables en una misma peticion). Se mantiene documentado
    // por si en el futuro se retoma el filtro por regimen. Free=284449 confirmado
    // contra JSON real; Subsidized=284450 NUNCA ha aparecido en una respuesta real,
    // es un valor asumido por continuidad de rango, sin verificar.
    public static readonly IReadOnlyDictionary<HousingRegime, int> RegimeValueIds = new Dictionary<HousingRegime, int>
    {
        [HousingRegime.Free] = 284449,
        [HousingRegime.Subsidized] = 284450
    };

    // New=16464 confirmado contra JSON real de DATOS_TABLA/6150. SecondHand=16465 es
    // un valor ASUMIDO (nunca ha aparecido en una respuesta real vista hasta ahora) -
    // verificar contra una llamada real filtrada por este id antes de asumirlo en produccion.
    // El valor 16463 ("General") existe pero no se usa: agrega nueva + segunda mano.
    public static readonly IReadOnlyDictionary<DwellingStatus, int> DwellingStatusValueIds = new Dictionary<DwellingStatus, int>
    {
        [DwellingStatus.New] = 16464,
        [DwellingStatus.SecondHand] = 16465
    };
}