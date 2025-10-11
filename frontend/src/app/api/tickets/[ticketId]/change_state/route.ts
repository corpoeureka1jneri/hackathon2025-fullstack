import { NextRequest, NextResponse } from 'next/server';
import { auditStore } from '../../_auditStore';

const ODOO_API_BASE = process.env.NEXT_PUBLIC_ODOO_API_URL || 'http://localhost:8069/api/support';

const VALID_STATES = new Set(['nuevo', 'en_progreso', 'resuelto', 'cancelado']);

type ChangeStateParams = {
  ticketId: string;
};

type JsonRpcBody = {
  params?: {
    estado?: unknown;
  };
  estado?: unknown;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<ChangeStateParams> }
) {
  const resolvedParams = await params;
  const ticketIdRaw = resolvedParams.ticketId;
  const ticketId = Number.parseInt(ticketIdRaw, 10);

  if (!Number.isFinite(ticketId)) {
    return NextResponse.json(
      { success: false, error: "El parámetro 'ticketId' debe ser numérico" },
      { status: 400 }
    );
  }

  let estado: string | undefined;

  try {
    const body = (await request.json()) as JsonRpcBody;
    const estadoCandidate = body.estado ?? body.params?.estado;

    if (typeof estadoCandidate === 'string') {
      estado = estadoCandidate;
    }
  } catch (error) {
    console.error('Error parsing request body for change_state:', error);
    return NextResponse.json(
      { success: false, error: 'Cuerpo JSON inválido' },
      { status: 400 }
    );
  }

  if (!estado) {
    return NextResponse.json(
      { success: false, error: "El campo 'estado' es requerido" },
      { status: 400 }
    );
  }

  if (!VALID_STATES.has(estado)) {
    return NextResponse.json(
      {
        success: false,
        error: `Estado inválido. Valores permitidos: ${Array.from(VALID_STATES).join(', ')}`,
      },
      { status: 400 }
    );
  }

  const endpointUrl = `${ODOO_API_BASE}/ticket/${ticketId}/change_state`;

  try {
    console.log('Changing ticket state at:', endpointUrl);
    console.log('Request body:', { estado });

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ estado }),
    });

    console.log('Change state response status:', response.status);

    const responseText = await response.text();

    if (!response.ok) {
      console.error('Change state error response:', responseText);

      let errorPayload: unknown;
      try {
        errorPayload = JSON.parse(responseText);
      } catch {
        errorPayload = responseText;
      }

      return NextResponse.json(
        {
          success: false,
          error:
            typeof errorPayload === 'object' && errorPayload !== null
              ? (errorPayload as { error?: string; message?: string }).error ||
                (errorPayload as { message?: string }).message ||
                'Error al actualizar el estado del ticket'
              : String(errorPayload),
        },
        { status: response.status }
      );
    }

    let data: any = {};
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        console.error('Error parsing change state response JSON:', error);
        return NextResponse.json(
          { success: false, error: 'Respuesta JSON inválida desde Odoo' },
          { status: 500 }
        );
      }
    }

    const result = data.result || data;

    if (result?.error) {
      console.error('Odoo change state returned error:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error.message || 'Error en el backend de Odoo',
        },
        { status: 500 }
      );
    }

    // Log the state change to audit store
    const estadoAnterior = result.estado_anterior || 'desconocido';
    auditStore.addLog({
      ticketId,
      changeType: 'estado',
      fieldChanged: 'estado',
      oldValue: estadoAnterior,
      newValue: estado,
      changedBy: 'system', // Could be extracted from auth headers
    });

    return NextResponse.json({
      success: true,
      ticket: {
        id: result.id ?? ticketId,
        titulo: result.titulo,
        estadoAnterior: estadoAnterior,
        estadoActual: result.estado_actual ?? estado,
      },
      message: result.message || 'Estado del ticket actualizado exitosamente.',
    });
  } catch (error) {
    console.error('Unexpected error changing ticket state:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
