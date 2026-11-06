# 🏠 InmoDomain

> 📊 Plataforma para el análisis del mercado inmobiliario español.

[![CI](https://github.com/noemmang/InmoDomain/actions/workflows/ci.yml/badge.svg)](https://github.com/noemmang/InmoDomain/actions/workflows/ci.yml)

**InmoDomain** es una plataforma diseñada para explorar, analizar y comparar información del mercado inmobiliario en España utilizando datos procedentes de fuentes oficiales: el **INE** (tabla 6150), el **MIVAU** y el **ISTAC**.

El proyecto permite analizar el mercado por provincia, comparar diferentes territorios, calcular un **Property Score** propio, gestionar favoritos y crear alertas personalizadas. 🔍📈

---

## 🎓 Finalidad del proyecto

Este proyecto ha sido publicado con **fines didácticos y educativos**.

Su objetivo es servir como ejemplo práctico para el aprendizaje y experimentación con tecnologías modernas de desarrollo de software, especialmente en áreas como:

* 🏗️ Arquitectura de microservicios
* ⚙️ Desarrollo Backend con .NET
* 🔐 Autenticación y autorización
* 📡 Integración con APIs y fuentes externas
* 📨 Arquitecturas basadas en eventos
* 🐳 Contenedores con Docker
* ☁️ Despliegue en la nube
* 🚀 Automatización CI/CD

---

## 🏗️ Arquitectura

InmoDomain sigue una **arquitectura de microservicios**, utilizando un **API Gateway** como único punto de entrada al sistema.

```text
                        🌐 Cliente / Frontend
                                │
                                ▼
                         🚪 API Gateway
                            (YARP)
                                │
        ┌───────────────┬───────┼────────┬───────────────┐
        ▼               ▼       ▼        ▼               ▼
    🔐 Identity     🏠 Property 📊 MarketData 📈 Analytics 🔔 Alerts
                                                        │
                                                        ▼
                                                📬 Notifications
```

### 🧩 Servicios

* 🚪 **Gateway** — Reverse proxy mediante **YARP** y punto de entrada único del sistema.
* 🔐 **Identity** — Gestión de autenticación y autorización mediante **JWT**.
* 🏠 **Property** — Gestión de entidades geográficas como provincias y favoritos.
* 📊 **MarketData** — Integración y obtención de datos desde las fuentes externas **INE**, **MIVAU** e **ISTAC**.
* 📈 **Analytics** — Procesamiento de datos, cálculos de tendencias y generación del **Property Score**.
* 🔔 **Alerts** — Gestión de reglas y alertas definidas por los usuarios.
* 📬 **Notifications** — Envío de notificaciones relacionadas con las alertas.

Cada servicio mantiene su propia responsabilidad y gestiona su propia **base de datos lógica**.🔒

---

## 🛠️ Stack tecnológico

### ⚙️ Backend

* 🟣 **.NET 10**
* 🌐 **ASP.NET Core**
* 🗄️ **Entity Framework Core**
* 🐘 **PostgreSQL**
* 🚪 **YARP** — API Gateway
* ☁️ **Neon** — PostgreSQL gestionado
* 📨 **Azure Service Bus** (nivel Basic, colas) — Mensajería asíncrona
* ☁️ **Azure Container Apps** — Despliegue de servicios
* ⏱️ **Azure Container Apps Jobs** — Ejecución de tareas periódicas

### 🎨 Frontend

* ⚛️ **React**

### ☁️ Infraestructura y DevOps

* 🐳 **Docker** — Contenedores independientes por servicio
* 📦 **GitHub Container Registry (GHCR)** — Registro de imágenes
* 🔄 **GitHub Actions** — Integración y despliegue continuo (CI/CD)

---

## 📂 Estructura del repositorio

```text
InmoDomain/
│
├── 🖥️ backend/
│   ├── 🚪 Gateway/
│   ├── 🔐 Identity/
│   ├── 🏠 Property/
│   ├── 📊 MarketData/
│   ├── 📈 Analytics/
│   ├── 🔔 Alerts/
│   └── 📬 Notifications/
│
├── ⚛️ frontend/
├── ☁️ infra/
├── 📨 servicebus-emulator/
├── 🐳 docker-compose.yml
├── 📝 docs/
│
└── ⚙️ .github/
    ├── workflows/
    └── dependabot.yml
```

---

## 🐳 Ejecución con Docker

Cada servicio tiene su propio `Dockerfile` y el `docker-compose.yml` de la raíz levanta el sistema completo junto al emulador local de Azure Service Bus. Solo el Gateway publica un puerto (`http://localhost:5001`).

1. Copiar `.env.example` a `.env` y rellenar los valores (el fichero `.env` no se versiona).
2. Construir y levantar los servicios:

```powershell
docker compose build
docker compose up -d
```

3. Ejecutar la importación de datos (job bajo el perfil `jobs`):

```powershell
docker compose run --rm import-job
```

El job importa compraventas (INE), precios tasados (MIVAU) y obra de vivienda (ISTAC). Para fijar otra versión del fichero de obra del ISTAC se define `ISTAC_CONSTRUCTION_URL` en `.env`; vacía, usa la última versión publicada.

---

## 🔄 CI/CD

El workflow `.github/workflows/ci.yml` se ejecuta en cada pull request y en cada push a `main` (se ignoran los cambios en `docs/`, `frontend/` y ficheros `.md`):

1. 🔨 **Build** — restore y compilación en Release de los 9 proyectos .NET.
2. 🧪 **Test** — ejecuta todos los proyectos `*Tests.csproj`; si no existe ninguno, lo avisa como *warning*.
3. 🐳 **Imágenes** — construye las 8 imágenes con sus `Dockerfile`. Solo en push a `main` se publican en GHCR como `ghcr.io/<propietario>/inmodomain-<servicio>` con las etiquetas `latest` y `sha-<commit>`; en pull request solo se construyen.
4. ☁️ **Despliegue** — en push a `main`, y solo si el repositorio define las variables `AZURE_*`, inicia sesión en Azure con OIDC (sin secretos de larga duración), actualiza la imagen de cada Container App y del job de importación, y comprueba el Gateway.

Dependabot propone cada semana actualizaciones de GitHub Actions, paquetes NuGet e imágenes base de Docker.

---

## ☁️ Despliegue en Azure

La carpeta `infra/` contiene los scripts de PowerShell y las plantillas YAML de Azure Container Apps:

* `provision.ps1` — crea el grupo de recursos, Log Analytics (con tope diario), el entorno de Container Apps, el namespace de Service Bus (Basic, con una cola por evento), el presupuesto mensual y la identidad de despliegue para GitHub Actions (OIDC).
* `deploy.ps1` — crea o actualiza los 7 servicios y el job de importación a partir de `infra/apps/*.yaml`, con los secretos tomados de `infra/azure.env` (no versionado; plantilla en `infra/azure.env.example`).

Solo el Gateway tiene ingress externo; el resto de servicios solo es accesible desde el entorno. Todos escalan a cero réplicas y los consumidores de Service Bus se activan por la longitud de su cola.

---

## ✨ Funcionalidades principales

* 🗺️ Exploración del mercado inmobiliario por provincias.
* 📊 Comparación entre diferentes provincias.
* 📈 Análisis de tendencias del mercado.
* 🏗️ Obra de vivienda por provincia: viviendas iniciadas y terminadas, libres y protegidas, y su relación con las compraventas.
* ⭐ Cálculo de un **Property Score** propio.
* ❤️ Gestión de propiedades o ubicaciones favoritas.
* 🔔 Creación de alertas personalizadas.
* 📬 Sistema de notificaciones.
* 📡 Integración con datos oficiales del **INE**, **MIVAU** e **ISTAC**.

---

## 📚 Fuentes de datos

La plataforma consume información procedente de organismos oficiales:

* 🏛️ **INE** — Instituto Nacional de Estadística. Compraventas de vivienda por provincia, mes y estado (nueva o segunda mano), tabla 6150 (API JSON).
* 🏗️ **MIVAU** — Ministerio de Vivienda y Agenda Urbana. Valor tasado de la vivienda libre por provincia y trimestre (ficheros `.XLS`).
* 📊 **ISTAC** — Instituto Canario de Estadística. Viviendas libres y protegidas iniciadas y terminadas por provincia y mes (cubo `E25004A_000001`, fichero `.xlsx`). Redistribuye la Estadística de Vivienda Libre y Protegida del MIVAU para toda España. La vivienda libre es una estimación, la protegida son calificaciones (provisional = iniciada, definitiva = terminada) y las cifras recientes son provisionales.

---

## 🚧 Estado del proyecto

🟡 **En desarrollo activo**

El proyecto se encuentra actualmente en evolución y puede experimentar cambios en su arquitectura, funcionalidades y organización interna.

---

## 👨‍💻 Autor

**Noe Mmang Obono**

Proyecto publicado con fines **didácticos y educativos**. 🎓📚

---

### ⭐ ¡Gracias por visitar el proyecto! 🏠