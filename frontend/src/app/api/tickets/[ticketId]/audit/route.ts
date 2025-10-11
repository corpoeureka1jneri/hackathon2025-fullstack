import { NextRequest, NextResponse } from 'next/server';
import { auditStore, AuditEntry } from '../../_auditStore';

const ODOO_API_BASE = process.env.NEXT_PUBLIC_ODOO_API_URL || 'http://localhost:8069/api/support';

type RouteParams = {
  ticketId: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const resolvedParams = await params;
    const ticketIdRaw = resolvedParams.ticketId;
    const ticketId = Number.parseInt(ticketIdRaw, 10);

    if (!Number.isFinite(ticketId)) {
      return NextResponse.json(
        { success: false, error: "El parámetro 'ticketId' debe ser numérico" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const changeType = searchParams.get('type');

    // Try to fetch from Odoo backend
    let odooLogs: AuditEntry[] = [];
    try {
      console.log(`Fetching audit logs from Odoo for ticket ${ticketId}`);
      const odooUrl = `${ODOO_API_BASE}/ticket/${ticketId}/audit`;
      const odooResponse = await fetch(odooUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (odooResponse.ok) {
        const odooData = await odooResponse.json();
        const result = odooData.result || odooData;
        
        // Odoo puede devolver 'audit' o 'logs'
        const rawLogs = result.audit || result.logs || [];
        
        // Normalizar estructura de Odoo al formato esperado por el frontend
        odooLogs = Array.isArray(rawLogs) ? rawLogs.map((log: any) => ({
          id: log.id ? `audit_${log.id}` : log.id,
          ticketId: log.ticketId || ticketId,
          timestamp: log.timestamp || new Date().toISOString(),
          changeType: log.changeType === 'create' ? 'estado' : (log.changeType || 'estado'),
          fieldChanged: log.fieldName || log.fieldChanged || 'estado',
          oldValue: log.oldValue || '',
          newValue: log.newValue || '',
          changedBy: log.userName || log.changedBy || 'system',
        })) : [];
        
        console.log(`Received ${odooLogs.length} audit logs from Odoo`);
      } else {
        console.warn(`Odoo audit endpoint returned ${odooResponse.status}, falling back to local store`);
      }
    } catch (odooError) {
      console.warn('Could not fetch audit logs from Odoo, using local store:', odooError);
    }

    // Combine with local store logs (in-memory changes not yet synced)
    const localLogs = auditStore.getLogs(ticketId);
    
    // Merge and deduplicate logs by id
    const allLogsMap = new Map();
    [...odooLogs, ...localLogs].forEach(log => {
      allLogsMap.set(log.id, log);
    });
    
    let logs = Array.from(allLogsMap.values());

    // Filter by change type if specified
    if (changeType === 'estado' || changeType === 'prioridad') {
      logs = logs.filter((log) => log.changeType === changeType);
    }

    // Sort by timestamp descending (most recent first)
    const sortedLogs = [...logs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      ticketId,
      logs: sortedLogs,
      count: sortedLogs.length,
      source: odooLogs.length > 0 ? 'odoo+local' : 'local',
    });
  } catch (error) {
    console.error('Error fetching ticket audit logs:', error);
    const message =
      error instanceof Error ? error.message : 'Error al obtener el registro de auditoría del ticket';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
