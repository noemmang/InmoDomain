using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Alerts.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "alertas",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    usuario_id = table.Column<Guid>(type: "uuid", nullable: false),
                    codigo_provincia = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    metrica = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    condicion = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    umbral = table.Column<decimal>(type: "numeric(8,2)", nullable: false),
                    activa = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    fecha_creacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    fecha_ultimo_disparo = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    periodo_ultimo_disparo = table.Column<DateOnly>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_alertas", x => x.id);
                    table.CheckConstraint("ck_alertas_condicion", "condicion IN ('mayor_que', 'menor_que')");
                    table.CheckConstraint("ck_alertas_metrica", "metrica IN ('property_score', 'indice_precio', 'indice_tendencia_precio', 'indice_actividad', 'precio_m2')");
                });

            migrationBuilder.CreateIndex(
                name: "IX_alertas_codigo_provincia_activa",
                table: "alertas",
                columns: new[] { "codigo_provincia", "activa" });

            migrationBuilder.CreateIndex(
                name: "IX_alertas_usuario_id",
                table: "alertas",
                column: "usuario_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "alertas");
        }
    }
}
