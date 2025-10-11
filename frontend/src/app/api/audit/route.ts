import { NextRequest, NextResponse } from 'next/server';
import { auditStore, AuditEntry } from '../tickets/_auditStore';

const ODOO_API_BASE = process.env.NEXT_PUBLIC_ODOO_API_URL || 'http://localhost:8069/api/support';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketIdParam = searchParams.get('ticketId');
    
    let logs;
    
    if (ticketIdParam) {
      const ticketId = parseInt(ticketIdParam, 10);
      if (isNaN(ticketId)) {
        return NextResponse.json(
          { success: false, error: 'ticketId debe ser un número válido' },
          { status: 400 }
        );
      }
      
      // Fetch from specific ticket audit endpoint
      let odooLogs: AuditEntry[] = [];
      try {
        console.log(`Fetching audit logs from Odoo for ticket ${ticketId}`);
        const odooResponse = await fetch(`${ODOO_API_BASE}/ticket/${ticketId}/audit`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (odooResponse.ok) {
          const odooData = await odooResponse.json();
          const result = odooData.result || odooData;
          
          // Odoo puede devolver 'audit' o 'logs'
          const rawLogs = result.audit || result.logs || [];
          
          // Normalizar estructura de Odoo al formato esperado
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
        }
      } catch (odooError) {
        console.warn('Could not fetch from Odoo, using local store:', odooError);
      }

      const localLogs = auditStore.getLogs(ticketId);
      const allLogsMap = new Map();
      [...odooLogs, ...localLogs].forEach(log => allLogsMap.set(log.id, log));
      logs = Array.from(allLogsMap.values());
      
    } else {
      // Fetch all audit logs from Odoo
      let odooLogs: AuditEntry[] = [];
      try {
        console.log('Fetching all audit logs from Odoo');
        const odooResponse = await fetch(`${ODOO_API_BASE}/audit`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (odooResponse.ok) {
          const odooData = await odooResponse.json();
          const result = odooData.result || odooData;
          
          // Odoo puede devolver 'audit' o 'logs'
          const rawLogs = result.audit || result.logs || [];
          
          // Normalizar estructura de Odoo al formato esperado
          odooLogs = Array.isArray(rawLogs) ? rawLogs.map((log: any) => ({
            id: log.id ? `audit_${log.id}` : log.id,
            ticketId: log.ticketId,
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

      const localLogs = auditStore.getAllLogs();
      const allLogsMap = new Map();
      [...odooLogs, ...localLogs].forEach(log => allLogsMap.set(log.id, log));
      logs = Array.from(allLogsMap.values());
    }

    // Sort by timestamp descending
    const sortedLogs = [...logs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      logs: sortedLogs,
      count: sortedLogs.length,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener los registros de auditoría' },
      { status: 500 }
    );
  }
}
