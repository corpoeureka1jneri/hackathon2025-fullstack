import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AlertCircle, Clock, CheckCircle, XCircle, Tag, User, Bot } from 'lucide-react';
import type { Ticket } from '@/types/ticket';
import { useAuth } from '@/contexts/auth-context';

interface TicketCardProps {
  ticket: Ticket;
  onStatusChange?: (ticketId: number, newStatus: Ticket['estado']) => void;
  isUpdating?: boolean;
}

const priorityConfig = {
  alta: { variant: 'destructive' as const, label: 'Alta' },
  media: { variant: 'warning' as const, label: 'Media' },
  baja: { variant: 'secondary' as const, label: 'Baja' },
};

const statusConfig = {
  nuevo: { icon: AlertCircle, variant: 'info' as const, label: 'Nuevo' },
  'en progreso': { icon: Clock, variant: 'warning' as const, label: 'En Progreso' },
  resuelto: { icon: CheckCircle, variant: 'success' as const, label: 'Resuelto' },
  cancelado: { icon: XCircle, variant: 'secondary' as const, label: 'Cancelado' },
};

export function TicketCard({ ticket, onStatusChange, isUpdating }: TicketCardProps) {
  const { user } = useAuth();
  const StatusIcon = statusConfig[ticket.estado].icon;
  const isAdmin = user?.role === 'admin';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{ticket.titulo}</CardTitle>
          <Badge variant={priorityConfig[ticket.prioridad].variant}>
            {priorityConfig[ticket.prioridad].label}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          <StatusIcon className="h-4 w-4" />
          {statusConfig[ticket.estado].label}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {ticket.descripcion}
        </p>
        
        {/* Etiquetas */}
        {ticket.etiquetas && ticket.etiquetas.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {ticket.etiquetas.map((etiqueta, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {etiqueta}
              </Badge>
            ))}
          </div>
        )}

        {/* Asignatario */}
        {ticket.asignatario && (
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{ticket.asignatario}</span>
          </div>
        )}

        {/* Análisis IA */}
        {ticket.explicacion_ia && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="h-4 w-4" />
              <p className="text-xs font-semibold">
                Análisis IA
                {ticket.origen_ia && (
                  <span className="ml-2 text-muted-foreground font-normal">
                    ({ticket.origen_ia === 'openai' ? 'OpenAI' : ticket.origen_ia === 'reglas' ? 'Reglas' : 'Manual'})
                  </span>
                )}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">{ticket.explicacion_ia}</p>
            {ticket.prioridad_ia && ticket.prioridad_ia !== ticket.prioridad && (
              <p className="text-xs text-muted-foreground mt-1">
                Prioridad sugerida: <Badge variant={priorityConfig[ticket.prioridad_ia].variant} className="ml-1">
                  {priorityConfig[ticket.prioridad_ia].label}
                </Badge>
              </p>
            )}
          </div>
        )}
      </CardContent>
      {isAdmin && onStatusChange && ticket.id && (
        <CardFooter className="gap-2">
          {ticket.estado === 'nuevo' && (
            <Button 
              size="sm" 
              onClick={() => onStatusChange(ticket.id!, 'en progreso')}
              disabled={isUpdating}
            >
              Iniciar
            </Button>
          )}
          {ticket.estado === 'en progreso' && (
            <>
              <Button 
                size="sm" 
                onClick={() => onStatusChange(ticket.id!, 'resuelto')}
                disabled={isUpdating}
              >
                Resolver
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onStatusChange(ticket.id!, 'cancelado')}
                disabled={isUpdating}
              >
                Cancelar
              </Button>
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
