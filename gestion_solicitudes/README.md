# Gestión de Solicitudes - Módulo Odoo con IA

Módulo de Odoo para gestionar tickets de soporte con clasificación automática de prioridad usando OpenAI.

## Instalación

### 1. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 2. Configurar variable de entorno

La API de OpenAI requiere una clave de API. Configúrala como variable de entorno:

#### Windows (PowerShell)
```powershell
$env:OPENAI_API_KEY="aqui-va-tu-llave"
```

Para hacerlo permanente:
```powershell
[System.Environment]::SetEnvironmentVariable('OPENAI_API_KEY', 'aqui-va-tu-llave', 'User')
```

#### Linux/Mac
```bash
export OPENAI_API_KEY="aqui-va-tu-llave"
```

Para hacerlo permanente, agregar al `~/.bashrc` o `~/.zshrc`:
```bash
echo 'export OPENAI_API_KEY="tu-api-key"' >> ~/.bashrc
source ~/.bashrc
```

### 3. Instalar el módulo en Odoo

1. Reinicia el servidor Odoo
2. Ve a Aplicaciones
3. Actualiza la lista de aplicaciones
4. Busca "Gestión de Solicitudes"
5. Instala el módulo

## Características

### Clasificación Automática con IA

El módulo utiliza OpenAI GPT-3.5-turbo para clasificar automáticamente la prioridad de los tickets:

- **Alta**: Problemas críticos, producción, bloqueos
- **Media**: Errores, bugs, solicitudes de acceso
- **Baja**: Consultas, mejoras, tareas de baja urgencia

### Reclasificación Manual con IA

Los usuarios pueden recalcular la prioridad de un ticket existente:

1. Abrir el ticket en la interfaz de Odoo
2. Click en el botón **🤖 Recalcular Prioridad con IA**
3. El sistema analiza el título y descripción actuales
4. Actualiza automáticamente la prioridad basándose en el análisis de IA
5. Se genera un registro de auditoría del cambio

### Fallback por Reglas

Si la API de OpenAI no está disponible o falla, el sistema usa clasificación por palabras clave como respaldo.

## API Endpoints

### Crear Ticket
```
POST /api/support/ticket
Content-Type: application/json

{
  "titulo": "Error en producción",
  "descripcion": "El sistema no responde"
}
```

**Respuesta:**
```json
{
  "id": 1,
  "message": "Ticket creado exitosamente con clasificación de IA.",
  "prioridad_final": "alta",
  "prioridad_ia": "alta",
  "explicacion_ia": "Se detectó un problema crítico en producción que requiere atención inmediata."
}
```

### Listar Tickets
```
POST /api/support/tickets
Content-Type: application/json

{
  "limit": 10,
  "offset": 0
}
```

### Auditoría de Tickets

El módulo incluye un **sistema de auditoría integrado** que registra automáticamente todos los cambios realizados en los tickets.

#### Obtener Auditoría de un Ticket
```
GET/POST /api/support/ticket/{ticketId}/audit
Content-Type: application/json

{
  "limit": 50
}
```

**Respuesta:**
```json
{
  "ticketId": 1,
  "count": 3,
  "audit": [
    {
      "id": 101,
      "ticketId": 1,
      "fieldName": "estado",
      "oldValue": "nuevo",
      "newValue": "en_progreso",
      "userId": 2,
      "userName": "Juan Pérez",
      "timestamp": "2025-10-11T14:30:00.000Z",
      "changeType": "state_change",
      "description": "Estado cambiado de \"nuevo\" a \"en_progreso\""
    }
  ]
}
```

#### Obtener Toda la Auditoría
```
GET/POST /api/support/audit
Content-Type: application/json

{
  "limit": 100,
  "offset": 0,
  "ticketId": 1  // Opcional: filtrar por ticket específico
}
```

**Características de Auditoría:**
- ✅ **Tracking Automático**: Registra cambios en estado, prioridad, asignatario, título y descripción
- ✅ **Inmutable**: Los registros de auditoría no pueden ser modificados ni eliminados
- ✅ **Trazabilidad Completa**: Quién hizo qué cambio y cuándo
- ✅ **Tipos de Cambio**: `create`, `update`, `state_change`, `assignment`

Ver [ODOO_AUDIT_API_SPEC.md](./ODOO_AUDIT_API_SPEC.md) para documentación completa de la API de auditoría.

## Retrocompatibilidad

El módulo acepta campos opcionales para mantener compatibilidad con frontends que calculan la IA externamente:

```json
{
  "titulo": "...",
  "descripcion": "...",
  "prioridad": "alta",
  "prioridad_ia": "alta",
  "explicacion_ia": "...",
  "estado": "nuevo",
  "asignatario": "Nombre Usuario"
}
```

## Referencia

Este módulo fue desarrollado para el Hackathon 2025 con integración de IA.

*"Your next line is: This module uses AI!" - JoJo's Bizarre Adventure*
