using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Analytics.Migrations
{
    /// <inheritdoc />
    public partial class NullableIndices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "indice_precio_ranking_nacional",
                table: "property_scores",
                type: "numeric(6,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(6,2)");

            migrationBuilder.AlterColumn<decimal>(
                name: "indice_precio",
                table: "property_scores",
                type: "numeric(6,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(6,2)");

            migrationBuilder.AlterColumn<decimal>(
                name: "indice_actividad_ranking_nacional",
                table: "property_scores",
                type: "numeric(6,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(6,2)");

            migrationBuilder.AlterColumn<decimal>(
                name: "indice_actividad",
                table: "property_scores",
                type: "numeric(6,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(6,2)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "indice_precio_ranking_nacional",
                table: "property_scores",
                type: "numeric(6,2)",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "numeric(6,2)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "indice_precio",
                table: "property_scores",
                type: "numeric(6,2)",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "numeric(6,2)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "indice_actividad_ranking_nacional",
                table: "property_scores",
                type: "numeric(6,2)",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "numeric(6,2)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "indice_actividad",
                table: "property_scores",
                type: "numeric(6,2)",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "numeric(6,2)",
                oldNullable: true);
        }
    }
}
