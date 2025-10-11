# Especificación API de Auditoría - Odoo

## Introducción

Este documento define la especificación completa de la API de auditoría para el sistema de tickets de soporte. El sistema registra automáticamente todos los cambios realizados en los tickets, proporcionando un historial completo y auditable.

## Modelo de Datos

### AuditEntry

Estructura de un registro de auditoría:

```typescript
interface AuditEntry {
  id: number;                    // ID único del registro de auditoría
  ticketId: number;              // ID del ticket relacionado
  ticketTitle?: string;          // Título del ticket (solo en /api/support/audit)
  fieldName: string;             // Nombre del campo modificado
  oldValue: string;              // Valor anterior del campo
  newValue: string;              // Valor nuevo del campo
  userId: number;                // ID del usuario que realizó el cambio
  userName: string;              // Nombre del usuario
  timestamp: string;             // Fecha y hora del cambio (ISO 8601)
  changeType: 'create' | 'update' | 'state_change' | 'assignment';
  description: string;           // Descripción legible del cambio
}
```

### Tipos de Cambio

| Tipo | Descripción |
|------|-------------|
| `create` | Creación del ticket |
| `update` | Actualización de campo general |
| `state_change` | Cambio de estado del ticket |
| `assignment` | Asignación o reasignación del ticket |

### Campos Trackeados

El sistema registra automáticamente cambios en los siguientes campos:

- **estado**: Estado del ticket (nuevo, en_progreso, resuelto, cancelado)
- **prioridad**: Prioridad del ticket (baja, media, alta)
- **asignatario_id**: Usuario asignado al ticket
- **titulo**: Título del ticket
- **descripcion**: Descripción del problema

## Endpoints de la API

### 1. Obtener Auditoría de un Ticket Específico

Consulta el historial de cambios de un ticket individual.

**Endpoint:**
```
GET/POST /api/support/ticket/{ticketId}/audit
```

**Parámetros de URL:**
- `ticketId` (requerido): ID del ticket

**Parámetros del Body (JSON-RPC o JSON plano):**
```json
{
  "limit": 50  // Opcional: Número máximo de registros (default: todos)
}
```

**Formato JSON-RPC:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "call",
  "params": {
    "limit": 50
  }
}
```

**Respuesta Exitosa:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "ticketId": 123,
    "count": 5,
    "audit": [
      {
        "id": 501,
        "ticketId": 123,
        "fieldName": "estado",
        "oldValue": "nuevo",
        "newValue": "en_progreso",
        "userId": 2,
        "userName": "Juan Pérez",
        "timestamp": "2025-10-11T14:30:00.000Z",
        "changeType": "state_change",
        "description": "Estado cambiado de \"nuevo\" a \"en_progreso\""
      },
      {
        "id": 500,
        "ticketId": 123,
        "fieldName": "ticket",
        "oldValue": "",
        "newValue": "Error en producción",
        "userId": 1,
        "userName": "Sistema",
        "timestamp": "2025-10-11T14:00:00.000Z",
        "changeType": "create",
        "description": "Ticket creado: Error en producción"
      }
    ]
  }
}
```

**Respuesta de Error (Ticket no encontrado):**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": 404,
    "message": "Ticket con ID 123 no encontrado."
  }
}
```

---

### 2. Obtener Todos los Registros de Auditoría

Consulta todos los registros de auditoría del sistema con paginación y filtrado opcional.

**Endpoint:**
```
GET/POST /api/support/audit
```

**Parámetros del Body (JSON-RPC o JSON plano):**
```json
{
  "limit": 100,     // Opcional: Máximo de registros (default: 100, max: 500)
  "offset": 0,      // Opcional: Offset para paginación (default: 0)
  "ticketId": 123   // Opcional: Filtrar por ID de ticket específico
}
```

**Formato JSON-RPC:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "call",
  "params": {
    "limit": 50,
    "offset": 0,
    "ticketId": 123
  }
}
```

**Respuesta Exitosa:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "count": 2,
    "audit": [
      {
        "id": 502,
        "ticketId": 124,
        "ticketTitle": "Bug en módulo de facturación",
        "fieldName": "asignatario_id",
        "oldValue": "Juan Pérez",
        "newValue": "María García",
        "userId": 3,
        "userName": "Admin",
        "timestamp": "2025-10-11T15:00:00.000Z",
        "changeType": "assignment",
        "description": "Asignatario cambiado de \"Juan Pérez\" a \"María García\""
      },
      {
        "id": 501,
        "ticketId": 123,
        "ticketTitle": "Error en producción",
        "fieldName": "prioridad",
        "oldValue": "media",
        "newValue": "alta",
        "userId": 2,
        "userName": "Juan Pérez",
        "timestamp": "2025-10-11T14:45:00.000Z",
        "changeType": "update",
        "description": "Prioridad cambiada de \"media\" a \"alta\""
      }
    ]
  }
}
```

---

## Integración Automática

### Tracking Automático de Cambios

El sistema registra automáticamente cambios cuando:

1. **Se crea un ticket nuevo** → Genera entrada de tipo `create`
2. **Se modifica el estado** → Genera entrada de tipo `state_change`
3. **Se asigna/reasigna** → Genera entrada de tipo `assignment`
4. **Se actualiza otro campo** → Genera entrada de tipo `update`

### Ejemplo de Implementación en Python/Odoo

El módulo ya incluye tracking automático. No se requiere código adicional. Cuando se modifica un ticket:

```python
# Esto automáticamente crea un registro de auditoría
ticket = env['support.ticket'].browse(123)
ticket.write({'estado': 'resuelto'})
```

El sistema internamente ejecuta:

```python
# Código interno (ya implementado en support_ticket.py)
def write(self, vals):
    for record in self:
        old_values = {field: getattr(record, field) for field in tracked_fields}
        result = super().write(vals)
        for field in vals:
            if field in tracked_fields:
                self._create_audit_log_for_field(record, field, old_values[field], vals[field])
    return result
```

---

## Modelo Odoo: support.ticket.audit

### Campos del Modelo

```python
class SupportTicketAudit(models.Model):
    _name = 'support.ticket.audit'
    _description = 'Auditoría de Cambios en Tickets'
    _order = 'timestamp desc'
    
    ticket_id = fields.Many2one('support.ticket', string='Ticket', required=True, 
                                ondelete='cascade', index=True)
    field_name = fields.Char(string='Campo Modificado', required=True)
    old_value = fields.Text(string='Valor Anterior')
    new_value = fields.Text(string='Valor Nuevo')
    user_id = fields.Many2one('res.users', string='Usuario', required=True)
    timestamp = fields.Datetime(string='Fecha y Hora', required=True, 
                               default=fields.Datetime.now)
    change_type = fields.Selection([
        ('create', 'Creación'),
        ('update', 'Actualización'),
        ('state_change', 'Cambio de Estado'),
        ('assignment', 'Asignación'),
    ], string='Tipo de Cambio', required=True, default='update')
    description = fields.Text(string='Descripción del Cambio')
```

### Métodos Auxiliares

```python
@api.model
def create_audit_entry(self, ticket_id, field_name, old_value, new_value, 
                      user_id, change_type='update', description=None):
    """Crea una entrada de auditoría manualmente si es necesario."""
    values = {
        'ticket_id': ticket_id,
        'field_name': field_name,
        'old_value': str(old_value) if old_value else '',
        'new_value': str(new_value) if new_value else '',
        'user_id': user_id,
        'change_type': change_type,
        'description': description or f'Campo {field_name} modificado',
    }
    return self.create(values)

@api.model
def get_ticket_audit_log(self, ticket_id, limit=None):
    """Obtiene el registro de auditoría de un ticket."""
    domain = [('ticket_id', '=', ticket_id)]
    return self.search(domain, limit=limit, order='timestamp desc')
```

---

## Seguridad y Permisos

### Configuración en ir.model.access.csv

```csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_support_ticket_audit_user,support.ticket.audit.user,model_support_ticket_audit,base.group_user,1,0,1,0
```

**Permisos:**
- ✅ **Read (1)**: Los usuarios pueden leer registros de auditoría
- ❌ **Write (0)**: Los registros de auditoría NO se pueden modificar
- ✅ **Create (1)**: El sistema puede crear registros automáticamente
- ❌ **Unlink (0)**: Los registros de auditoría NO se pueden eliminar

Esta configuración garantiza la **inmutabilidad** de los registros de auditoría.

---

## Sistema Híbrido (Odoo + Local)

El frontend puede combinar registros de Odoo con un store local:

### Ventajas del Sistema Híbrido

1. **✅ Persistencia**: Los datos en Odoo sobreviven reinicios
2. **✅ Fallback**: Funciona aunque Odoo no esté completamente implementado
3. **✅ Combinación**: Mezcla registros de ambas fuentes
4. **✅ Deduplicación**: Evita duplicados por ID

### Implementación en el Frontend

```typescript
// Ejemplo de combinación en el frontend
async function getTicketAudit(ticketId: number) {
  try {
    // 1. Obtener datos de Odoo
    const odooData = await fetch(`/api/support/ticket/${ticketId}/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }).then(r => r.json());
    
    // 2. Obtener datos locales
    const localData = auditStore.getByTicketId(ticketId);
    
    // 3. Combinar y deduplicar
    const combined = [...odooData.result.audit, ...localData];
    const deduplicated = Array.from(
      new Map(combined.map(item => [item.id, item])).values()
    );
    
    // 4. Ordenar cronológicamente
    return deduplicated.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    // Fallback: usar solo datos locales
    return auditStore.getByTicketId(ticketId);
  }
}
```

---

## Ejemplos de Uso

### Consultar Auditoría de un Ticket

```bash
curl -X POST http://localhost:8069/api/support/ticket/123/audit \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "call",
    "params": {
      "limit": 10
    }
  }'
```

### Consultar Toda la Auditoría

```bash
curl -X POST http://localhost:8069/api/support/audit \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "call",
    "params": {
      "limit": 50,
      "offset": 0
    }
  }'
```

### Filtrar Auditoría por Ticket

```bash
curl -X POST http://localhost:8069/api/support/audit \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "call",
    "params": {
      "ticketId": 123
    }
  }'
```

---

## Notas Importantes

1. **Automático**: No se requiere código adicional para registrar cambios. El sistema lo hace automáticamente al usar `write()`.

2. **Inmutable**: Los registros de auditoría no se pueden modificar ni eliminar, garantizando integridad.

3. **Timestamps ISO 8601**: Todas las fechas están en formato ISO 8601 para compatibilidad con JavaScript.

4. **Paginación**: Usa `limit` y `offset` para manejar grandes volúmenes de datos.

5. **Compatibilidad**: Soporta tanto JSON-RPC como JSON plano para flexibilidad.

6. **Cascada**: Si se elimina un ticket, sus registros de auditoría también se eliminan (`ondelete='cascade'`).

---

## Roadmap Futuro

Posibles mejoras:

- [ ] Filtrado por rango de fechas
- [ ] Filtrado por tipo de cambio
- [ ] Filtrado por usuario
- [ ] Exportación de auditoría a CSV/PDF
- [ ] Notificaciones de cambios críticos
- [ ] Reversión de cambios (rollback)
- [ ] Comparación de versiones side-by-side

---

**Versión**: 1.0  
**Fecha**: Octubre 2025  
**Autor**: Maikol Aguilar
