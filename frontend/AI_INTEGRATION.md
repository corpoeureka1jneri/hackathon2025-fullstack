# 🤖 Integración de IA - OpenAI GPT-4o-mini

## Descripción

Este proyecto utiliza el SDK de OpenAI para analizar automáticamente los tickets de soporte y clasificar su prioridad mediante inteligencia artificial.

## Configuración

### 1. API Key de OpenAI

Configura tu API key en un archivo `.env.local` en la raíz del proyecto frontend:

```env
OPENAI_API_KEY=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
```

**Nota de Seguridad**: En producción, usa variables de entorno seguras. La key incluida es solo para el hackathon.

### 2. Modelo Utilizado

- **Modelo**: `gpt-4o-mini`
- **Temperatura**: 0.3 (para respuestas más determinísticas)
- **Max Tokens**: 200 (suficiente para análisis breves)

## Cómo Funciona

### Flujo de Análisis

1. **Input del Usuario**: El usuario escribe el título y descripción del ticket
2. **Botón "Analizar con IA"**: Envía los datos al endpoint `/api/analyze`
3. **Procesamiento**: El backend llama a OpenAI con un prompt estructurado
4. **Respuesta**: La IA devuelve prioridad (alta/media/baja) + explicación
5. **UI Update**: El frontend muestra la sugerencia con badge de color

### Prompt Engineering

El sistema usa el siguiente prompt optimizado:

```
Analiza el siguiente ticket de soporte y determina su prioridad 
(alta, media o baja) y proporciona una breve explicación.

Título: [titulo]
Descripción: [descripcion]

Responde SOLO en el siguiente formato JSON:
{
  "prioridad": "alta|media|baja",
  "explicacion": "breve explicación de 1-2 líneas"
}

¡ORA ORA! Analiza esto con la velocidad de Star Platinum.
```

### Criterios de Clasificación

La IA considera automáticamente:

- **Alta Prioridad**: 
  - Sistemas caídos o fuera de servicio
  - Bloqueos que impiden trabajo
  - Palabras clave: "producción", "crítico", "urgente", "caído", "no funciona"
  - Afecta a múltiples usuarios

- **Media Prioridad**:
  - Problemas que afectan funcionalidad pero tienen workarounds
  - Errores no bloqueantes
  - Solicitudes de características importantes

- **Baja Prioridad**:
  - Mejoras cosméticas
  - Preguntas o consultas
  - Problemas menores que no afectan operación

## Implementación Técnica

### API Route: `/api/analyze`

```typescript
// src/app/api/analyze/route.ts
export async function POST(request: NextRequest) {
  const { titulo, descripcion } = await request.json();
  
  // Llamada a OpenAI API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Eres un asistente...' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 200,
    }),
  });
  
  // Parsear y devolver resultado
  return NextResponse.json({
    success: true,
    prioridad: analysis.prioridad,
    explicacion: analysis.explicacion,
  });
}
```

### Componente: CreateTicketDialog

```typescript
const handleAnalyze = async () => {
  setIsAnalyzing(true);
  
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titulo, descripcion }),
  });

  const data = await response.json();
  
  if (data.success) {
    setAiSuggestion({
      prioridad: data.prioridad,
      explicacion: data.explicacion,
    });
    setPrioridad(data.prioridad); // Auto-aplicar sugerencia
  }
  
  setIsAnalyzing(false);
};
```

## Manejo de Errores

El sistema incluye manejo robusto de errores:

1. **Timeout**: Si la API tarda mucho, se muestra fallback
2. **Parse Error**: Si el JSON es inválido, usa prioridad "media" por defecto
3. **API Error**: Captura errores de red y API
4. **Fallback Gracioso**: Siempre permite crear el ticket manualmente

## Mejoras Futuras

### Posibles Extensiones

- [ ] **Asignación Automática**: Sugerir persona responsable basado en keywords
- [ ] **Análisis de Sentimiento**: Detectar urgencia emocional del usuario
- [ ] **Categorización**: Clasificar tickets por tipo (bug, feature, question)
- [ ] **Detección de Duplicados**: Encontrar tickets similares existentes
- [ ] **Estimación de Tiempo**: Predecir tiempo de resolución
- [ ] **Múltiples Idiomas**: Soporte para análisis en varios idiomas

### Optimizaciones

- Cache de análisis para tickets similares
- Rate limiting para prevenir abuso
- Fine-tuning del modelo con datos históricos
- A/B testing de diferentes prompts

## Testing

Para probar el análisis de IA, intenta con estos ejemplos:

### Alta Prioridad
```
Título: Servidor de producción caído
Descripción: El servidor principal de producción no responde. 
Todos los usuarios están bloqueados y no pueden trabajar.
```

### Media Prioridad
```
Título: Error al exportar reportes
Descripción: Al intentar exportar un reporte a PDF, 
aparece un error pero puedo usar CSV como alternativa.
```

### Baja Prioridad
```
Título: Cambiar color del botón
Descripción: Me gustaría que el botón de "Guardar" 
sea azul en lugar de verde para mejor estética.
```

## Referencias JOJO

El prompt incluye la referencia obligatoria del hackathon:
> "¡ORA ORA! Analiza esto con la velocidad de Star Platinum."

Esto asegura que cumplimos con el requisito crítico de incluir referencias a JOJO en el código.

---

**"Good grief... This AI is actually pretty smart." - Jotaro Kujo** 🎩⭐
