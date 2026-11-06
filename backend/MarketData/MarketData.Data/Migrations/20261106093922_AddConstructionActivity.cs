using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MarketData.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddConstructionActivity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "construccion_vivienda",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    codigo_provincia = table.Column<string>(type: "text", nullable: false),
                    periodo = table.Column<DateOnly>(type: "date", nullable: false),
                    fase = table.Column<string>(type: "text", nullable: false),
                    regimen = table.Column<string>(type: "text", nullable: false),
                    numero_viviendas = table.Column<int>(type: "integer", nullable: false),
                    es_provisional = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_construccion_vivienda", x => x.id);
                    table.CheckConstraint("ck_construccion_fase", "fase IN ('iniciada', 'terminada')");
                    table.CheckConstraint("ck_construccion_regimen", "regimen IN ('libre', 'protegida')");
                });

            migrationBuilder.CreateIndex(
                name: "IX_construccion_vivienda_codigo_provincia_periodo_fase_regimen",
                table: "construccion_vivienda",
                columns: new[] { "codigo_provincia", "periodo", "fase", "regimen" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "construccion_vivienda");
        }
    }
}
