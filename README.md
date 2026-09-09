# 🏠 InmoDomain

> 📊 Plataforma para el análisis del mercado inmobiliario español.

**InmoDomain** es una plataforma diseñada para explorar, analizar y comparar información del mercado inmobiliario en España utilizando datos procedentes de fuentes oficiales como el **INE** (tabla 6150) y el **MIVAU**.

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
* 🏠 **Property** — Gestión de entidades geográficas como provincias, municipios y favoritos.
* 📊 **MarketData** — Integración y obtención de datos desde fuentes externas como **INE** y **MIVAU**.
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
* 📨 **Azure Service Bus** — Mensajería asíncrona
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
│
├── 📚 docs/
│
└── ⚙️ .github/
    └── workflows/
```

---

## ✨ Funcionalidades principales

* 🗺️ Exploración del mercado inmobiliario por provincias.
* 📊 Comparación entre diferentes provincias.
* 📈 Análisis de tendencias del mercado.
* ⭐ Cálculo de un **Property Score** propio.
* ❤️ Gestión de propiedades o ubicaciones favoritas.
* 🔔 Creación de alertas personalizadas.
* 📬 Sistema de notificaciones.
* 📡 Integración con datos oficiales del **INE** y **MIVAU**.

---

## 📚 Fuentes de datos

La plataforma consume información procedente de organismos oficiales:

* 🏛️ **INE** — Instituto Nacional de Estadística.
* 🏗️ **MIVAU** — Ministerio de Vivienda y Agenda Urbana.

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
