using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Property.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "provincias",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    codigo_ine = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    nombre = table.Column<string>(type: "text", nullable: false),
                    comunidad_autonoma = table.Column<string>(type: "text", nullable: false),
                    poblacion = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_provincias", x => x.id);
                    table.UniqueConstraint("AK_provincias_codigo_ine", x => x.codigo_ine);
                });

            migrationBuilder.CreateTable(
                name: "favoritos",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    usuario_id = table.Column<Guid>(type: "uuid", nullable: false),
                    codigo_provincia = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    fecha_creacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_favoritos", x => x.id);
                    table.ForeignKey(
                        name: "FK_favoritos_provincias_codigo_provincia",
                        column: x => x.codigo_provincia,
                        principalTable: "provincias",
                        principalColumn: "codigo_ine",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_favoritos_codigo_provincia",
                table: "favoritos",
                column: "codigo_provincia");

            migrationBuilder.CreateIndex(
                name: "IX_favoritos_usuario_id_codigo_provincia",
                table: "favoritos",
                columns: new[] { "usuario_id", "codigo_provincia" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_provincias_codigo_ine",
                table: "provincias",
                column: "codigo_ine",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "favoritos");

            migrationBuilder.DropTable(
                name: "provincias");
        }
    }
}
