import { NextRequest, NextResponse } from 'next/server';

const ODOO_API_BASE = process.env.NEXT_PUBLIC_ODOO_API_URL || 'http://localhost:8069/api/support';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const prioridad = searchParams.get('prioridad');
    const limit = searchParams.get('limit') || '100';
    const offset = searchParams.get('offset') || '0';

    const requestBody = {
      limit: parseInt(limit),
      offset: parseInt(offset),
    };

    console.log('Fetching tickets from:', `${ODOO_API_BASE}/tickets`);
    console.log('Request body:', requestBody);

    // Llamada al endpoint POST /api/support/tickets de Odoo
    const response = await fetch(`${ODOO_API_BASE}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Error al obtener los tickets de Odoo: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Received data:', data);
    
    // Odoo devuelve formato JSON-RPC: {jsonrpc, id, result: {count, records}}
    const result = data.result || data;
    const records = result.records || [];
    const count = result.count || 0;
    
    // Filtrar por estado y prioridad si es necesario
    let filteredRecords = records;
    if (estado && estado !== 'todos') {
      filteredRecords = filteredRecords.filter((t: any) => t.estado === estado);
    }
    if (prioridad && prioridad !== 'todos') {
      filteredRecords = filteredRecords.filter((t: any) => t.prioridad === prioridad);
    }

    return NextResponse.json({ 
      success: true, 
      tickets: filteredRecords,
      count: filteredRecords.length,
      total: count,
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener los tickets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Si no hay análisis de IA, usar valores por defecto
    const prioridad_ia = body.prioridad_ia || body.prioridad;
    const explicacion_ia = body.explicacion_ia || 'Clasificación manual sin análisis de IA';
    const origen_ia = body.origen_ia || 'manual';

    const requestBody: any = {
      titulo: body.titulo,
      descripcion: body.descripcion,
      prioridad: body.prioridad,
      prioridad_ia: prioridad_ia,
      explicacion_ia: explicacion_ia,
      origen_ia: origen_ia,
    };

    // Agregar campos opcionales solo si existen
    if (body.asignatario) {
      requestBody.asignatario = body.asignatario;
    }
    if (body.etiquetas && Array.isArray(body.etiquetas) && body.etiquetas.length > 0) {
      requestBody.etiquetas = body.etiquetas;
    }

    console.log('Creating ticket at:', `${ODOO_API_BASE}/ticket`);
    console.log('Request body:', requestBody);
    
    // Llamada al endpoint POST /api/support/ticket de Odoo
    const response = await fetch(`${ODOO_API_BASE}/ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Create response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Create error response:', errorText);
      throw new Error(`Error al crear el ticket en Odoo: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Create response data:', data);
    
    // Odoo puede devolver formato JSON-RPC: {jsonrpc, id, result: {...}}
    const result = data.result || data;
    
    // Verificar si Odoo devolvió un error en el result
    if (result.error) {
      console.error('Odoo returned error:', result.error);
      throw new Error(result.error.message || 'Error en el backend de Odoo');
    }
    
    return NextResponse.json({ 
      success: true, 
      ticket: {
        id: result.id,
        titulo: body.titulo,
        descripcion: body.descripcion,
        prioridad: result.prioridad_final || body.prioridad,
        estado: 'nuevo',
        prioridad_ia: prioridad_ia,
        explicacion_ia: explicacion_ia,
        origen_ia: result.origen_ia || origen_ia,
        asignatario: result.asignatario || body.asignatario,
        etiquetas: result.etiquetas || body.etiquetas,
      },
      message: result.message,
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al crear el ticket';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
