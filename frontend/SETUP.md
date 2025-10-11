# 🎫 Sistema de Tickets - Frontend

Sistema de gestión de tickets de soporte con clasificación automática mediante IA para Odoo Hackathon 2025.

## 🚀 Stack Tecnológico

- **Framework**: Next.js 15 con App Router
- **UI**: TailwindCSS + shadcn/ui
- **Iconos**: Lucide React
- **IA**: OpenAI GPT-4o-mini
- **TypeScript**: Para type safety

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno (crear archivo .env.local)
OPENAI_API_KEY=tu_api_key_aqui
NEXT_PUBLIC_ODOO_API_URL=http://localhost:8069/api/support
```

## 🏃 Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# El servidor estará disponible en http://localhost:3000
```

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── api/                 # API Routes
│   │   ├── tickets/         # CRUD de tickets
│   │   └── analyze/         # Análisis de IA
│   ├── layout.tsx           # Layout principal
│   └── page.tsx             # Página principal
├── components/
│   ├── ui/                  # Componentes shadcn/ui
│   ├── ticket-card.tsx      # Tarjeta de ticket
│   ├── ticket-filters.tsx   # Filtros
│   └── create-ticket-dialog.tsx  # Diálogo de creación
├── types/
│   └── ticket.ts            # Tipos TypeScript
└── utils/
    └── cn.ts                # Utilidades
```

## ✨ Características

### Funcionalidades Principales

- ✅ **Lista de tickets** con filtros por estado y prioridad
- ✅ **Crear tickets** con formulario intuitivo
- ✅ **Análisis de IA** para clasificación automática de prioridad
- ✅ **Cambio de estado** de tickets
- ✅ **Dashboard** con estadísticas en tiempo real
- ✅ **UI moderna** con animaciones y transiciones

### Integración con IA

El sistema utiliza OpenAI GPT-4o-mini para analizar el título y descripción de cada ticket y determinar automáticamente su prioridad (alta, media o baja) con una explicación.

**¡ORA ORA!** - El análisis se realiza con la velocidad de Star Platinum ⚡

### Componentes UI

- **Button**: Botones con variantes (default, outline, ghost, etc.)
- **Card**: Tarjetas para mostrar tickets
- **Badge**: Etiquetas para prioridad y estado
- **Dialog**: Modal para crear tickets
- **Input/Textarea**: Campos de formulario
- **Select**: Dropdown para filtros y selección

## 🎨 Diseño

El diseño sigue las mejores prácticas de UX:
- Interfaz limpia y moderna
- Colores intuitivos para estados y prioridades
- Responsivo para móvil y desktop
- Animaciones suaves
- Loading states
- Empty states con mensajes útiles

## 🔌 API Endpoints

### Frontend API Routes

#### GET /api/tickets
Obtiene la lista de tickets desde Odoo con filtros opcionales.

**Query params:**
- `estado`: nuevo | en progreso | resuelto | cancelado
- `prioridad`: alta | media | baja
- `limit`: número de registros (default: 100)
- `offset`: número de registros a saltar (default: 0)

**Response:**
```json
{
  "success": true,
  "tickets": [...],
  "count": 42
}
```

#### POST /api/tickets
Crea un nuevo ticket en Odoo.

**Body:**
```json
{
  "titulo": "string",
  "descripcion": "string",
  "prioridad": "alta | media | baja",
  "prioridad_ia": "alta | media | baja",
  "explicacion_ia": "string"
}
```

**Response:**
```json
{
  "success": true,
  "ticket": {
    "id": 1,
    "titulo": "...",
    "descripcion": "...",
    "prioridad": "alta",
    "estado": "nuevo",
    "prioridad_ia": "alta",
    "explicacion_ia": "..."
  },
  "message": "Ticket creado exitosamente"
}
```

### Backend Odoo Endpoints

#### POST /api/support/ticket
Endpoint de Odoo para crear un ticket.

**Body:**
```json
{
  "titulo": "string",
  "descripcion": "string",
  "prioridad": "alta | media | baja",
  "prioridad_ia": "alta | media | baja",
  "explicacion_ia": "string"
}
```

**Response:**
```json
{
  "id": 1,
  "message": "Ticket creado exitosamente",
  "prioridad_final": "alta"
}
```

#### POST /api/support/tickets
Endpoint de Odoo para listar tickets.

**Body:**
```json
{
  "limit": 100,
  "offset": 0
}
```

**Response:**
```json
{
  "count": 42,
  "records": [...]
}
```

### POST /api/analyze
Analiza un ticket con IA para determinar su prioridad.

**Body:**
```json
{
  "titulo": "string",
  "descripcion": "string"
}
```

**Response:**
```json
{
  "success": true,
  "prioridad": "alta | media | baja",
  "explicacion": "string"
}
```

## 🎯 Referencias JOJO

Como requisito del hackathon, el código incluye referencias a JoJo's Bizarre Adventure:

1. **En el prompt de IA**: "¡ORA ORA! Analiza esto con la velocidad de Star Platinum"
2. **En la UI principal**: "JOJO Reference: Yare yare daze..."
3. **En el footer**: "⭐ Stand Proud! You are strong. ⭐"

## 🏗️ Build para Producción

```bash
# Compilar para producción
npm run build

# Iniciar servidor de producción
npm start
```

## 📝 Notas

- El proyecto se comunica con el backend de Odoo mediante dos endpoints:
  - **POST** `/api/support/ticket` - Para crear tickets
  - **POST** `/api/support/tickets` - Para listar tickets (con limit y offset)
- La API Key de OpenAI debe configurarse en las variables de entorno
- Los filtros por estado y prioridad se aplican en el frontend después de obtener los datos
- La variable `NEXT_PUBLIC_ODOO_API_URL` debe apuntar a `http://localhost:8069/api/support` (sin `/ticket` al final)

## 🤝 Contribuir

Este proyecto es parte del Hackathon 2025 de Odoo + IA.

---

**Desarrollado con ❤️ para Odoo Hackathon 2025**

*"Your next line is... 'This is an amazing ticket system!'" - Joseph Joestar*
