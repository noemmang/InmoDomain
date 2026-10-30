using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Property.Migrations
{
    /// <inheritdoc />
    public partial class SeedProvinces : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Alta o actualización de las 52 provincias por codigo_ine, conservando el Id de las filas ya existentes
            // (los favoritos las referencian por codigo_ine). Población: INE, Censo Anual de Población a 1 de enero de 2025.
            migrationBuilder.Sql(@"
                INSERT INTO provincias (id, codigo_ine, nombre, comunidad_autonoma, poblacion)
                SELECT gen_random_uuid(), v.codigo_ine, v.nombre, v.comunidad_autonoma, v.poblacion
                FROM (VALUES
                ('01', 'Araba/Álava', 'País Vasco', 341961),
                ('02', 'Albacete', 'Castilla-La Mancha', 390751),
                ('03', 'Alicante/Alacant', 'Comunitat Valenciana', 2033566),
                ('04', 'Almería', 'Andalucía', 770554),
                ('05', 'Ávila', 'Castilla y León', 160738),
                ('06', 'Badajoz', 'Extremadura', 665155),
                ('07', 'Illes Balears', 'Illes Balears', 1249844),
                ('08', 'Barcelona', 'Cataluña', 5959941),
                ('09', 'Burgos', 'Castilla y León', 362663),
                ('10', 'Cáceres', 'Extremadura', 388190),
                ('11', 'Cádiz', 'Andalucía', 1261420),
                ('12', 'Castellón/Castelló', 'Comunitat Valenciana', 627620),
                ('13', 'Ciudad Real', 'Castilla-La Mancha', 494848),
                ('14', 'Córdoba', 'Andalucía', 773163),
                ('15', 'A Coruña', 'Galicia', 1135623),
                ('16', 'Cuenca', 'Castilla-La Mancha', 199859),
                ('17', 'Girona', 'Cataluña', 830429),
                ('18', 'Granada', 'Andalucía', 945797),
                ('19', 'Guadalajara', 'Castilla-La Mancha', 285839),
                ('20', 'Gipuzkoa', 'País Vasco', 733149),
                ('21', 'Huelva', 'Andalucía', 538789),
                ('22', 'Huesca', 'Aragón', 230087),
                ('23', 'Jaén', 'Andalucía', 618143),
                ('24', 'León', 'Castilla y León', 448030),
                ('25', 'Lleida', 'Cataluña', 458226),
                ('26', 'La Rioja', 'La Rioja', 326803),
                ('27', 'Lugo', 'Galicia', 326022),
                ('28', 'Madrid', 'Madrid', 7113886),
                ('29', 'Málaga', 'Andalucía', 1791183),
                ('30', 'Murcia', 'Murcia', 1586989),
                ('31', 'Navarra', 'Navarra', 683854),
                ('32', 'Ourense', 'Galicia', 305278),
                ('33', 'Asturias', 'Asturias', 1015128),
                ('34', 'Palencia', 'Castilla y León', 158702),
                ('35', 'Las Palmas', 'Canarias', 1171547),
                ('36', 'Pontevedra', 'Galicia', 947818),
                ('37', 'Salamanca', 'Castilla y León', 328446),
                ('38', 'Santa Cruz de Tenerife', 'Canarias', 1087319),
                ('39', 'Cantabria', 'Cantabria', 593623),
                ('40', 'Segovia', 'Castilla y León', 158251),
                ('41', 'Sevilla', 'Andalucía', 1977664),
                ('42', 'Soria', 'Castilla y León', 90183),
                ('43', 'Tarragona', 'Cataluña', 875530),
                ('44', 'Teruel', 'Aragón', 136091),
                ('45', 'Toledo', 'Castilla-La Mancha', 755081),
                ('46', 'Valencia/València', 'Comunitat Valenciana', 2763996),
                ('47', 'Valladolid', 'Castilla y León', 528644),
                ('48', 'Bizkaia', 'País Vasco', 1167233),
                ('49', 'Zamora', 'Castilla y León', 165564),
                ('50', 'Zaragoza', 'Aragón', 998443),
                ('51', 'Ceuta', 'Ceuta', 83567),
                ('52', 'Melilla', 'Melilla', 87067)
                ) AS v (codigo_ine, nombre, comunidad_autonoma, poblacion)
                ON CONFLICT (codigo_ine) DO UPDATE SET
                    nombre = EXCLUDED.nombre,
                    comunidad_autonoma = EXCLUDED.comunidad_autonoma,
                    poblacion = EXCLUDED.poblacion;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Elimina solo las provincias sembradas que ningún favorito referencia.
            migrationBuilder.Sql(@"
                DELETE FROM provincias p
                WHERE p.codigo_ine IN ('01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52')
                  AND NOT EXISTS (SELECT 1 FROM favoritos f WHERE f.codigo_provincia = p.codigo_ine);
            ");
        }
    }
}