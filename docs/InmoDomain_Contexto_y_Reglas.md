# InmoDomain — Contexto y reglas de trabajo

> Este documento resume cómo trabajamos en el proyecto **InmoDomain**, qué decisiones de arquitectura y diseño se han tomado, y qué reglas rigen tanto la forma de explicar las cosas como la forma de escribir código cuando llegue el momento. Está pensado para pegarse al principio de **cualquier conversación nueva** (en cualquier ventana de contexto) y que la explicación pueda continuar exactamente donde se quedó.

## 1. Objetivo del proyecto

InmoDomain es una plataforma de análisis del mercado inmobiliario español, construida como proyecto de portafolio. Consume datos oficiales del INE (API JSON, tabla 6150) y del MIVAU (CSV trimestral), y permite explorar el mercado por provincia, comparar provincias, generar un "Property Score" propio, guardar favoritos y crear alertas.

El objetivo de aprendizaje no es principalmente escribir código a mano: es entender **arquitectura, conceptos y flujos de sistemas** (microservicios, comunicación síncrona/asíncrona, contenedores, despliegue en la nube, CI/CD) con la profundidad suficiente para poder explicarlos y dirigir con criterio a una IA/agente que sí escriba el código.

## 2. Reglas de comunicación (cómo se explica)

- Se avanza **poco a poco, por bloques**, nunca volcando todo el diseño de golpe.
- Prioridad: **conceptos, vocabulario técnico y arquitectura** por encima de sintaxis de código. El código en sí es secundario.
- Cuando haga falta un diagrama para entender un flujo, se usa uno — no se satura la conversación con diagramas si no aportan valor.
- Cuando llegue el momento de crear algo real del proyecto (carpeta, archivo, configuración), siempre se entrega:
  1. La **ruta completa exacta** del archivo.
  2. El **contenido íntegro** para pegar tal cual (nunca fragmentos sueltos que haya que ensamblar).
  3. Una explicación de **qué es ese archivo y qué papel juega** dentro de la arquitectura general.
- Terminal: **PowerShell**. IDE: **Visual Studio Community**.

## 3. Cómo se actualiza este documento

Este archivo **no se reescribe entero cada vez**. Solo se modifica cuando:
- Se toma una **decisión nueva** que no estaba recogida aquí, o
- Se **cambia una decisión anterior** (en ese caso se edita la entrada correspondiente, dejando constancia del cambio en el registro de cambios al final).

Cualquier conversación que retome este proyecto en el futuro debe tratar este documento como la fuente de verdad de las decisiones ya tomadas, y solo proponer cambios sobre él si el usuario los pide explícitamente.

## 4. Decisiones de arquitectura y diseño (registro vivo)

**Identidad del proyecto**
- Nombre: **InmoDomain** (el documento inicial de diseño usaba el nombre provisional "PropIntel"; se descarta a favor de InmoDomain).
- Dominio final: **pendiente de decidir**.

**Presupuesto**
- Objetivo: **≤ 10 €/mes** de infraestructura (el dominio se cuenta aparte, como coste anual independiente).
- Protección: Azure Budget con alertas en 50% / 75% / 90% / 100%, y `maxReplicas = 1` durante el desarrollo como freno adicional.

**Backend**
- Runtime: **.NET 10 SDK** (LTS actual, soporte hasta noviembre de 2028). Se descarta explícitamente .NET Framework, .NET Standard, ASP.NET clásico y Entity Framework 6 por ser tecnología legada.
- Framework web: **ASP.NET Core**.
- ORM: **EF Core**, con proveedor de PostgreSQL.
- API Gateway: **YARP** (reverse proxy) como único punto de entrada; el frontend nunca llama directamente a un microservicio.

**Microservicios iniciales** (cada uno con responsabilidad única y su propia base de datos lógica — sin tablas compartidas entre servicios):
1. **Identity** — autenticación (login, registro, JWT)
2. **Property** — entidades geográficas (provincias, municipios, favoritos)
3. **Market Data** — única puerta de entrada a fuentes externas (INE, MIVAU)
4. **Analytics** — cálculos, tendencias y el Property Score
5. **Alerts** — reglas definidas por el usuario
6. **Notifications** — envío de avisos (email inicialmente)

**Base de datos**
- Motor: **PostgreSQL**. Confirmado que **Neon no soporta SQL Server ni ningún otro motor** — es exclusivamente Postgres, por lo que no hay alternativa aquí.
- Proveedor: **Neon** (plan Free: scale-to-zero, 50 CU-hours/proyecto/mes, 0,5 GB/proyecto).
- Una base de datos lógica por servicio dentro del mismo proyecto de Neon.

**Comunicación entre servicios**
- **Síncrona (HTTP/REST)** para flujos que necesitan una respuesta inmediata para el usuario (ej. consultar la ficha de una provincia). Cadena típica: Cliente → Gateway → Analytics → Market Data → INE/caché.
- **Asíncrona (eventos)** para todo lo que no necesita respuesta inmediata (ej. `AlertTriggered`). Se usa **Azure Service Bus** (topics/subscriptions), aprovechando la capa gratuita de 12 meses / 13M operaciones mensuales.
- **Jobs periódicos**, no workers 24/7, vía **Azure Container Apps Jobs**: `market-data-import-job` (diario) y `alert-evaluation-job` (cada 6h).

**Caché**
- No se usa Redis gestionado inicialmente (coste). Se implementa una tabla de caché dentro de PostgreSQL (`market_data_db.cached_data`). Redis queda como posible v2.

**Contenedores y despliegue**
- Cada servicio se empaqueta en su propia imagen Docker.
- Registro de imágenes: **GHCR** (GitHub Container Registry) — se evita Azure Container Registry para no sumar otro servicio de pago.
- Despliegue: **Azure Container Apps**, con `minReplicas = 0` (scale-to-zero) y `maxReplicas = 1` durante el desarrollo.
- Explícitamente **evitados** por coste: Azure SQL, Redis gestionado, Application Gateway, NAT Gateway, Load Balancer dedicado, AKS, Azure Front Door, Log Analytics con retención alta, ACR.

**CI/CD**
- **GitHub Actions**: build → test → build de imagen Docker → push a GHCR → despliegue en Azure Container Apps, disparado por `git push` a `main`.

**Frontend**
- **React**, alojado en un hosting estático gratuito (no en Azure Container Apps), para no consumir recursos de pago sirviendo HTML/JS.

## 5. Reglas de gobernanza para el código (aplican desde que empecemos a escribir código real)

1. **Seguridad e integridad de datos por encima de cualquier atajo visual o de conveniencia.** Nunca se prioriza que "se vea bien" o "funcione ya" sobre que los datos estén correctos y protegidos.
2. **Los errores se resuelven en su causa raíz, nunca se esconden.** Prohibido: silenciar excepciones sin tratarlas, capturar errores solo para que no se muestren en pantalla, o maquillar visualmente un fallo en vez de corregirlo.
3. **Ninguna información sensible se escribe nunca en el código fuente ni se sube al repositorio.** Contraseñas, cadenas de conexión, claves de API, secretos de cualquier tipo van siempre en variables de entorno o gestores de secretos (User Secrets en local, Key Vault / variables de entorno en producción), y quedan reflejados en `.gitignore`.
4. **Los comentarios en el código describen qué hace ese fragmento de código, no las explicaciones didácticas dirigidas al usuario.** Son para cualquier lector futuro del repositorio (reclutadores, compañeros, el propio autor dentro de un año) — las explicaciones de aprendizaje viven en la conversación, no en el código fuente.
5. Priorizar código correcto y mantenible sobre soluciones rápidas que generen deuda técnica innecesaria.

## 6. Hoja de ruta general (fases)

- [x] **Fase 0 — Fundamentos conceptuales**: cliente-servidor, monolito vs. microservicios, arquitectura de InmoDomain, comunicación síncrona, comunicación asíncrona, contenedores, nube y despliegue, CI/CD, ecosistema .NET moderno vs. legado, decisión Neon/PostgreSQL.
- [ ] **Fase 1 — Entorno y repositorio**: SDK, Git, Visual Studio Community, estructura del monorepo, primer commit.
- [ ] **Fase 2 — Diseño de datos y contratos de API**: qué datos exactos se obtienen de INE/MIVAU, tablas por base de datos, endpoints por servicio, eventos que viajarán por Service Bus.
- [ ] **Fase 3 — Primer microservicio (Property Service)**: Web API mínima en ASP.NET Core.
- [ ] **Fase 4 — PostgreSQL + EF Core**: conexión a Neon, migraciones, primeras tablas.
- [ ] **Fase 5 — Market Data Service**: integración con INE y MIVAU.
- [ ] **Fase 6 — Resiliencia**: timeouts, reintentos, circuit breaker.
- [ ] **Fase 7 — Analytics Service**: cálculos y Property Score.
- [ ] **Fase 8 — Identity Service**: autenticación y JWT.
- [ ] **Fase 9 — API Gateway**: YARP enrutando a todos los servicios.
- [ ] **Fase 10 — Alert Service + Notification Service**: comunicación asíncrona con Service Bus.
- [ ] **Fase 11 — Jobs**: Market Data Import Job y Alert Evaluation Job.
- [ ] **Fase 12 — Contenedores**: Dockerfile por servicio, docker-compose local.
- [ ] **Fase 13 — CI/CD**: GitHub Actions.
- [ ] **Fase 14 — Despliegue en Azure**: Container Apps, dominio, presupuesto y alertas.
- [ ] **Fase 15 — Frontend en React**.
- [ ] **Fase 16 — Observabilidad**: logging estructurado, health checks, correlation IDs.

## 7. Registro de cambios

- **v1** — Creación inicial del documento tras completar la Fase 0.
