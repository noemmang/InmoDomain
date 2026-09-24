using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MarketData.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "compraventas_vivienda",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    codigo_provincia = table.Column<string>(type: "text", nullable: false),
                    periodo = table.Column<DateOnly>(type: "date", nullable: false),
                    estado_vivienda = table.Column<string>(type: "text", nullable: false),
                    numero_operaciones = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_compraventas_vivienda", x => x.id);
                    table.CheckConstraint("ck_compraventas_estado_vivienda", "estado_vivienda IN ('nueva', 'segunda_mano')");
                });

            migrationBuilder.CreateTable(
                name: "datos_cache",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    clave_cache = table.Column<string>(type: "text", nullable: false),
                    contenido = table.Column<string>(type: "jsonb", nullable: false),
                    fecha_expiracion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    fecha_creacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_datos_cache", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "valores_tasados",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    codigo_provincia = table.Column<string>(type: "text", nullable: false),
                    periodo = table.Column<DateOnly>(type: "date", nullable: false),
                    antiguedad_vivienda = table.Column<string>(type: "text", nullable: false),
                    precio_m2 = table.Column<decimal>(type: "numeric(10,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_valores_tasados", x => x.id);
                    table.CheckConstraint("ck_valores_tasados_antiguedad", "antiguedad_vivienda IN ('<=5', '>5')");
                });

            migrationBuilder.CreateIndex(
                name: "IX_compraventas_vivienda_codigo_provincia_periodo_estado_vivie~",
                table: "compraventas_vivienda",
                columns: new[] { "codigo_provincia", "periodo", "estado_vivienda" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_datos_cache_clave_cache",
                table: "datos_cache",
                column: "clave_cache",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_valores_tasados_codigo_provincia_periodo_antiguedad_vivienda",
                table: "valores_tasados",
                columns: new[] { "codigo_provincia", "periodo", "antiguedad_vivienda" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "compraventas_vivienda");

            migrationBuilder.DropTable(
                name: "datos_cache");

            migrationBuilder.DropTable(
                name: "valores_tasados");
        }
    }
}
