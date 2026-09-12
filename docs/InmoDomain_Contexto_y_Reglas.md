# InmoDomain — Contexto y reglas de trabajo

> Este documento resume cómo trabajamos en el proyecto **InmoDomain**, qué decisiones de arquitectura y diseño se han tomado, y qué reglas rigen tanto la forma de explicar las cosas como la forma de escribir código cuando llegue el momento. Está pensado para pegarse al principio de **cualquier conversación nueva** y que la explicación pueda continuar exactamente donde se quedó.

## 1. Objetivo del proyecto

InmoDomain es una plataforma de análisis del mercado inmobiliario español, construida como proyecto de portafolio. Consume datos oficiales del INE (API JSON, tabla 6150) y del MIVAU (CSV trimestral), y permite explorar el mercado por provincia, comparar provincias, generar un "Property Score" propio, guardar favoritos y crear alertas.

El objetivo de aprendizaje no es principalmente escribir código a mano: es entender **arquitectura, conceptos y flujos de sistemas** con la profundidad suficiente para poder explicarlos y dirigir con criterio a una IA/agente que sí escriba el código.

## 2. Reglas de comunicación (cómo se explica)

- Se avanza **poco a poco, por bloques**, nunca volcando todo el diseño de golpe. Se evita en la medida de lo posible volver sobre un mismo punto ya cerrado, salvo que lo exija el orden de los requisitos o el propio usuario lo pida.
- Prioridad: **conceptos, vocabulario técnico y arquitectura** por encima de sintaxis de código.
- Cuando haga falta un diagrama para entender un flujo, se usa uno — no se satura la conversación con diagramas si no aportan valor.
- Cuando llegue el momento de crear algo real del proyecto, siempre se entrega: ruta completa exacta, contenido íntegro para pegar tal cual, y explicación de su papel en la arquitectura.
- **Cuando se pide actualizar un documento del proyecto, se entrega el fichero completo tal como debe quedar, nunca fragmentos o instrucciones de "sustituye esta línea por esta otra"**, para evitar errores de pegado.
- **Los comandos de terminal se entregan como comando puro, listo para ejecutar — no como bloques de código explicativos.**
- **Nunca se añade código de prueba, datos de relleno (placeholders) ni implementaciones simuladas para "hacer que algo funcione" antes de tiempo, salvo que el usuario lo pida explícitamente.** Si una pieza no puede completarse todavía porque depende de una fase futura (por ejemplo, la validación de JWT), se deja explícita esa carencia (p. ej. con una excepción clara) en vez de esconderla con un valor inventado — coherente con la regla de gobernanza nº2 ("los errores se resuelven en su causa raíz, nunca se esconden").
- Terminal: **PowerShell**. IDE: **Visual Studio Community**.
- Ante una decisión de diseño con varios caminos válidos, se explican las opciones y el porqué de cada una antes de decidir. Si hay dudas sobre si un dato o una fuente externa existe realmente a cierto nivel de detalle, o sobre si algo tiene coste real en Azure, **se verifica (búsqueda web) antes de decidir o descartar algo por sentado**.

## 3. Cómo se actualiza este documento

Este archivo **no se reescribe entero cada vez**. Solo se modifica cuando se toma una decisión nueva o se cambia una anterior (dejando constancia en el registro de cambios). Cualquier conversación que retome este proyecto debe tratarlo como fuente de verdad de las decisiones ya tomadas.

## 4. Decisiones de arquitectura y diseño (registro vivo)

**Identidad del proyecto**
- Nombre: **InmoDomain**.
- Dominio: ya en propiedad del usuario, fuera del presupuesto de infraestructura del proyecto.

**Presupuesto**
- Objetivo: **≤ 10 €/mes** de infraestructura, presupuesto total y estricto (dominio aparte, ya cubierto).
- Protección: Azure Budget con alertas en 50% / 75% / 90% / 100%, y `maxReplicas = 1` durante el desarrollo.
- Explícitamente **evitados** por coste: Azure SQL, Redis gestionado, Application Gateway, NAT Gateway, Load Balancer dedicado, AKS, Azure Front Door, Log Analytics con retención alta, ACR, **Private Endpoint de Container Apps** (~0,10 €/hora, ~73 €/mes — no confundir con el ingress interno, que es gratuito y sí se usa).

**Backend**
- Runtime: **.NET 10 SDK**. Se descarta .NET Framework, .NET Standard, ASP.NET clásico y EF6.
- Framework web: **ASP.NET Core**. ORM: **EF Core** con proveedor PostgreSQL.
- API Gateway: **YARP** como único punto de entrada público; el frontend nunca llama directamente a un microservicio.
- **Arquitectura interna de cada microservicio**: patrón en capas — **Controller → Service → Repository**, con **DTOs** en el límite HTTP (entrada/salida de cada Controller) y **entidades** (`Models/`) como reflejo de las tablas, separadas de los DTOs. El Controller no conoce la base de datos; el Repository no conoce reglas de negocio; el Service no conoce HTTP ni el motor de base de datos concreto. Se usan interfaces (`IProvinceService`, `IProvinceRepository`, etc.) para permitir inyección de dependencias y facilitar tests. **No se usan clases base compartidas entre entidades** (nada de `BaseEntity`) salvo que una necesidad concreta lo justifique más adelante.
- **Nomenclatura de entidades y DTOs**: en **inglés**, igual que rutas y JSON (coherente con que son código visible), reservando el español exclusivamente para nombres de tabla/columna en la base de datos.
- **Manejo de fallos de negocio en los Services**: se usa un tipo `Result` / `Result<T>` (en `Common/`) en vez de excepciones para casos de fallo esperados y previsibles (no encontrado, conflicto, etc.). Los Services devuelven `Result`/`Result<T>` cuando la operación puede fallar de una forma que el Controller necesita distinguir; si una operación no tiene ningún caso de fallo de negocio posible (p. ej. un listado simple), se devuelve el valor directamente sin envolver. El Controller traduce `ResultError` al código HTTP correspondiente (`NotFound`, `Conflict`, etc.). Comprobar propiedad de un recurso (¿es de este usuario?) y no encontrarlo se tratan como el mismo `ResultError.NotFound`, para no filtrar la existencia de recursos ajenos.

**Microservicios iniciales** (responsabilidad única, base de datos lógica propia, sin tablas compartidas):
1. **Identity** — autenticación (login, registro, JWT, recuperación de contraseña)
2. **Property** — entidades geográficas (provincias, favoritos)
3. **Market Data** — única puerta de entrada a fuentes externas (INE, MIVAU); **interno, nunca expuesto por el Gateway**
4. **Analytics** — cálculos, tendencias y el Property Score
5. **Alerts** — reglas definidas por el usuario
6. **Notifications** — envío de avisos

**Base de datos**
- Motor: **PostgreSQL**. Proveedor: **Neon** (Free: scale-to-zero, 100 CU-hours/proyecto/mes, 0,5 GB/proyecto, hasta 100 proyectos).
- **Organización en Neon**: **un único proyecto Neon** (`InmoDomain`) para todo el sistema, con **una base de datos lógica por servicio** dentro de ese proyecto (`property_db`, `market_data_db`, etc.). La cuota gratuita (100 CU-hours, 0,5 GB) se comparte entre todos los servicios, a cambio de una gestión más simple (un solo panel, un solo proyecto que vigilar).
- **Conexión a Neon — patrón pooled/direct**: cada servicio guarda **dos** cadenas de conexión en User Secrets/variables de entorno: una con sufijo `-pooler` en el host (usada por la app en tiempo de ejecución, vía PgBouncer) y otra directa sin `-pooler` (usada exclusivamente para migraciones de EF Core, ya que Neon desaconseja aplicar migraciones a través del pooler).
- **Claves primarias**: toda tabla con una PK propia generada por el sistema usa **`Guid`** (`uuid` en PostgreSQL), nunca enteros autoincrementales. Excepción: cuando existe una **clave natural externa** ya única y estable (el código de provincia del INE), esa clave natural se mantiene como referencia entre servicios en lugar de sustituirse por un Guid — ver más abajo.

**Provincias: Guid interno vs. código INE como referencia entre servicios**
- `provincias` tiene `Id (Guid)` como clave primaria interna de Property, y una columna `codigo_ine (string, único)` con el código oficial de 2 dígitos del INE.
- El **código INE sigue siendo la referencia real entre servicios**: rutas públicas (`GET /api/v1/provinces/{codigoProvincia}`), `favoritos.codigo_provincia`, `alertas.codigo_provincia`, `notificaciones.codigo_provincia` y las tablas de Market Data (`compraventas_vivienda`, `valores_tasados`) siguen usando el código INE como `string`, no el Guid.
- Motivo: el código INE es una clave natural ya única y estable, es el identificador con el que llegan los datos oficiales desde las fuentes externas (INE/MIVAU) y es legible en una URL. Sustituirlo por un Guid obligaría a traducir constantemente entre Guid y código INE en cualquier llamada entre servicios que involucre a Market Data, sin resolver ningún problema real. El Guid de `provincias` queda como identificador interno de Property, sin propagarse al resto del sistema.

**Comunicación entre servicios**
- **Síncrona (HTTP/REST)**:
  - Cliente → Gateway → Analytics → Market Data (ficha de provincia, con datos ya calculados de `analytics_db` combinados con datos crudos de Market Data para gráficos).
  - Cliente → Gateway → Alerts → Property (al crear/editar una alerta, valida que `codigo_provincia` existe realmente antes de guardar).
- **Asíncrona (eventos)**: **Azure Service Bus** (topics/subscriptions, capa gratuita 12 meses / 13M operaciones/mes).
- **Jobs periódicos** vía **Azure Container Apps Jobs**: `market-data-import-job` (diario, escribe directamente en `market_data_db`) y `alert-evaluation-job` (cada 6h).

**Criterio general de validación entre servicios**
- Se valida un dato contra otro servicio (llamada síncrona) cuando la **integridad del dato** lo exige — es decir, cuando no se quiere permitir que exista un registro que apunte a algo inexistente —, incluso si el riesgo de seguridad de no validar es nulo. No se trata solo de minimizar dependencias entre microservicios a toda costa: la corrección del dato tiene prioridad. Ejemplo aplicado: Alerts valida `codigo_provincia` contra Property al crear/editar una alerta.

**Autenticación y autorización**
- Identity emite JWT con claims mínimos: `sub` (Guid del usuario), `email`, `iat`, `exp` — sin roles.
- **Cada microservicio público valida el JWT de forma independiente** (zero trust), no solo el Gateway — los JWT son *stateless*, validar la firma no cuesta ninguna llamada a Identity, y no hay service mesh que garantice la confianza de red entre servicios.
- **Market Data** (único servicio interno) no usa JWT de usuario — no le importa qué usuario pregunta. Se protege con **ingress interno de Container Apps** (inalcanzable desde fuera del entorno, gratuito) + **API key compartida** entre servicios como capa adicional.
- **Excepción documentada — JWT opcional**: el endpoint de ficha de provincia en Analytics (`GET /api/v1/provinces/{codigoProvincia}/analytics`) no exige JWT. Si no hay token, o es inválido, responde igual con los datos base (nunca 401 por esa causa); si el token es válido, añade campos personalizados (p. ej. `esFavorita`). Es la única ruta pública del proyecto con este comportamiento — se documenta explícitamente para no confundirla con un descuido de seguridad frente al resto de rutas, que son protegidas o públicas de forma binaria.
- **Nota de implementación pendiente**: hasta que Identity y la validación de JWT existan (Fase 8), cualquier Controller que necesite el `usuario_id` del token (p. ej. `FavoritesController.GetUserId()`) lo deja explícito con una excepción `NotImplementedException`, nunca con un valor simulado.

**Convenciones de API**
- Rutas y campos JSON en **inglés**; base de datos en **español**.
- Todas las rutas bajo el prefijo **`/api/v1/`**.
- El `usuario_id` de operaciones sobre el propio usuario sale siempre del JWT, nunca de la URL ni del body.

**Caché**
- Tabla de caché dentro de PostgreSQL (`market_data_db.datos_cache`), uso interno de Market Data. No se usa Redis gestionado. Redis queda como posible v2.

**Secretos en desarrollo local**
- Las cadenas de conexión y demás secretos de cada servicio se guardan con **User Secrets** de .NET (`dotnet user-secrets`), nunca en `appsettings.json`. En producción (Azure Container Apps) se usan variables de entorno/secretos de Container Apps — el mecanismo cambia entre entornos, la regla de "nunca en el código fuente" no.

**Herramientas de EF Core**
- `dotnet-ef` se instala como **herramienta local** (`dotnet tool install --local`), con su versión fijada en `.config/dotnet-tools.json` en la raíz del repositorio, para que cualquier máquina que clone el proyecto use la misma versión sin pasos manuales adicionales.

**Contenedores y despliegue**
- Cada servicio en su propia imagen Docker. Registro: **GHCR**.
- Despliegue: **Azure Container Apps**, `minReplicas = 0`, `maxReplicas = 1` durante el desarrollo.

**CI/CD**
- **GitHub Actions**: build → test → build de imagen Docker → push a GHCR → despliegue en Azure Container Apps, disparado por `git push` a `main`.

**Frontend**
- **React**, en hosting estático gratuito (no en Azure Container Apps).

## 5. Reglas de gobernanza para el código

1. **Seguridad e integridad de datos por encima de cualquier atajo visual o de conveniencia.**
2. **Los errores se resuelven en su causa raíz, nunca se esconden.**
3. **Ninguna información sensible se escribe nunca en el código fuente ni se sube al repositorio** — variables de entorno o gestores de secretos, reflejado en `.gitignore`.
4. **Los comentarios en el código describen qué hace ese fragmento, no explicaciones didácticas dirigidas al usuario.** Esta regla se extiende también a todos los archivos del repositorio, no solo a código C# (por ejemplo, `.gitignore`, `README.md`).
5. Priorizar código correcto y mantenible sobre soluciones rápidas que generen deuda técnica innecesaria.

## 6. Hoja de ruta general (fases)

- [x] **Fase 0 — Fundamentos conceptuales**
- [x] **Fase 1 — Entorno y repositorio**
- [x] **Fase 2 — Diseño de datos y contratos de API**
- [ ] **Fase 3 — Primer microservicio (Property Service)**
- [ ] **Fase 4 — PostgreSQL + EF Core**
- [ ] **Fase 5 — Market Data Service**
- [ ] **Fase 6 — Resiliencia**
- [ ] **Fase 7 — Analytics Service**
- [ ] **Fase 8 — Identity Service**
- [ ] **Fase 9 — API Gateway**
- [ ] **Fase 10 — Alert Service + Notification Service**
- [ ] **Fase 11 — Jobs**
- [ ] **Fase 12 — Contenedores**
- [ ] **Fase 13 — CI/CD**
- [ ] **Fase 14 — Despliegue en Azure**
- [ ] **Fase 15 — Frontend en React**
- [ ] **Fase 16 — Observabilidad**

## 7. Registro de cambios

- **v1** — Creación inicial del documento tras completar la Fase 0.
- **v2** — Renombrado el evento `AlertTriggered` a `AlertaDisparada` por consistencia de nomenclatura.
- **v3** — Añadidas decisiones de autenticación (JWT por servicio) y convenciones de API (inglés, `/api/v1/`). Eliminada la granularidad de municipio en Property.
- **v4** — Cerrado Market Data: ingress interno + API key compartida (verificado sin coste). Añadido Private Endpoint a la lista de recursos evitados por coste, para no confundirlo con el ingress interno. Confirmado que el dominio ya está cubierto y fuera del presupuesto de infraestructura.
- **v5** — Cerrados los endpoints de Analytics (JWT opcional en la ficha de provincia, comparador público) y Alerts (CRUD completo, validación síncrona contra Property al crear/editar). Fijado el criterio general: se valida contra otro servicio cuando lo exige la integridad del dato, no solo cuando hay riesgo de seguridad. Añadida la regla de comunicación: los documentos se entregan siempre completos, no en fragmentos.
- **v6** — Iniciada Fase 3 (Property Service). Fijada la arquitectura interna en capas (Controller → Service → Repository, DTOs en el límite HTTP, sin clases base compartidas) como plantilla para los 6 microservicios. Decidido que toda PK generada por el sistema usa Guid, salvo claves naturales externas ya únicas y estables: el código INE de provincia se mantiene como referencia entre servicios, mientras que `provincias.Id (Guid)` queda como identificador interno de Property sin propagarse. Añadida la regla de comunicación: los comandos de terminal se entregan como comando puro, no en explicación.
- **v7** — Escrito el código completo de Property Service (Models, Dtos, interfaces de Repository, Services, Controllers), pendiente solo de la implementación real de los Repositories (Fase 4) y de `Program.cs`/`appsettings.json`/`Property.csproj`. Introducido el tipo `Result`/`Result<T>` (en `Common/`) como mecanismo estándar para que los Services comuniquen fallos de negocio esperados, sin usar excepciones para ese fin. Añadida la regla de comunicación: nunca se añade código de prueba, datos de relleno ni implementaciones simuladas sin que el usuario lo pida explícitamente; una pieza incompleta por depender de una fase futura se deja explícita (p. ej. con una excepción), nunca simulada.
- **v8** — Iniciada Fase 4 (PostgreSQL + EF Core). Corregido el dato de cuota gratuita de Neon (100 CU-hours/proyecto/mes, no 50 — la cifra subió tras la adquisición por Databricks). Decidida la organización en Neon: un único proyecto (`InmoDomain`) con una base de datos lógica por servicio dentro, en vez de un proyecto Neon separado por servicio. Añadido el patrón de doble cadena de conexión pooled/direct (pooled para la app, directa solo para migraciones). Fijados como reglas de comunicación: los secretos de desarrollo local se guardan con User Secrets de .NET, y `dotnet-ef` se instala como herramienta local con versión fijada en el repositorio.