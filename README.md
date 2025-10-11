# Hackathon 2025 - Fullstack AI + Odoo
**Sistema de Gestión de Tickets con IA Integrada**

Repositorio para el desafío fullstack AI de Corpoeureka. Este proyecto integra un frontend moderno con Next.js y un backend Odoo personalizado, utilizando inteligencia artificial para clasificar y priorizar tickets de soporte automáticamente.

---

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Características Principales](#-características-principales)

---

## 🎯 Descripción General

Este sistema permite gestionar solicitudes internas (tickets de soporte) con clasificación automática de prioridad mediante inteligencia artificial. La solución combina:

- **Frontend**: Aplicación Next.js que genera tickets con análisis de IA
- **Backend**: Módulo personalizado de Odoo que gestiona y almacena los tickets
- **IA**: Clasificación automática de prioridad basada en el contenido del ticket

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐         ┌──────────────────┐
│   Frontend      │         │   Backend Odoo   │
│   (Next.js)     │────────▶│   Módulo Custom  │
│   + OpenAI      │  POST   │   gestion_       │
│                 │         │   solicitudes    │
└─────────────────┘         └──────────────────┘
      │                              │
      │ Análisis IA                  │ Almacenamiento
      │ (Prioridad)                  │ y Gestión
      ▼                              ▼
  OpenAI API              Base de Datos Odoo
```

**Flujo de Trabajo:**
1. El usuario crea un ticket en el frontend
2. La IA analiza el contenido y sugiere una prioridad
3. El frontend envía el ticket al backend de Odoo
4. Odoo almacena y gestiona el ticket con la clasificación de IA

---

## 📦 Requisitos Previos

- **Node.js** v18+ y npm
- **Odoo** v18.0 instalado y configurado
- **Python** 3.8+
- **OpenAI API Key** (proporcionada en el proyecto)

---

## 🚀 Instalación y Configuración

### 1️⃣ Frontend (Next.js)

```bash
# Navegar a la carpeta del frontend
cd frontend

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# O ejecutar en modo producción
npm run build
npm run start
```

El frontend estará disponible en: `http://localhost:3000`

### 2️⃣ Backend (Odoo)

#### Paso 1: Copiar el módulo a Odoo

Copiar la carpeta `gestion_solicitudes` al directorio de addons de Odoo:

```bash
# Ruta de destino en Odoo
odoo/server/addons/gestion_solicitudes
```

#### Paso 2: Instalar dependencias Python (Opcional)

```bash
# Navegar a la carpeta del módulo
cd gestion_solicitudes

# Instalar dependencias
pip install -r requirements.txt

# O instalar OpenAI directamente
pip install openai
```

> **Nota:** La instalación de OpenAI en el backend es opcional, ya que la IA se ejecuta principalmente en el frontend. Solo se utiliza como fallback si el frontend falla.

#### Paso 3: Activar el módulo en Odoo

1. Iniciar Odoo
2. Ir a **Aplicaciones** → **Actualizar lista de aplicaciones**
3. Buscar "Gestión de Solicitudes" o "gestion_solicitudes"
4. Hacer clic en **Instalar**

### 3️⃣ Configuración de Variables de Entorno

Crear un archivo `.env.local` en la carpeta `frontend`:

```env
OPENAI_API_KEY="tu api key"
NEXT_PUBLIC_ODOO_URL=http://localhost:8069
```

---

## 📁 Estructura del Proyecto

```
hackathon2025-fullstack/
│
├── frontend/                      # Aplicación Next.js
│   ├── src/
│   │   ├── app/                  # Páginas y rutas
│   │   ├── components/           # Componentes React
│   │   └── lib/                  # Utilidades y configuración
│   ├── public/                   # Archivos estáticos
│   ├── dataset/                  # Dataset de tickets de ejemplo
│   └── package.json
│
├── gestion_solicitudes/          # Módulo Odoo
│   ├── models/                   # Modelos de datos
│   │   ├── support_ticket.py    # Modelo principal de tickets
│   │   ├── ticket_audit.py      # Auditoría de cambios
│   │   └── ticket_tag.py        # Etiquetas de tickets
│   ├── controllers/              # Controladores API
│   │   └── main.py              # Endpoints REST
│   ├── views/                    # Vistas XML de Odoo
│   ├── security/                 # Permisos y accesos
│   ├── __manifest__.py          # Manifiesto del módulo
│   └── requirements.txt
│
└── README.md                     # Este archivo
```

---

## 🔌 API Endpoints

### Base URL
```
http://localhost:8069/api/support
```

### Endpoints Disponibles

#### 1. Crear Ticket
```http
POST /api/support/ticket
Content-Type: application/json

{
    "titulo": "Mi Sistema no inicia",
    "descripcion": "El servidor de producción se cayó completamente.",
    "prioridad": "alta",
    "prioridad_ia": "alta",
    "explicacion_ia": "Palabra clave 'producción' y 'cayó' indican severidad."
}
```

**Respuesta:**
```json
{
    "success": true,
    "ticket_id": 123,
    "message": "Ticket creado exitosamente"
}
```

#### 2. Listar Tickets
```http
GET /api/support/tickets?estado=nuevo&prioridad=alta
```

#### 3. Obtener Detalle de Ticket
```http
GET /api/support/ticket/{id}
```

#### 4. Actualizar Estado
```http
PUT /api/support/ticket/{id}/estado
Content-Type: application/json

{
    "estado": "en_progreso"
}
```

---

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Next.js 14+** - Framework React
- **TypeScript** - Tipado estático
- **TailwindCSS** - Estilos
- **shadcn/ui** - Componentes UI
- **OpenAI API** - Clasificación de IA

### Backend
- **Odoo 18.0** - ERP Framework
- **Python 3.8+** - Lenguaje de programación
- **PostgreSQL** - Base de datos (incluida con Odoo)
- **OpenAI** (Opcional) - Fallback de IA

---

## ✨ Características Principales

### 🤖 Clasificación Automática con IA
- Análisis de contenido del ticket (título + descripción)
- Sugerencia automática de prioridad (alta, media, baja)
- Explicación del razonamiento de la IA

### 📊 Gestión Completa de Tickets
- Creación, edición y eliminación de tickets
- Estados: nuevo, en progreso, resuelto, cancelado
- Filtros por estado y prioridad
- Vista de lista y formulario detallado

### 🔍 Auditoría y Trazabilidad
- Registro de cambios de estado
- Historial de modificaciones
- Seguimiento de asignaciones

### 🎨 Interfaz Moderna
- Diseño responsive
- Componentes reutilizables
- Experiencia de usuario optimizada

### 🔐 API RESTful
- Endpoints documentados
- Integración con sistemas externos
- Autenticación y permisos

---

## 📝 Notas Importantes

1. **Referencia JOJO**: El proyecto incluye referencias a JOJO como requisito del hackathon (verificar en el código).

2. **Configuración de OpenAI**: La API key está incluida para propósitos del hackathon. En producción, usar variables de entorno seguras.

3. **Compatibilidad**: El módulo está diseñado para Odoo 18.0. Verificar compatibilidad con otras versiones.

4. **Dataset**: Se incluye un archivo CSV con tickets de ejemplo en `frontend/dataset/tickets_main.csv`.

---

## 👥 Equipo de Desarrollo

Proyecto desarrollado para el Hackathon 2025 de Corpoeureka.

---

## 📄 Licencia

Este proyecto es parte del Hackathon 2025 y está sujeto a las reglas y términos del evento.

---

**¿Necesitas ayuda?** Consulta la documentación completa en `requeriments.md` o revisa los archivos de diagnóstico en la raíz del proyecto.