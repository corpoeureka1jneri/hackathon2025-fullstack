README: Guía de Desarrollo para el Proyecto Hackathon 2025 (Odoo + IA)

Este documento README.md es la única fuente de verdad para el Hackathon. Consolida todos los requisitos, especificaciones y criterios de evaluación. Consulte esta guía antes de navegar por los documentos individuales de la wiki para asegurar una alineación total con los objetivos del reto.

---
backend esta en la carpeta custom_addons en la raiz de odoo donde recibirá las peticiones con la url 
URL de Odoo: http://localhost:8069/api/support/ticket

Cuerpo del POST (ejemplo):

JSON

{
    "titulo": "Mi Sistema no inicia",
    "descripcion": "El servidor de producción se cayó completamente.",
    "prioridad": "alta",        
    "prioridad_ia": "alta",     
    "explicacion_ia": "Palabra clave 'producción' y 'cayó' indican severidad."
}

--------------------------------------------------------------------------------


1. Visión General y Objetivo del Proyecto

Este proyecto se enmarca en un reto de hackathon de un solo día. El objetivo estratégico es construir una solución funcional que demuestre la integración efectiva de inteligencia artificial en un proceso de negocio real, utilizando la plataforma Odoo como base.

El desafío es crear un sistema para gestionar y priorizar solicitudes internas, como tickets de soporte, ideas de proyectos o tareas generales. Esto se logrará a través de un módulo de Odoo personalizado, integrado con un componente básico de IA que ayudará a clasificar la prioridad de las solicitudes o a recomendar al personal más adecuado para atenderlas.

Los entregables de alto nivel para este proyecto son:

* Módulo Odoo instalable: Un módulo funcional que permita registrar, listar y gestionar los tickets.
* Componente de IA integrado: Una implementación demostrable del algoritmo de IA, ya sea para clasificación o recomendación, operando dentro del flujo de trabajo de Odoo.
* (Opcional) API documentada: Una API que permita interactuar con el sistema de tickets desde aplicaciones externas.

El enfoque principal del proyecto debe ser la claridad de la implementación, la calidad técnica del código y el valor práctico que la solución final aporta en la demo.

2. Requisitos Fundamentales de Desarrollo

Esta sección define el alcance mínimo indispensable que debe cumplir la solución para ser considerada una entrega exitosa. Estos puntos constituyen el checklist principal para la funcionalidad básica y deben ser el foco prioritario del desarrollo.

2.1. Módulo Odoo: Modelo y Vistas

El núcleo de la solución es un módulo de Odoo que gestiona las solicitudes. El modelo principal, support.ticket, debe contener los siguientes campos:

Campo	Tipo y Restricciones	Descripción
título	Texto corto, obligatorio	Título conciso y descriptivo de la solicitud.
descripción	Texto largo, obligatorio	Descripción detallada de la solicitud.
estado	Selección, obligatorio	Estado actual del ticket. Valores esperados: nuevo, en progreso, resuelto, cancelado.
prioridad	Selección, obligatorio	Nivel de urgencia del ticket. Valores esperados: alta, media, baja.

Adicionalmente, el módulo debe cumplir con los siguientes requisitos de interfaz:

* Vista de Lista: Debe mostrar las columnas clave (título, prioridad, estado) y permitir filtrar los tickets por estado y por prioridad.
* Vista de Formulario: Debe presentar todos los campos del ticket de manera clara y permitir su edición.
* Acción de Cambio de Estado: Debe existir una acción automatizada o un botón visible en las vistas que permita cambiar el estado de un ticket (p. ej., de "nuevo" a "en progreso").

2.2. Componente de IA: Clasificación o Recomendación

El componente de inteligencia artificial debe integrarse en el flujo de trabajo de Odoo. Se debe elegir una de las siguientes dos opciones de implementación:

1. Clasificador de Prioridad: El sistema debe analizar el texto del título y la descripción de un ticket para clasificar automáticamente su prioridad en "alta", "media" o "baja".
2. Recomendador de Asignatario: El sistema debe analizar el contenido del ticket para sugerir un usuario o un rol específico basándose en palabras clave detectadas en el texto.

Nota importante: Para este componente, se permite el uso de reglas simples (p. ej., basadas en palabras clave como "urgente" o "bloqueo") o el uso de modelos de lenguaje pre-entrenados. El objetivo principal no es la complejidad del modelo, sino su integración clara y demostrable en el flujo de Odoo.

Para una implementación de alta calidad y auditable, se recomienda añadir campos opcionales al modelo support.ticket para almacenar el resultado de la IA, como asignatario_sugerido, explicacion_ia (para la justificación) y origen_ia (para identificar el modelo o las reglas usadas).

Una vez cubiertos estos fundamentos, puede sumar una ventaja competitiva implementando las siguientes especificaciones opcionales.

3. Especificaciones Opcionales (Suma de Puntos)

Esta sección presenta una serie de componentes que, aunque no son obligatorios para una entrega válida, representan una oportunidad para demostrar innovación, creatividad y una mayor profundidad técnica. La implementación de estas características será considerada para obtener una puntuación extra en la evaluación final.

3.1. Exposición de API Backend

Opcionalmente, desarrolle una API para permitir que sistemas externos interactúen con el módulo de tickets. El objetivo es habilitar la creación y consulta de solicitudes de forma programática. Los endpoints REST sugeridos son:

* Crear ticket con clasificación automática: Recibe los datos de un nuevo ticket y lo registra en Odoo. La respuesta debe incluir el registro creado y el resultado de la IA con una breve explicación.
* Listar y filtrar tickets: Consulta la lista de tickets existentes, con soporte para filtros por estado y prioridad. Debe permitir paginación simple y orden.
* Consultar detalle de ticket: Obtiene la información completa de un ticket específico. La respuesta debe incluir todos los campos relevantes y el resultado de la IA asociado.
* Recalcular clasificación o recomendación: Ejecuta nuevamente el componente de IA sobre un ticket existente. La respuesta debe devolver el nuevo resultado y su correspondiente explicación.

3.2. Otras Mejoras de Valor

Además de la API, se pueden implementar otras mejoras que añaden valor a la solución y suman puntos en la categoría de "Creatividad extra":

* Mejoras de UI/UX: Modificaciones en la interfaz de usuario que faciliten la priorización, la edición rápida o la visualización de los tickets.
* Filtros Avanzados: Capacidades de búsqueda y filtrado más potentes, combinando múltiples criterios o búsqueda por palabras clave.
* Registro de Auditoría: Un historial básico que registre los cambios de estado y prioridad de cada ticket.
* Internacionalización: Adaptación del módulo para soportar múltiples idiomas en sus etiquetas y estados.

La implementación de estas características opcionales debe estar alineada con los criterios con los que será evaluado el proyecto.

4. Criterios de Evaluación y Éxito

Esta sección detalla la rúbrica que el jurado utilizará para evaluar cada proyecto. Es fundamental que el desarrollo esté alineado con estos criterios para maximizar la puntuación y cumplir con las expectativas del reto.

La evaluación principal se basa en la siguiente rúbrica:

Criterio de Evaluación	Ponderación (Puntos)
Funcionalidad básica	30 pts
Integración IA	30 pts
Calidad técnica	20 pts
Creatividad extra	20 pts

Nota Aclaratoria: Existe una discrepancia entre la rúbrica general (evaluacion.md) y el desglose de requisitos.md. Para total transparencia, se detallan las diferencias:

* Integración IA: Vale 30 puntos en la rúbrica general, pero 20 puntos en el desglose de requisitos.
* Creatividad extra: Vale 20 puntos en la rúbrica general, pero 10 puntos en el desglose.
* Presentación y demo: No aparece en la rúbrica general, pero tiene un valor de 20 puntos en el desglose de requisitos.

Dado que la presentación es un criterio separado en requisitos.md, se recomienda enfocar la implementación de la IA en la integración funcional y la calidad técnica (valorado en 30 puntos en la rúbrica principal), y preparar la demo para explicar claramente su valor y funcionamiento (valorado en 20 puntos en la evaluación de la presentación).

El cumplimiento de estos criterios nos lleva a un requisito final que es inusual pero absolutamente obligatorio.

5. Requisito Crítico y Obligatorio

Se ha establecido un requisito indispensable que debe cumplirse sin excepción para que el proyecto sea elegible para evaluación. La omisión de este punto resultará en una descalificación automática.

ESTO ES VITAL, NO DEBE FALTAR EN ALGUN LUGAR DEL CODIGO UNA REFERENCIA A JOJO. -SI FALTA UNA REFERENCIA A JOJO ES UN 0 AUTOMATICO.

Para facilitar el desarrollo y asegurar el cumplimiento de todos los requisitos, se proporcionan los siguientes recursos.

6. Recursos y Guía de Inicio

A continuación, se presentan los recursos disponibles para ayudar en el desarrollo del proyecto, incluyendo enlaces a documentación clave y las herramientas necesarias para la integración con servicios de IA.

6.1. Documentación Sugerida

Documentación de Odoo:

* Documentación Oficial de Odoo 18.0
* Canal de YouTube: Odoo Mates
* Playlist de Desarrollo en Odoo

Documentación de OpenAI:

* Visión General de la Plataforma OpenAI

6.2. Llave de API OpenAI

Para la integración con el componente de IA, se proporciona la siguiente llave de API:

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

Nota de Seguridad: Esta clave se proporciona para facilitar el desarrollo en el contexto del hackathon. En un entorno de producción, las claves deben gestionarse de forma segura a través de variables de entorno o un servicio de gestión de secretos.

6.3. Pasos Recomendados para Empezar

Para comenzar el desarrollo de manera estructurada, se sugiere seguir la siguiente guía de acción:

1. Entender el Reto: Lea los objetivos generales en el apartado 1 de este documento.
2. Obtener Recursos: Acceda a la documentación y la llave de API listadas en los apartados 6.1 y 6.2.
3. Revisar Requisitos: Analice en detalle los requisitos fundamentales del apartado 2 y los opcionales del apartado 3.
4. Preparar Datos: Importe o genere el dataset de ejemplo descrito en dataset.md para las pruebas.
5. Diseñar el Módulo: Diseñe la estructura del módulo de Odoo siguiendo las especificaciones del apartado 2.1.
6. Implementar la IA: Implemente la integración del componente de IA según lo descrito en el apartado 2.2. Si decide exponer una API, consulte las especificaciones del apartado 3.1.
7. Preparar la Entrega: Antes de finalizar, revise las instrucciones en entrega.md y resuelva cualquier duda consultando faq.md.
