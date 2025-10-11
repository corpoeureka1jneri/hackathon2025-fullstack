# Documentación Técnica - Módulo Gestión de Solicitudes

## 📋 Tabla de Contenidos
1. [Descripción General](#descripción-general)
2. [Arquitectura del Módulo](#arquitectura-del-módulo)
3. [Modelos de Datos](#modelos-de-datos)
4. [Clasificación con IA](#clasificación-con-ia)
5. [API Endpoints](#api-endpoints)
6. [Vistas y UI](#vistas-y-ui)
7. [Sistema de Auditoría](#sistema-de-auditoría)
8. [Instalación y Configuración](#instalación-y-configuración)

---

## Descripción General

**Nombre**: Gestión de Solicitudes (Hackathon)
**Versión**: 1.0
**Autor**: Maikol Aguilar
**Categoría**: Services/Helpdesk

este modulo funciona en conjunto con el frontend para poder generar las descripciones con la IA con openai, en la carpeta /frontend  debe ejecutarse con npm run dev
 
Módulo de Odoo 18 para gestionar tickets de soporte con clasificación automática de prioridad mediante OpenAI GPT-3.5-turbo. Incluye sistema de auditoría completo, API REST pública y fallback por reglas cuando la IA no está disponible.

### Características Principales
- ✅ Clasificación automática de prioridad con OpenAI
- ✅ Fallback inteligente basado en reglas
- ✅ Sistema de auditoría inmutable
- ✅ API REST para integraciones externas
- ✅ Etiquetado flexible de tickets
- ✅ Chatter integrado (mail.thread)
- ✅ Actividades y seguimiento

---

## Arquitectura del Módulo

### Estructura de Archivos
```
gestion_solicitudes/
├── __init__.py
├── __manifest__.py              # Metadatos y dependencias
├── requirements.txt             # openai>=1.0.0
├── README.md                    # Guía de usuario
├── ODOO_AUDIT_API_SPEC.md      # Especificación API auditoría
├── documentation_code.md        # Este documento
├── test_openai_config.py       # Script diagnóstico OpenAI
├── models/
│   ├── __init__.py
│   ├── support_ticket.py       # Modelo principal + IA
│   ├── ticket_audit.py         # Auditoría de cambios
│   └── ticket_tag.py           # Etiquetas
├── controllers/
│   ├── __init__.py
│   └── main.py                 # API REST endpoints
├── views/
│   └── support_ticket_views.xml # Vistas form/tree/search
├── security/
│   └── ir.model.access.csv     # Permisos de acceso
└── ref/                        # Datos de referencia
    ├── tickets_main.csv
    ├── tickets_cases.json
    └── ...
```

### Dependencias Odoo
- **base**: Framework base de Odoo
- **http_routing**: Enrutamiento HTTP para API
- **mail**: Chatter, actividades y seguimiento

### Dependencias Python
- **openai>=1.0.0**: Cliente oficial de OpenAI

---

## Modelos de Datos