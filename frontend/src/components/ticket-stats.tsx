import type { Ticket } from '@/types/ticket';

interface TicketStatsProps {
  tickets: Ticket[];
}

export function TicketStats({ tickets }: TicketStatsProps) {
  const stats = {
    total: tickets.length,
    nuevo: tickets.filter(t => t.estado === 'nuevo').length,
    enProgreso: tickets.filter(t => t.estado === 'en progreso').length,
    alta: tickets.filter(t => t.prioridad === 'alta').length,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="p-4 bg-card rounded-lg border">
        <p className="text-sm text-muted-foreground mb-1">Total</p>
        <p className="text-3xl font-bold">{stats.total}</p>
      </div>
      <div className="p-4 bg-card rounded-lg border">
        <p className="text-sm text-muted-foreground mb-1">Nuevos</p>
        <p className="text-3xl font-bold text-blue-500">{stats.nuevo}</p>
      </div>
      <div className="p-4 bg-card rounded-lg border">
        <p className="text-sm text-muted-foreground mb-1">En Progreso</p>
        <p className="text-3xl font-bold text-yellow-500">{stats.enProgreso}</p>
      </div>
      <div className="p-4 bg-card rounded-lg border">
        <p className="text-sm text-muted-foreground mb-1">Alta Prioridad</p>
        <p className="text-3xl font-bold text-red-500">{stats.alta}</p>
      </div>
    </div>
  );
}
