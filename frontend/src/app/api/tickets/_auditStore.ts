// In-memory audit log store
// This tracks all state and priority changes for tickets

export interface AuditEntry {
  id: string;
  ticketId: number;
  timestamp: string;
  changeType: 'estado' | 'prioridad';
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  changedBy?: string;
}

class AuditStore {
  private logs: AuditEntry[] = [];
  private nextId = 1;

  addLog(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
    const auditEntry: AuditEntry = {
      ...entry,
      id: `audit_${this.nextId++}`,
      timestamp: new Date().toISOString(),
    };
    this.logs.push(auditEntry);
    return auditEntry;
  }

  getLogs(ticketId?: number): AuditEntry[] {
    if (ticketId !== undefined) {
      return this.logs.filter(log => log.ticketId === ticketId);
    }
    return [...this.logs];
  }

  getAllLogs(): AuditEntry[] {
    return [...this.logs].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  clearLogs(): void {
    this.logs = [];
    this.nextId = 1;
  }
}

// Singleton instance
export const auditStore = new AuditStore();
