import { NextRequest, NextResponse } from 'next/server';
// 1. Importar las funciones necesarias del AI SDK y el proveedor de OpenAI
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
// 2. Importar Zod para definir el esquema JSON de salida
import { z } from 'zod';

// La clave de API de OpenAI se sigue tomando automáticamente de las variables de entorno
// const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Ya no es necesario definirla aquí

// 3. Definir el esquema del objeto de respuesta con Zod
const AnalisisSchema = z.object({
  prioridad: z.enum(['alta', 'media', 'baja']).describe('Prioridad del ticket de soporte'),
  explicacion: z.string().max(200).describe('Breve explicación de 1-2 líneas sobre la prioridad'),
});

export async function POST(request: NextRequest) {
  let titulo = '';
  let descripcion = '';

  try {
    const body = await request.json();
    titulo = body.titulo || '';
    descripcion = body.descripcion || '';

    const systemPrompt = `Eres un analista de soporte técnico EXTREMADAMENTE EXIGENTE y crítico. Tu trabajo es evaluar tickets con escepticismo profesional.

REGLAS ESTRICTAS PARA ASIGNAR PRIORIDAD:

PRIORIDAD ALTA (úsala RARAMENTE, solo ~5% de casos):
- Sistema completamente caído afectando a TODOS los usuarios
- Pérdida activa de datos o corrupción de base de datos
- Brecha de seguridad crítica confirmada
- Imposibilidad total de operar el negocio (no solo inconveniente)

PRIORIDAD MEDIA (úsala con moderación, ~25% de casos):
- Funcionalidad importante afectada pero hay workarounds
- Afecta a un grupo específico de usuarios, no a todos
- Bug que impacta flujo de trabajo pero no detiene operaciones
- Error recurrente con impacto medible en productividad

PRIORIDAD BAJA (tu opción por defecto, ~70% de casos):
- Solicitudes de mejora o nuevas funcionalidades
- Problemas cosméticos o de UI/UX
- Errores menores con workarounds fáciles
- Dudas, preguntas o solicitudes de información
- Cualquier cosa que el usuario DICE que es "urgente" sin evidencia objetiva

IGNORA COMPLETAMENTE:
- Palabras como "urgente", "crítico", "inmediato" en la descripción del usuario
- Tono emocional o exagerado del cliente
- Presión artificial o deadlines auto-impuestos

EVALÚA SOLO:
- Impacto técnico real y medible
- Número de usuarios afectados
- Disponibilidad de workarounds
- Riesgo para datos o seguridad

Sé ESCÉPTICO. La mayoría de tickets NO son urgentes. Siempre respondes en JSON válido con explicaciones concisas (máximo 200 caracteres).`;

    const userPrompt = `Analiza este ticket con CRITERIO ESTRICTO. No te dejes influenciar por el lenguaje emocional del usuario. Evalúa solo el impacto técnico objetivo:

Título: ${titulo}
Descripción: ${descripcion}

Determina la prioridad REAL (no la que el usuario cree que tiene) y explica tu razonamiento en máximo 200 caracteres.`;

    // 4. Usar generateObject con gpt-4o-mini (soporta json_schema)
    const { object: analysis } = await generateObject({
      model: openai('gpt-4o-mini'), // gpt-4o-mini soporta structured outputs
      schema: AnalisisSchema,       // Especificar el esquema Zod para la respuesta JSON
      system: systemPrompt,         // Pasar el rol de sistema
      prompt: userPrompt,           // Pasar la instrucción del usuario
      temperature: 0.3,             // Configurar temperatura directamente
    });

    // 5. El objeto 'analysis' ya está garantizado por el SDK para ser un JSON válido que coincide con AnalisisSchema
    return NextResponse.json({
      success: true,
      prioridad: analysis.prioridad,
      explicacion: analysis.explicacion,
    });

  } catch (error) {
    console.error('Error analyzing ticket with AI SDK:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      titulo,
      descripcion
    });
    // 6. Manejo de errores más limpio
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al analizar el ticket (AI SDK falló)',
        prioridad: 'media' as 'media', // Usar 'as' para tipado si es necesario en TypeScript
        explicacion: 'Análisis no disponible'
      },
      { status: 500 }
    );
  }
}