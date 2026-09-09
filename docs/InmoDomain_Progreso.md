# InmoDomain — Progreso

> Este documento registra el avance real del proyecto, paso a paso. Cuando se completa algo, se añade una entrada nueva. Cuando se modifica una decisión ya tomada, se **actualiza la entrada correspondiente** en vez de duplicarla. Úsalo junto con `InmoDomain_Contexto_y_Reglas.md` para retomar la conversación en cualquier ventana nueva.

## Estado actual

**Fase en curso:** Fase 2 — Diseño de datos y contratos de API (pendiente de iniciar)
**Última fase completada:** Fase 1 — Entorno y repositorio ✅

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

### Fase 2 — Diseño de datos y contratos de API ⬜ pendiente
- [ ] Definir qué datos exactos se obtienen de INE (tabla 6150) y MIVAU (CSV trimestral)
- [ ] Diseñar tablas por base de datos lógica (una por servicio)
- [ ] Definir endpoints por servicio
- [ ] Definir eventos que viajarán por Azure Service Bus

## Decisiones pendientes / abiertas

- Dominio final del proyecto (aún no decidido).
- Alcance exacto de los datos a importar de INE/MIVAU en la Fase 2.

## Cómo actualizar este archivo

1. Al terminar un paso, marca su casilla `[x]` y, si hace falta, añade una línea con el resultado concreto (ej. "SDK .NET 10.0.x instalado y verificado").
2. Si se empieza una fase nueva, añade su sección siguiendo el mismo formato que las anteriores.
3. Si una decisión ya tomada cambia, **edita la línea original** (no crees una entrada duplicada) y deja una nota breve del cambio si es relevante para el histórico.
4. Actualiza siempre el bloque "Estado actual" al final de cada sesión.
