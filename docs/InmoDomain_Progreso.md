# InmoDomain — Progreso

> Este documento registra el avance real del proyecto, paso a paso. Cuando se completa algo, se añade una entrada nueva. Cuando se modifica una decisión ya tomada, se **actualiza la entrada correspondiente** en vez de duplicarla. Úsalo junto con `InmoDomain_Contexto_y_Reglas.md` para retomar la conversación en cualquier ventana nueva.

## Estado actual

**Fase en curso:** Fase 1 — Entorno y repositorio (SDK, Git y Visual Studio listos; falta estructura de carpetas y primer commit)
**Última fase completada:** Fase 0 — Fundamentos conceptuales ✅

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

### Fase 1 — Entorno y repositorio 🔶 en curso
- [x] Instalar/confirmar .NET 10 SDK — SDK 10.0.401 instalado y verificado (`dotnet --list-sdks`)
- [x] Confirmar Visual Studio Community instalado y configurado — Visual Studio Community 2026, workload "Desarrollo de ASP.NET y web", configuración de entorno "Desarrollo web"
- [x] Git confirmado instalado — versión 2.47.1.windows.1 (ya estaba presente)
- [ ] Crear estructura de carpetas del monorepo
- [ ] Primer commit en Git

## Decisiones pendientes / abiertas

- Dominio final del proyecto (aún no decidido).
- Alcance exacto de los datos a importar de INE/MIVAU en la Fase 2.

## Cómo actualizar este archivo

1. Al terminar un paso, marca su casilla `[x]` y, si hace falta, añade una línea con el resultado concreto (ej. "SDK .NET 10.0.x instalado y verificado").
2. Si se empieza una fase nueva, añade su sección siguiendo el mismo formato que las anteriores.
3. Si una decisión ya tomada cambia, **edita la línea original** (no crees una entrada duplicada) y deja una nota breve del cambio si es relevante para el histórico.
4. Actualiza siempre el bloque "Estado actual" al final de cada sesión.
