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

    const systemPrompt = 'Eres un asistente que analiza tickets de soporte y determina su prioridad. Siempre respondes en formato JSON válido, basándote en el esquema proporcionado. Tus explicaciones deben ser concisas, máximo 200 caracteres.';

    const userPrompt = `Analiza el siguiente ticket de soporte y determina su prioridad (alta, media o baja) y proporciona una explicación MUY BREVE (máximo 200 caracteres).

Título: ${titulo}
Descripción: ${descripcion}

¡ORA ORA! Analiza esto con la velocidad de Star Platinum y sé conciso.`;

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