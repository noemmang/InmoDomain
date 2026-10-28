using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Notifications.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "notificaciones",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    usuario_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tipo = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    titulo = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    mensaje = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    codigo_provincia = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: true),
                    leida = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    oculta = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    fecha_envio = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    clave_deduplicacion = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notificaciones", x => x.id);
                    table.CheckConstraint("ck_notificaciones_tipo", "tipo IN ('bienvenida', 'alerta', 'precio_actualizado', 'contrasena_cambiada')");
                });

            migrationBuilder.CreateIndex(
                name: "IX_notificaciones_clave_deduplicacion",
                table: "notificaciones",
                column: "clave_deduplicacion",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_notificaciones_usuario_id_oculta_fecha_envio",
                table: "notificaciones",
                columns: new[] { "usuario_id", "oculta", "fecha_envio" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "notificaciones");
        }
    }
}
