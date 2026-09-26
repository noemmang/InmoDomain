using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Analytics.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "property_scores",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    codigo_provincia = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    periodo = table.Column<DateOnly>(type: "date", nullable: false),
                    indice_precio = table.Column<decimal>(type: "numeric(6,2)", nullable: false),
                    indice_precio_ranking_nacional = table.Column<decimal>(type: "numeric(6,2)", nullable: false),
                    indice_tendencia_precio = table.Column<decimal>(type: "numeric(6,2)", nullable: true),
                    indice_tendencia_precio_interanual = table.Column<decimal>(type: "numeric(6,2)", nullable: true),
                    indice_actividad = table.Column<decimal>(type: "numeric(6,2)", nullable: false),
                    indice_actividad_ranking_nacional = table.Column<decimal>(type: "numeric(6,2)", nullable: false),
                    property_score = table.Column<decimal>(type: "numeric(6,2)", nullable: true),
                    fecha_calculo = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_property_scores", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_property_scores_codigo_provincia_periodo",
                table: "property_scores",
                columns: new[] { "codigo_provincia", "periodo" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "property_scores");
        }
    }
}
