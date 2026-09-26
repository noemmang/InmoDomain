# InmoDomain — Progreso

> Este documento registra el avance real del proyecto, paso a paso. Cuando se completa algo, se añade una entrada nueva. Cuando se modifica una decisión ya tomada, se **actualiza la entrada correspondiente** en vez de duplicarla. Úsalo junto con `InmoDomain_Contexto_y_Reglas.md` para retomar la conversación en cualquier ventana nueva.

## Estado actual

**Fase en curso:** Fase 7 — Analytics Service — sin empezar todavía.
**Última fase completada:** Fase 6 — Resiliencia ✅ — retry + timeout (sin circuit breaker) añadidos sobre los dos `HttpClient` de `MarketData.ImportJob` (INE y MIVAU) con `Microsoft.Extensions.Http.Resilience` 10.10.0. Parámetros: 3 reintentos, backoff exponencial con jitter desde 2 s, timeout de 10 s por intento — fijados tras medir en local los tiempos reales de las tres llamadas (INE ≈0,10 s; cada `.XLS` de MIVAU ≈0,3 s), dejando un margen amplio (~30×) para el peor caso en producción. `dotnet build` verificado por el usuario, correcto y sin warnings de versión de paquetes. Pendiente (aceptado como no bloqueante): no se hizo la prueba de forzar un timeout artificial para observar los reintentos reales en el log; queda como posible mejora futura si hiciera falta depurar un fallo real de INE/MIVAU. Con esto se cierra la Fase 6 completa.

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
  - **INE, tabla 6150** — Estadística de Transmisión de Derechos de la Propiedad (ETDP), fuente: Registros de la Propiedad. Da **volumen de compraventas de vivienda**, mensual, por provincia (confirmado: el INE nunca desagrega esta estadística a nivel de municipio). No es un índice de precios. **Corrección tras verificar contra respuestas JSON reales de la API (Fase 5, Bloque 3):** la tabla **no publica el cruce régimen×estado como serie propia** — solo ofrece el desglose por **estado** (nueva / segunda mano) y por **régimen** (libre / protegida) como dimensiones independientes, no combinables en una sola llamada. Decisión: se importa únicamente el desglose por **estado** (nueva / segunda mano), aceptando que cada uno de esos dos valores mezcla régimen libre y protegido (la protegida es una fracción minoritaria del total) — se prioriza poder distinguir nueva/segunda mano sobre la exclusión exacta de la protegida. La dimensión `regimen` queda descartada del esquema.
  - **MIVAU** — Estadística de Valor Tasado de la Vivienda, fuente: sociedades de tasación (AEV). Da **precio medio €/m²**, trimestral, por provincia. Se importa **vivienda libre desglosada por antigüedad** (≤5 años / >5 años). Se descarta importar vivienda protegida (su precio lo fija la administración, no el mercado). Nota verificada: MIVAU también publica precio por municipios de >25.000 habitantes, pero de forma parcial (solo ~150 de los más de 8.000 municipios de España, y sin el componente de actividad del INE) — se evaluó y se descartó usarlo por la complejidad frente a la cobertura limitada.
  - Conclusión de diseño: INE aporta "cuánto se mueve" el mercado (actividad), MIVAU aporta "a cuánto" (precio). Ambas piezas alimentan a Market Data Service y de ahí a Analytics.
- [x] Diseñar tablas por base de datos lógica (una por servicio) — completado
  - **Decisiones de esquema generales**: nombres de tablas/columnas en español; campos de valores fijos (`regimen`, `estado_vivienda`, etc.) como `varchar` + restricción `CHECK`. Regla de integridad: **FK reales solo dentro del mismo servicio/base de datos**; entre servicios, se guarda el código de referencia sin FK. Convención de `periodo`: tipo `date`, primer día del mes (INE) o del trimestre (MIVAU) correspondiente. **Toda PK generada por el sistema es `Guid`/`uuid`**, salvo claves naturales externas ya únicas y estables (el código INE de provincia, ver Fase 3).
  - **`market_data_db`** — completado:
    - `compraventas_vivienda` (codigo_provincia, periodo, estado_vivienda, numero_operaciones) — datos del INE, único por (codigo_provincia, periodo, estado_vivienda). **Corregido en Fase 5/Bloque 3**: se elimina la columna `regimen` — el INE no publica el cruce régimen×estado (ver nota de Fase 2 arriba); `estado_vivienda` (nueva/segunda mano) incluye régimen libre y protegido mezclados.
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
- [x] **Bloque 1 — Integración real con INE y MIVAU** ✅ completado
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
  - [x] **Resueltos los IDs numéricos de variable/valor del INE** necesarios para filtrar la tabla 6150 por provincia y estado — implementados en `backend/MarketData/Integrations/Ine/IneMetadataCatalog.cs` (variable provincia = 115, con las 52 provincias; variable estado = 345, con nueva/segunda mano — id de "nueva" = 16464, id de "segunda mano" = 16465, ambos confirmados contra datos reales al ejecutar el `ImportJob` en el Bloque 3), junto con el enum `DwellingStatus` en el mismo namespace. **Corregido en Fase 5/Bloque 3**: la variable régimen (503, libre/protegida) y el enum `HousingRegime` se retiran del uso — se mantienen documentados aquí por si se retoma el filtro en el futuro, pero el `ImportJob` no los consume (ver nota de Fase 2 sobre la tabla 6150).
    - **Nota de namespace**: estos ficheros, junto con `Integrations/Mivau/MivauProvinceNames.cs`, se han movido físicamente dentro de `MarketData.ImportJob/Integrations/` (único proyecto que los usa; antes vivían sueltos en `backend/MarketData/Integrations/`, fuera del árbol de cualquier `.csproj`, y no compilaban en ningún sitio). Namespace actualizado a `MarketData.ImportJob.Integrations.Ine` / `MarketData.ImportJob.Integrations.Mivau`, siguiendo la convención namespace = proyecto + ruta de carpetas ya usada en el resto del repo.
  - [x] **Diseñado el diccionario estático de mapeo nombre MIVAU → código INE** (las 52 entradas) — implementado en `backend/MarketData/Integrations/Mivau/MivauProvinceNames.cs`.

- [x] **Bloque 2 — Arquitectura interna de Market Data (capa de lectura)** ✅ completado
  - [x] Creados los tres proyectos del servicio: `MarketData.Data` (biblioteca con el `DbContext`, las entidades y el `DbContextFactory` de diseño), `MarketData.Api` (API de solo lectura) y `MarketData.ImportJob` (consola, con referencia de proyecto a `MarketData.Data`, sin contenido real todavía — ver Bloque 3).
  - [x] Escrito `MarketDataDbContext` con mapeo Fluent API completo de las 3 tablas (`compraventas_vivienda`, `valores_tasados`, `datos_cache`), incluidas las restricciones `CHECK` y los índices únicos ya definidos en la Fase 2. Entidades correspondientes en `MarketData.Data/Models/` (`HousingSale`, `AppraisedValue`, `CacheEntry`).
    - [x] **Corregido**: la entidad `HousingSale` y el mapeo Fluent API de `compraventas_vivienda` en `MarketDataDbContext` ya no incluyen la columna `regimen`; el índice único quedó en `(codigo_provincia, periodo, estado_vivienda)`, confirmado por `Select-String` sin resultados sobre la migración generada.
  - [x] Escrita la API de solo lectura siguiendo el mismo patrón en capas que Property (Controller → Service → Repository, DTOs en el límite HTTP): `PropertySalesController`/`AppraisedValuesController`, sus Services (`IHousingSaleService`/`IAppraisedValueService`) y Repositories (`IHousingSaleRepository`/`IAppraisedValueRepository`), y `ApiKeyMiddleware` (cabecera `X-Internal-Api-Key`, clave esperada en `Security:InternalApiKey`) para el ingress interno + API key ya decidido en la Fase 2. `Program.cs` de `MarketData.Api` ya registra todo en DI y añade Swagger solo en Development, igual que Property.
  - [x] **Migración de EF Core de `market_data_db`** — completada:
    - [x] Base de datos `market_data_db` creada en Neon, dentro del proyecto `InmoDomain` ya existente.
    - [x] Confirmado por revisión directa: `dotnet-tools.json` ya estaba en `.config/dotnet-tools.json`, no suelto en la raíz como constaba erróneamente en la v11 — no hizo falta corrección.
    - [x] Guardadas en User Secrets las cadenas de conexión: pooled en `MarketData.Api` y en `MarketData.ImportJob` (clave `ConnectionStrings:MarketData` en cada uno, `UserSecretsId` independiente por proyecto) y directa en `MarketData.Data` (clave `ConnectionStrings:MarketDataMigrations`, la que usa `MarketDataDbContextFactory`).
    - [x] Generada la migración `InitialCreate` (`--project MarketData.Data --startup-project MarketData.Api`) y verificado por `Select-String` que no menciona `regimen`.
    - [x] **Incidencia al aplicarla y resuelta**: `dotnet ef database update` falló con `42P07: relation "compraventas_vivienda" already exists`. Se comprobó en Neon que las tres tablas ya existían de un intento manual anterior, con `compraventas_vivienda` todavía en su forma antigua (con columna `regimen`) y vacías. Se borraron las tres tablas y `"__EFMigrationsHistory"` con `DROP TABLE ... CASCADE` y se reaplicó la migración, esta vez con éxito. Esquema final verificado en Neon: 5 columnas en `compraventas_vivienda` (sin `regimen`) e historial de migraciones con `20260924163952_InitialCreate`.
    - [x] **Corrección de compilación encontrada y resuelta en `MarketData.ImportJob`** (no formaba parte del diseño original, pero bloqueaba llegar a este bloque): `Program.cs` usaba `IConfiguration.GetConnectionString(...)` sin el `using Microsoft.Extensions.Configuration;` correspondiente — error `CS1501`. A diferencia de `MarketData.Api`, `MarketData.ImportJob` usa el SDK `Microsoft.NET.Sdk` (no `.Sdk.Web`), que no añade ese `using` implícito. Además, se detectó y corrigió un conflicto de versiones (`MSB3277`) entre `Microsoft.EntityFrameworkCore.Relational` 10.0.4 (arrastrado por `Npgsql.EntityFrameworkCore.PostgreSQL`) y 10.0.12 (el resto de paquetes del proyecto), resuelto con una referencia explícita a la versión 10.0.12 en `MarketData.Data.csproj`.

- [x] **Bloque 3 — Arquitectura de `MarketData.ImportJob`** ✅ diseño cerrado e implementación verificada con datos reales
  - [x] **Estructura de carpetas**: `Integrations/Ine/` (cliente INE + catálogo + DTOs) e `Integrations/Mivau/` (parser MIVAU) dentro del propio proyecto `MarketData.ImportJob`, más `Import/` con los dos runners (`HousingSaleImportRunner`, `AppraisedValueImportRunner`) y `Program.cs` como orquestador (Generic Host, DI, ejecución secuencial de ambos runners con logging por runner).
  - [x] **Cliente INE (`IIneApiClient`/`IneApiClient`)** — verificado contra respuestas reales de `DATOS_TABLA/6150?tip=AM`:
    - DTOs de deserialización fijados: `IneSeriesResponse` (COD, Nombre, MetaData[], Data[]), `IneSeriesMetadata` (Id, T3_Variable, Nombre, Codigo), `IneDataPoint` (Fecha como ISO-8601 con offset —no epoch ms—, T3_TipoDato, T3_Periodo, Anyo, Valor).
    - **Decisión final tras verificar con JSON real** (ver corrección de Fase 2 arriba): se importa el desglose por **estado** únicamente — dos llamadas por ejecución, una por valor de `estado_vivienda` (`tv=345:{idEstado}&nult=N&tip=AM`, sin filtrar provincia ni régimen), cada una trayendo las ~52 provincias en una sola respuesta.
    - **Filtrado obligatorio de nivel geográfico**: la respuesta mezcla series a nivel Nacional, Comunidad Autónoma y Provincia (con solapamiento real detectado en el JSON: las 6 comunidades uniprovinciales —Madrid, Asturias, Cantabria, Murcia, Navarra, La Rioja— aparecen duplicadas, una vez como CCAA y otra como provincia, con el mismo valor). El parser descarta toda serie cuya `MetaData` no incluya una entrada con `Id` de variable = 115 (Provincias), quedándose solo con esas.
  - [x] **Parser MIVAU (`IMivauFileParser`/`MivauFileParser`)** — diseño sin cambios respecto a lo ya verificado en Bloque 1: `ExcelDataReader`, descarga de los 2 `.xls` vía `HttpClient`, recorrido de las 4 hojas de cada uno, `Trim()` + descarte de la fila agregada `'Ceuta y Melilla'`, resolución de nombre contra `MivauProvinceNames`, `'n.r'` tratado como ausencia de fila.
    - [x] **Bug real encontrado y corregido al ejecutar contra los `.XLS` reales**: la primera ejecución completa del job devolvió `0 filas leidas` de ambos ficheros MIVAU, sin lanzar error. Causa: el patrón de detección de la fila de cabecera de trimestres solo aceptaba `1T`/`T1`/`1er T`, pero el rótulo real en el fichero es `1º`, `2º`, `3º `, `4º ` (símbolo de ordinal, sin la letra T) — nunca antes contrastado contra un fichero real, tal como advertía la nota original del código. Al no reconocer la cabecera, el parser trataba todas las filas como datos y no encontraba ningún territorio válido, devolviendo 0 filas en silencio. **Corregido**: patrón de trimestre ampliado para aceptar `1º`/`2º`/`3º `/`4º ` además de las variantes anteriores; el año de cada bloque (`Año 2010`, celda combinada que solo aparece en la primera de las 4 columnas del bloque) se arrastra explícitamente a las 3 columnas siguientes en vez de asumir que está en la fila justo anterior a los rótulos; las columnas finales de variación (`Trimestral`/`Anual`) de la última hoja se excluyen porque su rótulo no casa con el patrón de trimestre. Añadido también: redondeo a 2 decimales del valor leído (el `.XLS` trae artefactos de `double` como `1894.3999999999999`), necesario para que el upsert sea idempotente contra la columna `decimal(10,2)`; y un fallo explícito (`InvalidOperationException`) si ninguna hoja del fichero tiene cabecera reconocible, en vez de devolver 0 filas sin avisar — coherente con la regla de gobernanza nº2 (los errores se resuelven en su causa raíz, nunca se esconden).
  - [x] **Upsert contra `market_data_db`** — Opción A confirmada (EF Core, sin SQL crudo): precargar en un `Dictionary` por clave compuesta las filas existentes afectadas (rango de periodos de `nult` para INE; toda la tabla para MIVAU, ya que se relee el fichero completo), `Add`/marcar `Modified` según exista o no la clave, un único `SaveChangesAsync()` por runner al final. Se descartó `INSERT ... ON CONFLICT` nativo de Postgres por complejidad injustificada dado el volumen (trivial en ambos casos).
  - [x] **Primera ejecución real verificada contra `market_data_db`** (tras corregir el parser):
    - INE: `312 filas nuevas, 0 actualizadas, 0 sin cambios` en la primera ejecución (52 provincias × 3 meses × 2 estados) — confirma además que el id de "segunda mano" (16465), que quedaba sin confirmar desde el Bloque 1, es correcto: ambos valores de `estado_vivienda` aparecen en los datos reales.
    - MIVAU: `6506 filas nuevas` en la primera ejecución (3.077 de `<=5` años + 3.429 de `>5` años). Cifra algo por debajo del máximo teórico (6.864 = 52 provincias × 66 trimestres × 2 antigüedades) — verificado con consultas SQL que la diferencia es real, no un fallo de lectura: las 52 provincias están presentes en ambos grupos, y la cobertura menor se concentra en las provincias de mercado más pequeño (Soria, Zamora, Ceuta, Cuenca, Teruel, Ávila, etc.), coherente con el literal `'n.r'` de MIVAU en los años más antiguos de la serie por falta de tasaciones suficientes. Comprobado el caso extremo (Soria, antigüedad `<=5`: solo 9 de 66 trimestres con dato) contra el propio fichero.
    - **Idempotencia verificada** con una segunda ejecución del job: MIVAU dio `0 filas nuevas, 0 actualizadas, 6506 sin cambios`, confirmando que el redondeo a 2 decimales del parser coincide exactamente con lo ya guardado.
    - **Comportamiento observado y esperado, no un fallo**: en la segunda ejecución, el INE ya había publicado el periodo 2026-07 entre sesiones, y el job importó automáticamente ese mes nuevo (`104 filas nuevas`, 52 provincias × 2 estados) sin tocar los 3 periodos ya existentes — demuestra que la ventana `nult` del cliente INE funciona correctamente ante datos nuevos aparecidos entre ejecuciones.
  - [ ] **Pendiente, detectado durante las pruebas**: `MarketData.ImportJob` no tiene `Properties/launchSettings.json`, así que `dotnet run` arranca en entorno `Production` por defecto y no carga los User Secrets — hay que fijar `$env:DOTNET_ENVIRONMENT = "Development"` a mano en cada sesión de terminal nueva antes de ejecutar el job. Queda pendiente crear ese fichero (igual que ya tiene `MarketData.Api`) para no depender de la variable de entorno manual.
- [x] **Bloque 4 — Prueba de `MarketData.Api` contra los datos reales** ✅ completado y verificado:
  - [x] `GET /api/v1/property-sales?provinceCode=28` con cabecera `X-Internal-Api-Key` correcta — `200 OK`, devuelve filas reales de `compraventas_vivienda` para Madrid (periodos 2026-04 a 2026-07, desglosadas por `estado_vivienda`: `segunda_mano`/`nueva`).
  - [x] `GET /api/v1/appraised-values?provinceCode=28` con cabecera `X-Internal-Api-Key` correcta — `200 OK`, devuelve la serie completa real de `valores_tasados` para Madrid (trimestral, 2010-01 a 2026-04, desglosada por `age`: `<=5`/`>5`).
  - [x] `GET /api/v1/property-sales?provinceCode=28` **sin** la cabecera `X-Internal-Api-Key` — `401 No autorizado`, confirmando que `ApiKeyMiddleware` bloquea correctamente las peticiones no autenticadas.
  - Con esto queda cerrada la **Fase 5 — Market Data Service** en su totalidad.

### Fase 6 — Resiliencia ✅ completada
- [x] Bloque 1 — Alcance: retry + timeout, **sin** circuit breaker. Motivo: `MarketData.ImportJob` es un job de una sola ejecución (arranca, llama, termina); no hay una "conversación larga" con INE/MIVAU dentro de la que un circuito abierto beneficie a llamadas posteriores, y el circuito se resetearía igualmente en la siguiente ejecución del job.
- [x] Bloque 2 — Medición real de referencia (PowerShell, `Measure-Command` contra los endpoints reales desde la máquina del usuario): INE (`nult=3`) ≈0,10 s; `.XLS` MIVAU 35101500 ≈0,32 s; `.XLS` MIVAU 35102000 ≈0,27 s. Se usó como cota de "mejor caso", no como base directa de cálculo del timeout.
- [x] Bloque 3 — Parámetros fijados: 3 reintentos, backoff exponencial con jitter (inicio 2 s), timeout de 10 s por intento, iguales para INE y MIVAU (la diferencia de coste entre reintentar un JSON pequeño y volver a descargar un `.XLS` de pocos MB se consideró irrelevante en este caso).
- [x] Bloque 4 — Implementación en `MarketData.ImportJob`:
  - `MarketData.ImportJob.csproj`: añadido `Microsoft.Extensions.Http.Resilience` versión `10.10.0` (verificado que su dependencia de `Microsoft.Extensions.Http` en `net10.0` es `>= 10.0.12`, igual que la ya fijada en el proyecto — sin conflicto de versiones).
  - `Program.cs`: función local `AddRetryAndTimeout` (reutilizada entre los dos clientes) que registra `AddRetry` (`HttpRetryStrategyOptions`, predicado de reintentos por defecto — cubre timeout/error de red/5xx/408, no cubre 404 ni errores de formato) y `AddTimeout` (`HttpTimeoutStrategyOptions`), enganchados vía `.AddResilienceHandler(...)` a `IIneApiClient` y a `AppraisedValueImportRunner`.
- [x] Bloque 5 — Verificación: `dotnet build` desde `backend/MarketData/MarketData.ImportJob` (compila también `MarketData.Data` por `ProjectReference`) — correcto, sin errores ni warnings de versión de paquetes.
  - Nota de incidencia menor durante la verificación, no relacionada con el código: al pegar el `.csproj` entregado, el archivo local quedó con el BOM UTF-8 duplicado al principio (`MSB4025: Data at the root level is invalid`); se resolvió dejando un único BOM con un script corto en PowerShell.

### Fase 7 — Analytics Service
- [ ] Pendiente de empezar.

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