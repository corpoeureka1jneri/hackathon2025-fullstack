"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, History, ArrowRight, Search, RefreshCw, FileText } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';

interface AuditEntry {
  id: string;
  ticketId: number;
  timestamp: string;
  changeType: 'estado' | 'prioridad';
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  changedBy?: string;
}

export default function AuditoriaPage() {
  const { isAuthenticated } = useAuth();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTicketId, setSearchTicketId] = useState('');
  const [filteredLogs, setFilteredLogs] = useState<AuditEntry[]>([]);

  const fetchAuditLogs = async (ticketId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const normalizedTicketId = ticketId?.trim();

      let url = '/api/audit';
      if (normalizedTicketId) {
        url = `/api/tickets/${normalizedTicketId}/audit`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al cargar los registros de auditoría');
      }

      const fetchedLogs: AuditEntry[] = Array.isArray(data.logs) ? data.logs : [];

      setLogs(fetchedLogs);
      setFilteredLogs(fetchedLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAuditLogs();
    }
  }, [isAuthenticated]);

  const handleSearch = () => {
    if (searchTicketId.trim()) {
      fetchAuditLogs(searchTicketId.trim());
    } else {
      fetchAuditLogs();
    }
  };

  const handleClearSearch = () => {
    setSearchTicketId('');
    fetchAuditLogs();
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('es', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const getChangeTypeBadge = (changeType: string) => {
    if (changeType === 'estado') {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Estado</Badge>;
    }
    return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Prioridad</Badge>;
  };

  const getValueBadge = (value: string, isOld: boolean = false) => {
    const baseClasses = isOld ? 'opacity-60' : '';
    
    // Estado badges
    if (['nuevo', 'en_progreso', 'resuelto', 'cancelado'].includes(value)) {
      const stateColors: Record<string, string> = {
        nuevo: 'bg-gray-100 text-gray-700',
        en_progreso: 'bg-blue-100 text-blue-700',
        resuelto: 'bg-green-100 text-green-700',
        cancelado: 'bg-red-100 text-red-700',
      };
      return <Badge className={`${stateColors[value] || ''} ${baseClasses}`}>{value.replace('_', ' ')}</Badge>;
    }
    
    // Prioridad badges
    if (['alta', 'media', 'baja'].includes(value)) {
      const priorityColors: Record<string, string> = {
        alta: 'bg-red-100 text-red-700',
        media: 'bg-yellow-100 text-yellow-700',
        baja: 'bg-green-100 text-green-700',
      };
      return <Badge className={`${priorityColors[value] || ''} ${baseClasses}`}>{value}</Badge>;
    }
    
    return <Badge variant="secondary" className={baseClasses}>{value}</Badge>;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Acceso Restringido</CardTitle>
            <CardDescription>Debes iniciar sesión para ver el registro de auditoría</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">Ir al inicio</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <History className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight">
                Registro de Auditoría
              </h1>
            </div>
            <Link href="/">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Ver Tickets
              </Button>
            </Link>
          </div>
          <p className="text-muted-foreground">
            Historial completo de cambios de estado y prioridad de tickets
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="flex-1 flex gap-2">
                <Input
                  type="number"
                  placeholder="Buscar por ID de ticket..."
                  value={searchTicketId}
                  onChange={(e) => setSearchTicketId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} variant="default">
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
              </div>
              <Button onClick={handleClearSearch} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total de Cambios</CardDescription>
              <CardTitle className="text-3xl">{filteredLogs.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Cambios de Estado</CardDescription>
              <CardTitle className="text-3xl">
                {filteredLogs.filter(log => log.changeType === 'estado').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Cambios de Prioridad</CardDescription>
              <CardTitle className="text-3xl">
                {filteredLogs.filter(log => log.changeType === 'prioridad').length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Audit Logs */}
        {error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
              <Button onClick={() => fetchAuditLogs()} className="mt-4" variant="outline">
                Reintentar
              </Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay registros de auditoría</h3>
              <p className="text-muted-foreground">
                {searchTicketId 
                  ? 'No se encontraron cambios para este ticket'
                  : 'Los cambios de estado y prioridad aparecerán aquí'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <Card key={log.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="font-mono">
                          Ticket #{log.ticketId}
                        </Badge>
                        {getChangeTypeBadge(log.changeType)}
                        <span className="text-sm text-muted-foreground">
                          {formatDate(log.timestamp)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-2">
                          {getValueBadge(log.oldValue, true)}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div className="flex items-center gap-2">
                          {getValueBadge(log.newValue)}
                        </div>
                      </div>

                      {log.changedBy && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Modificado por: {log.changedBy}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 py-6 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Hackathon 2025 - Registro de Auditoría • Powered by Next.js</p>
        </div>
      </footer>
    </div>
  );
}
