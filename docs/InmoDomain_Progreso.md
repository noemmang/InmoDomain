# InmoDomain — Progreso

> Este documento registra el avance real del proyecto, paso a paso. Cuando se completa algo, se añade una entrada nueva. Cuando se modifica una decisión ya tomada, se **actualiza la entrada correspondiente** en vez de duplicarla. Úsalo junto con `InmoDomain_Contexto_y_Reglas.md` para retomar la conversación en cualquier ventana nueva.

## Estado actual

**Fase en curso:** Fase 5 — Market Data Service, Bloque 1 (integración real con INE y MIVAU) en curso
**Última fase completada:** Fase 4 — PostgreSQL + EF Core (Property Service) ✅ — con ella se cierra también la Fase 3

## Historial

### Fase 0 — Fundamentos conceptuales ✅ completada
- [x] Bloque 1: Cliente-servidor y qué significa "levantar" una app
- [x] Bloque 2: Monolito vs. microservicios
- [x] Bloque 3: Arquitectura concreta de InmoDomain (gateway, servicios, bases de datos aisladas)
- [x] Bloque 4: Comunicación síncrona (cadena de peticiones en `/madrid`)
- [x] Bloque 5: Comunicación asíncrona (eventos, Service Bus, alertas)
- [x] Bloque 6: Contenedores (Dockerfile, imagen, contenedor)
- [x] Bloque 7: La nube y el despliegue (réplicas, scale-to-zero, cold start)
- [x] Bloque 8: CI/CD (pipeline de GitHub Actions)
- [x] Aclaración: ecosistema .NET moderno (.NET 10, ASP.NET Core, EF Core) vs. legado (.NET Framework, ASP.NET clásico, EF6, .NET Standard)
- [x] Decisión confirmada: Neon no soporta SQL Server — se usa PostgreSQL
- [x] Creados los documentos maestros `InmoDomain_Contexto_y_Reglas.md` y `InmoDomain_Progreso.md`

### Fase 1 — Entorno y repositorio ✅ completada
- [x] Instalar/confirmar .NET 10 SDK — SDK 10.0.401 instalado y verificado (`dotnet --list-sdks`)
- [x] Confirmar Visual Studio Community instalado y configurado — Visual Studio Community 2026, workload "Desarrollo de ASP.NET y web", configuración de entorno "Desarrollo web"
- [x] Git confirmado instalado — versión 2.47.1.windows.1 (ya estaba presente)
- [x] Crear estructura de carpetas del monorepo — creada en `C:\Proyectos\InmoDomain` (backend/ con 6 servicios + Gateway, frontend/, docs/ con los dos documentos maestros, .github/workflows/, .gitignore y README.md vacíos). Nota: la carpeta se creó inicialmente como `src/` y se renombró a `backend/` para mayor claridad.
- [x] Escribir contenido de `.gitignore` — reglas para .NET, secretos/config local, frontend (Node/React) y sistema operativo. Regla de estilo confirmada: sin comentarios explicativos dirigidos al usuario dentro de archivos del repositorio (extiende la regla de gobernanza nº4 a todo el repo, no solo código C#).
- [x] Escribir contenido inicial de `README.md`
- [x] Primer commit en Git — repositorio inicializado, commit "Estructura inicial del monorepo", conectado y subido a `https://github.com/noemmang/InmoDomain.git` (rama `main`)

### Fase 2 — Diseño de datos y contratos de API ✅ completada
- [x] Definir qué datos exactos se obtienen de INE (tabla 6150) y MIVAU (CSV trimestral)
  - **INE, tabla 6150** — Estadística de Transmisión de Derechos de la Propiedad (ETDP), fuente: Registros de la Propiedad. Da **volumen de compraventas de vivienda**, mensual, por provincia (confirmado: el INE nunca desagrega esta estadística a nivel de municipio), con desglose completo por **régimen** (libre / protegida) × **estado** (nueva / segunda mano). No es un índice de precios.
  - **MIVAU** — Estadística de Valor Tasado de la Vivienda, fuente: sociedades de tasación (AEV). Da **precio medio €/m²**, trimestral, por provincia. Se importa **vivienda libre desglosada por antigüedad** (≤5 años / >5 años). Se descarta importar vivienda protegida (su precio lo fija la administración, no el mercado). Nota verificada: MIVAU también publica precio por municipios de >25.000 habitantes, pero de forma parcial (solo ~150 de los más de 8.000 municipios de España, y sin el componente de actividad del INE) — se evaluó y se descartó usarlo por la complejidad frente a la cobertura limitada.
  - Conclusión de diseño: INE aporta "cuánto se mueve" el mercado (actividad), MIVAU aporta "a cuánto" (precio). Ambas piezas alimentan a Market Data Service y de ahí a Analytics.
- [x] Diseñar tablas por base de datos lógica (una por servicio) — completado
  - **Decisiones de esquema generales**: nombres de tablas/columnas en español; campos de valores fijos (`regimen`, `estado_vivienda`, etc.) como `varchar` + restricción `CHECK`. Regla de integridad: **FK reales solo dentro del mismo servicio/base de datos**; entre servicios, se guarda el código de referencia sin FK. Convención de `periodo`: tipo `date`, primer día del mes (INE) o del trimestre (MIVAU) correspondiente. **Toda PK generada por el sistema es `Guid`/`uuid`**, salvo claves naturales externas ya únicas y estables (el código INE de provincia, ver Fase 3).
  - **`market_data_db`** — completado:
    - `compraventas_vivienda` (codigo_provincia, periodo, regimen, estado_vivienda, numero_operaciones) — datos del INE, único por (codigo_provincia, periodo, regimen, estado_vivienda)
    - `valores_tasados` (codigo_provincia, periodo, antiguedad_vivienda, precio_m2) — datos del MIVAU, único por (codigo_provincia, periodo, antiguedad_vivienda)
    - `datos_cache` (clave_cache, contenido jsonb, fecha_expiracion, fecha_creacion) — caché de llamadas a fuentes externas, uso interno de Market Data
  - **`property_db`** — completado (sin tabla de municipios — ver nota de INE/MIVAU arriba):
    - `provincias` (id uuid PK, codigo_ine string único —código oficial del INE, referencia entre servicios—, nombre, comunidad_autonoma, poblacion)
    - `favoritos` (id uuid PK, usuario_id uuid sin FK, codigo_provincia FK obligatoria → provincias.codigo_ine, fecha_creacion; único por usuario_id + codigo_provincia)
  - **`identity_db`** — completado:
    - `usuarios` (id uuid PK, nombre, email único, password_hash nullable, proveedor_auth CHECK 'local', fecha_registro, fecha_ultimo_acceso, token_recuperacion varchar nullable —hash del token—, token_recuperacion_expira timestamp nullable)
  - **`analytics_db`** — completado:
    - `property_scores` (id uuid PK, codigo_provincia sin FK, periodo date, indice_precio, indice_tendencia_precio, indice_actividad, property_score, fecha_calculo) — histórico trimestral, único por (codigo_provincia, periodo); los tres índices pesan por igual
  - **`alerts_db`** — completado:
    - `alertas` (id uuid PK, usuario_id uuid sin FK, codigo_provincia sin FK, metrica CHECK 'property_score'/'indice_precio'/'indice_tendencia_precio'/'indice_actividad'/'precio_m2', condicion CHECK 'mayor_que'/'menor_que', umbral numeric(8,2), activa boolean default true, fecha_creacion, fecha_ultimo_disparo nullable)
  - **`notifications_db`** — completado:
    - `notificaciones` (id uuid PK, usuario_id uuid sin FK, tipo CHECK 'bienvenida'/'alerta'/'precio_actualizado', titulo, mensaje, codigo_provincia nullable sin FK, leida boolean default false, oculta boolean default false —soft delete, no se muestra pero se conserva—, fecha_envio)
- [x] Definir eventos que viajarán por Service Bus — completado (detalle más abajo)
- [x] Definir endpoints por servicio — completado para los 6 servicios
  - [x] Identity — completado (7 endpoints, incluye recuperación de contraseña)
  - [x] Property — completado (5 endpoints, sin municipios)
  - [x] Market Data — completado (2 endpoints, solo lectura, ingress interno)
  - [x] Analytics — completado (2 endpoints públicos + 1 interno). Decisión relevante: el endpoint de ficha de provincia usa **JWT opcional** (excepción explícita al patrón protegido/público binario del resto del proyecto). El comparador es público sin JWT.
  - [x] Alerts — completado (CRUD completo, las 4 rutas protegidas). Al crear/editar, valida `codigo_provincia` con llamada síncrona a Property antes de guardar.
  - [x] Notifications — completado (4 endpoints protegidos). Sin creación/borrado real de cara al usuario; el `DELETE` es soft delete (`oculta = true`).
- [x] Decisiones generales de diseño de API (aplican a los servicios públicos vía Gateway):
  - **Validación de JWT**: cada servicio valida el token por su cuenta (zero trust), no solo el Gateway.
  - **Idioma**: rutas y campos JSON en **inglés**; base de datos en **español**.
  - **Versionado**: todas las rutas bajo `/api/v1/`.
  - Claims del JWT: `sub` (usuario_id, Guid), `email`, `iat`, `exp` — sin roles.

### Fase 3 — Primer microservicio (Property Service) ✅ completada
- [x] Decidida la arquitectura interna en capas: **Controller → Service → Repository**, con **DTOs** en el límite HTTP y **entidades** (`Models/`) reflejando las tablas. Interfaces (`IProvinceService`, `IProvinceRepository`, etc.) para inyección de dependencias. Sin clases base compartidas entre entidades.
- [x] Nomenclatura de entidades y DTOs: **inglés** (`Province`, `Favorite`, `ProvinceDto`, etc.), coherente con rutas y JSON.
- [x] Decidido dejar el Repository sin implementación real de acceso a datos hasta la Fase 4 (solo interfaces en Fase 3); Controllers, Services y DTOs sí quedan completos y funcionales en esta fase.
- [x] Estructura de carpetas creada en `backend/Property/` (`Controllers/`, `Services/`, `Repositories/`, `Models/`, `Dtos/`, `Data/`) con los ficheros `.cs` vacíos correspondientes.
- [x] Decisión de claves primarias: **Guid** para toda PK generada por el sistema. Caso especial resuelto — `provincias.Id` es Guid interno de Property; el **código INE** (`codigo_ine`) se mantiene como referencia real entre servicios (rutas, `favoritos`, `alertas`, `notificaciones`, Market Data), evitando traducciones innecesarias con las fuentes de datos externas.
- [x] Escritas las entidades — `Models/Province.cs` (Id Guid, CodeIne, Name, AutonomousCommunity, Population) y `Models/Favorite.cs` (Id Guid, UserId Guid, ProvinceCode, CreatedAt). Convención fijada: `namespace` de una sola línea (C# 10+), propiedades `string` con `= string.Empty` por defecto en vez de nullable.
- [x] Escritos los DTOs — `Dtos/ProvinceDto.cs` (sin Id, no se expone el Guid interno), `Dtos/FavoriteDto.cs` (con Id y ProvinceName enriquecido), `Dtos/CreateFavoriteDto.cs` (solo ProvinceCode, distinto del DTO de salida).
- [x] Escritas las interfaces de Repository (sin implementación todavía) — `IProvinceRepository` (GetAllAsync, GetByCodeIneAsync) e `IFavoriteRepository` (GetByUserIdAsync, GetByIdAsync, ExistsForUserAndProvinceAsync, AddAsync, DeleteAsync). Todo async/Task, tipos de retorno nullable donde el recurso puede no existir.
- [x] Diseñado el tipo `Result`/`Result<T>` en `Common/` (`ResultError.cs`, `Result.cs`) como mecanismo estándar del proyecto para que los Services comuniquen fallos de negocio esperados (NotFound, Conflict) sin usar excepciones. Constructores privados/protegidos con factory methods (`Success`/`Failure`) para impedir estados inválidos.
- [x] Escritos los Services — `ProvinceService` (listar, obtener por código INE, mapeo a DTO) y `FavoriteService` (listar enriquecido con nombre de provincia, crear con doble validación —provincia existe, no duplicado—, borrar con comprobación de propiedad). `FavoriteService` depende de ambos repositorios (Favorite y Province).
- [x] Escritos los Controllers — `ProvincesController` (GET all, GET by code) y `FavoritesController` (GET mine, POST, DELETE), traduciendo `Result`/`ResultError` a códigos HTTP (200, 201, 404, 409, 204). Pendiente de implementación real: `FavoritesController.GetUserId()` lanza `NotImplementedException` explícita, ya que la validación de JWT llega en la Fase 8 — no se usa ningún valor simulado.
- [x] `Program.cs`, `appsettings.json` y `Property.csproj` finales — completados en el Bloque 5 de la Fase 4 (ver detalle allí).
- [x] Implementación real de los Repositories con EF Core — completada en el Bloque 4 de la Fase 4 (ver detalle allí).

### Fase 4 — PostgreSQL + EF Core ✅ completada
Plan de la fase, por bloques: (1) paquetes NuGet y conexión a Neon, (2) `DbContext` y mapeo Fluent API, (3) migraciones, (4) implementación real de los Repositories, (5) cierre de la Fase 3 pendiente (`Program.cs`, `appsettings.json`, `Property.csproj` final).

- [x] **Bloque 1 — Paquetes NuGet y conexión a Neon**
  - [x] Decidido: cadena de conexión en desarrollo local vía **User Secrets** (frente a variable de entorno) — mejor integración con Visual Studio y aislamiento explícito del propósito.
  - [x] Decidido: `dotnet-ef` como **herramienta local** (`dotnet tool install --local`), versión fijada en `.config/dotnet-tools.json` en la raíz del repositorio.
  - [x] Creado `Property.csproj` mínimo (SDK `Microsoft.NET.Sdk.Web`, `net10.0`, `Nullable`/`ImplicitUsings` habilitados) — se completó con su contenido final en el Bloque 5.
  - [x] Instalados los paquetes `Npgsql.EntityFrameworkCore.PostgreSQL` y `Microsoft.EntityFrameworkCore.Design` en Property.
  - [x] Decidida la organización en Neon: un único proyecto Neon (`InmoDomain`) con una base de datos por servicio dentro (ver registro de cambios v8 en el documento de contexto). Corregido el dato de cuota gratuita: 100 CU-hours/proyecto/mes (no 50).
  - [x] Creado el proyecto Neon `InmoDomain` y la base de datos `property_db` dentro de él.
  - [x] Decidido el patrón de doble cadena de conexión: `ConnectionStrings:Property` (pooled, host con `-pooler`, uso de la app en tiempo de ejecución) y `ConnectionStrings:PropertyMigrations` (directa, sin `-pooler`, uso exclusivo de `dotnet ef`) — ambas guardadas en User Secrets de Property.
- [x] **Bloque 2 — `DbContext` de Property y mapeo Fluent API**
  - [x] Creado `Data/PropertyDbContext.cs`, con mapeo manual propiedad a propiedad (inglés → español) vía Fluent API — descartado `EFCore.NamingConventions` porque solo traduce *casing*, no vocabulario.
  - [x] Modelada la FK real `favoritos.codigo_provincia → provincias.codigo_ine` con `HasPrincipalKey` (la referencia no es a la PK `Id`, sino a la clave alternativa única `CodeIne|codigo_ine`), sin propiedad de navegación (el nombre de provincia se resuelve explícitamente en `FavoriteService`, no por navegación de EF). `OnDelete(DeleteBehavior.Restrict)` en esa FK.
- [x] **Bloque 3 — Migraciones de EF Core**
  - [x] Creada `Data/PropertyDbContextFactory.cs` (`IDesignTimeDbContextFactory<PropertyDbContext>`), necesaria porque `dotnet ef` no puede construir el `DbContext` a través de `Program.cs` mientras este siga en su versión mínima (Bloque 5 pendiente). Lee `ConnectionStrings:PropertyMigrations` desde User Secrets.
  - [x] Creado un `Program.cs` mínimo y temporal (solo `WebApplication.CreateBuilder(args).Build().Run()`), imprescindible para que el proyecto compile con el SDK `Microsoft.NET.Sdk.Web` — sin él, `dotnet build` falla por falta de un punto de entrada. Se completó con su contenido real en el Bloque 5.
  - [x] **Lección aprendida, aplicable a todos los servicios**: Neon entrega las cadenas de conexión en formato URI (`postgresql://usuario:contraseña@host/bd?parámetros`), pero Npgsql (el driver de .NET) solo acepta el formato ADO.NET clásico `clave=valor;clave=valor`. Hay que convertir manualmente cada cadena antes de guardarla en User Secrets. Plantilla: `Host=...;Port=5432;Database=...;Username=...;Password=...;Ssl Mode=Require;Channel Binding=Require` (este último parámetro cuando la URI de origen incluye `channel_binding=require`).
  - [x] Generada y aplicada la migración `InitialCreate` contra `property_db` en Neon — confirmadas las tablas `provincias`, `favoritos` y `__efmigrationshistory`.
  - [x] **Higiene de seguridad resuelta**: regenerada la contraseña del rol `neondb_owner` desde el panel de Neon (tras quedar expuesta en el chat de trabajo durante la depuración de este bloque) y actualizadas `ConnectionStrings:Property` y `ConnectionStrings:PropertyMigrations` en User Secrets con el valor nuevo.
- [x] **Bloque 4 — Implementación real de los Repositories**
  - [x] Escrito `Repositories/ProvinceRepository.cs` — implementa `IProvinceRepository` contra `PropertyDbContext`, lecturas puras con `AsNoTracking()`.
  - [x] Escrito `Repositories/FavoriteRepository.cs` — implementa `IFavoriteRepository` contra `PropertyDbContext`. `GetByUserIdAsync` con `AsNoTracking()` (solo lectura); `GetByIdAsync` sin `AsNoTracking()` a propósito, ya que su resultado se reutiliza para comprobar propiedad y borrar en la misma operación desde `FavoriteService`.
- [x] **Bloque 5 — Cierre de la Fase 3: `Program.cs`, `appsettings.json` y `Property.csproj` final**
  - [x] Decidido añadir Swagger/OpenAPI (`Swashbuckle.AspNetCore`), activo solo en `Development` (`app.Environment.IsDevelopment()`), para poder probar cada microservicio sin Postman mientras el Gateway y el frontend no existen todavía.
  - [x] Decidido no añadir todavía `AddAuthorization()`/`UseAuthorization()` — la validación de JWT es Fase 8; añadir el middleware sin ningún esquema de autenticación detrás sería una pieza a medio hacer que se sustituiría entera más adelante.
  - [x] Escrito `Program.cs` final — registra `PropertyDbContext` contra `ConnectionStrings:Property`, registra en DI `IProvinceRepository`/`ProvinceRepository`, `IFavoriteRepository`/`FavoriteRepository`, `IProvinceService`/`ProvinceService`, `IFavoriteService`/`FavoriteService`, añade Swagger solo en Development, `MapControllers()`.
  - [x] Escrito `appsettings.json` final — solo logging y `AllowedHosts`, sin ninguna cadena de conexión ni secreto (viven en User Secrets).
  - [x] Escrito `Property.csproj` final — añadido `Swashbuckle.AspNetCore` (versión 10.2.3, verificada en NuGet) a los paquetes ya existentes.

### Fase 5 — Market Data Service 🔶 en curso
- [x] **Bloque 1 — Integración real con INE y MIVAU** (en curso)
  - [x] **INE verificado** — Servicio API JSON (Tempus3), público, **sin autenticación ni API key**. Endpoint base `https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/{idTabla}`. Confirmado que la tabla **6150** es *"Compraventa de viviendas según régimen y estado"*, desglosada por provincia — coincide con el diseño ya cerrado. Filtrado vía parámetro `tv=idVariable:idValor` (requiere resolver antes los IDs numéricos de provincia/régimen/estado contra los metadatos de la tabla). `nult=N` permite pedir solo los últimos N periodos, útil para no releer la serie completa en cada ejecución del job.
  - [x] **MIVAU verificado — discrepancia real con lo asumido en la Fase 2**: no es un CSV. El punto de descarga real es un fichero **`.XLS`** (formato Excel binario antiguo, BIFF), uno por serie, con **URL numérica estable** (no cambia cada trimestre): `.../BoletinOnline2/sedal/35101500.XLS` (vivienda libre ≤5 años) y `.../35102000.XLS` (vivienda libre >5 años). Hosting bajo la infraestructura web heredada de `transportes.gob.es`/`apps.fomento.gob.es`, aunque el dato sigue siendo del Ministerio de Vivienda y Agenda Urbana.
  - [x] **Ficheros `.XLS` descargados y analizados con Python (`xlrd`)** para confirmar su estructura real antes de diseñar el parser:
    - 4 hojas por fichero, una por bloque de años (`2010-2014`, `2015-2019`, `2020-2023`, `2024-2026`) — hay que leer las 4 para la serie completa.
    - Cada hoja es una **matriz ancha de publicación**, no una tabla "tidy": filas = territorios anidados (Nacional → CCAA → provincias), columnas = trimestres agrupados por año (bloques de 4), más columnas finales de variación (%) que no interesan.
    - **No hay código INE** en el fichero, solo el nombre de la provincia en texto libre con formatos variables (`'Balears (Illes)'`, `'Coruña (A)'`, `'Rioja (La)'`, `'Araba/Alava'` sin tilde) y espacios de relleno.
    - Fila agregada `'Ceuta y Melilla'` **además** de las filas individuales `'Ceuta'` y `'Melilla'` — hay que usar solo las individuales para no duplicar el dato.
    - Huecos de dato representados con el literal `'n.r'` (no representativo), no con celda vacía.
    - Unidad confirmada: `euros / m2`, trimestral, desglose provincial — esto sí coincide con el diseño de la Fase 2.
  - [x] **Decisiones de diseño derivadas de la verificación**:
    - Parsing a medida en el servicio (no un parser CSV genérico ni una librería de "auto-mapeo").
    - Mapeo nombre de provincia → código INE mediante **diccionario estático en el código** (solo 52 provincias, formato estable), no normalización de texto por heurística.
    - `'n.r'` se trata como ausencia de dato para esa provincia+periodo: no se inserta fila, no se lanza excepción.
    - Se **relee el fichero completo y se hace upsert en cada ejecución** del job (volumen total ≈6.700 filas, trivial), en vez de intentar traer solo el trimestre nuevo — no hay mecanismo del origen para pedir "solo lo último" como sí ofrece `nult` en el INE.
  - [x] **Librería .NET para leer el `.xls` decidida: `ExcelDataReader`** (MIT, solo lectura, streaming fila a fila, ligera) frente a `NPOI` (Apache 2.0, lectura y escritura, más pesada por cubrir todo el modelo de objetos de Excel) — el servicio solo necesita leer, nunca escribir el fichero de origen. Nota de implementación pendiente para cuando se escriba el código: `ExcelDataReader` requiere registrar `System.Text.Encoding.RegisterProvider(CodePagesEncodingProvider.Instance)` una vez al arrancar, ya que los `.xls` antiguos usan páginas de código no registradas por defecto en .NET Core.
  - [ ] Resolver los IDs numéricos de variable/valor del INE necesarios para filtrar la tabla 6150 por provincia, régimen y estado.
  - [ ] Diseñar el diccionario estático de mapeo nombre MIVAU → código INE (las 52 entradas).
- [ ] **Bloque 2** — Arquitectura interna de Market Data: dónde vive el parser de cada fuente, `DbContext` de `market_data_db`, servicio(s) de importación, y cómo encaja todo con `market-data-import-job` (Azure Container Apps Jobs, diario).
- [ ] Resto de bloques de la fase — pendientes de planificar en detalle al llegar a ellos.

## Decisiones pendientes / abiertas

- Dominio final del proyecto — **resuelto**: el usuario ya dispone de un dominio propio, no es un coste pendiente del proyecto.

## Eventos de Service Bus (registro acumulado)

Todos comparten un "sobre": `id_evento` (uuid), `tipo_evento`, `fecha_ocurrencia`.

- **`UsuarioRegistrado`** — Identity → Notifications (tipo `bienvenida`). Payload: `usuario_id`, `nombre`, `email`, `fecha_registro`.
- **`AlertaDisparada`** — `alert-evaluation-job` → Notifications (resuelve nombre de provincia con llamada síncrona a Property; tipo `alerta`). Payload: `alerta_id`, `usuario_id`, `codigo_provincia`, `metrica`, `condicion`, `umbral`, `valor_actual`, `fecha_disparo`.
- **`ComprasVentasImportadas`** — `market-data-import-job` (INE, mensual) → Analytics, recalcula `indice_actividad`. Payload: `periodo`, `codigos_provincia` (array).
- **`PreciosImportados`** — `market-data-import-job` (MIVAU, trimestral) → Analytics (recalcula `indice_precio`/`indice_tendencia_precio`) y Notifications (avisa a favoritos, tipo `precio_actualizado`). Payload: `periodo`, `codigos_provincia` (array).
- **`RecuperacionContrasenaSolicitada`** — Identity → Notifications, solo dispara email, no crea fila en `notificaciones`. Payload: `nombre`, `email`, `token`, `fecha_solicitud`.

## Endpoints por servicio (registro acumulado)

Todas las rutas bajo `/api/v1/`. "Protegido" = requiere JWT válido, verificado por el propio servicio.

**Identity**
- `POST /api/v1/auth/register` — público. Crea usuario, publica `UsuarioRegistrado`, devuelve JWT.
- `POST /api/v1/auth/login` — público. Devuelve JWT, actualiza `fecha_ultimo_acceso`.
- `POST /api/v1/auth/forgot-password` — público. Misma respuesta exista o no el email. Publica `RecuperacionContrasenaSolicitada`.
- `POST /api/v1/auth/reset-password` — público. Verifica token contra hash + expiración.
- `GET /api/v1/users/me` — protegido.
- `PUT /api/v1/users/me` — protegido. Solo `nombre`.
- `PUT /api/v1/users/me/password` — protegido. Exige `password_actual` correcta.

**Property**
- `GET /api/v1/provinces` — público.
- `GET /api/v1/provinces/{codigoProvincia}` — público. `codigoProvincia` es el código INE (string), no el Guid interno.
- `GET /api/v1/favorites` — protegido. Enriquecido con nombre de provincia.
- `POST /api/v1/favorites` — protegido. Body: `codigo_provincia` (código INE).
- `DELETE /api/v1/favorites/{id}` — protegido. `id` es el Guid del favorito. Comprueba propiedad.

**Market Data** — nunca a través del Gateway; ingress interno de Container Apps (gratuito — distinto del Private Endpoint, que sí es de pago y no se usa en el proyecto) + API key compartida entre servicios como autenticación. Solo lectura: `market-data-import-job` escribe directamente en `market_data_db` con su propio `DbContext`, sin pasar por esta API.
- `GET /api/v1/property-sales?provinceCode={cod}&from={periodo}&to={periodo}` — datos de `compraventas_vivienda`. `provinceCode` es el código INE.
- `GET /api/v1/appraised-values?provinceCode={cod}&from={periodo}&to={periodo}` — datos de `valores_tasados`. `provinceCode` es el código INE.

**Analytics**
- `GET /api/v1/provinces/{codigoProvincia}/analytics?from={periodo}&to={periodo}` — JWT opcional. `codigoProvincia` es el código INE. Sin token: histórico de `property_scores` + datos crudos de `compraventas_vivienda`/`valores_tasados` combinados desde Market Data (síncrono). Con token válido: añade campos personalizados (p. ej. `esFavorita`).
- `GET /api/v1/analytics/compare?provinceCodes={cod1,cod2,...}&period={periodo}` — público, sin JWT. Solo índices/score de `analytics_db`, sin llamada a Market Data.
- `GET /internal/v1/metric-value?provinceCode={cod}&metric={metrica}` — interno, ingress interno + API key compartida, nunca por el Gateway. Usado por `alert-evaluation-job`. Si `metrica` es una de las cuatro propias de Analytics, resuelve contra `analytics_db`; si es `precio_m2`, reenvía la consulta a Market Data.

**Alerts**
- `GET /api/v1/alerts` — protegido. Lista las alertas del usuario autenticado.
- `POST /api/v1/alerts` — protegido. Body: `codigo_provincia` (código INE), `metrica`, `condicion`, `umbral`. Valida `codigo_provincia` contra `GET /api/v1/provinces/{codigoProvincia}` en Property antes de crear. `usuario_id` del JWT, `activa` nace en `true`.
- `PUT /api/v1/alerts/{id}` — protegido. `id` es el Guid de la alerta. Body completo: `codigo_provincia`, `metrica`, `condicion`, `umbral`, `activa`. Misma validación contra Property si cambia `codigo_provincia`. Comprueba propiedad → 404 si la alerta no es del usuario.
- `DELETE /api/v1/alerts/{id}` — protegido. Comprueba propiedad → 404 si no es del usuario.

**Notifications**
- `GET /api/v1/notifications` — protegido. Todas las notificaciones no ocultas del usuario, ordenadas por `fecha_envio` descendente. Sin filtros de servidor; el frontend filtra leídas/no leídas.
- `PUT /api/v1/notifications/{id}/read` — protegido. `id` es el Guid de la notificación. Marca una notificación como leída. Comprueba propiedad → 404 si no es del usuario.
- `PUT /api/v1/notifications/read?tipo={tipo}&codigoProvincia={cod}` — protegido. Marca como leídas las notificaciones que cumplan los filtros dados (ambos opcionales; sin ninguno, marca todas las del usuario).
- `DELETE /api/v1/notifications/{id}` — protegido. Soft delete: pone `oculta = true`, no borra la fila. Comprueba propiedad → 404 si no es del usuario.

## Cómo actualizar este archivo

1. Al terminar un paso, marca su casilla `[x]` y, si hace falta, añade una línea con el resultado concreto.
2. Si se empieza una fase nueva, añade su sección siguiendo el mismo formato que las anteriores.
3. Si una decisión ya tomada cambia, **edita la línea original** y deja una nota breve del cambio si es relevante para el histórico.
4. Actualiza siempre el bloque "Estado actual" al final de cada sesión.