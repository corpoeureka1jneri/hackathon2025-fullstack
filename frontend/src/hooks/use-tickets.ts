import { useState, useEffect } from 'react';
import type { Ticket, TicketPriority, TicketStatus } from '@/types/ticket';
import { useAuth } from '@/contexts/auth-context';

const STATUS_TO_API: Record<TicketStatus, string> = {
  nuevo: 'nuevo',
  'en progreso': 'en_progreso',
  resuelto: 'resuelto',
  cancelado: 'cancelado',
};

const apiStatusToClient = (status: string): TicketStatus => {
  const normalized = status.replace('_', ' ');
  if ((Object.keys(STATUS_TO_API) as TicketStatus[]).includes(normalized as TicketStatus)) {
    return normalized as TicketStatus;
  }
  if ((Object.keys(STATUS_TO_API) as TicketStatus[]).includes(status as TicketStatus)) {
    return status as TicketStatus;
  }
  return 'nuevo';
};

export function useTickets(
  estadoFilter: TicketStatus | 'todos',
  prioridadFilter: TicketPriority | 'todos'
) {
  const { isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingTicketIds, setUpdatingTicketIds] = useState<number[]>([]);

  const fetchTickets = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (estadoFilter !== 'todos') params.append('estado', estadoFilter);
      if (prioridadFilter !== 'todos') params.append('prioridad', prioridadFilter);

      const response = await fetch(`/api/tickets?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        const normalizedTickets = (data.tickets || []).map((ticket: Ticket) => ({
          ...ticket,
          estado: apiStatusToClient(ticket.estado),
        }));
        setTickets(normalizedTickets);
      } else {
        setError(data.error || 'Error desconocido al cargar tickets');
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError('No se pudo conectar con el servidor. Verifica que Odoo esté corriendo en http://localhost:8069');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (ticketId: number, newStatus: TicketStatus) => {
    if (!isAuthenticated || updatingTicketIds.includes(ticketId)) {
      return;
    }

    setUpdatingTicketIds(prev => [...prev, ticketId]);
    setError(null);

    try {
      const apiEstado = STATUS_TO_API[newStatus] ?? newStatus;
      const response = await fetch(`/api/tickets/${ticketId}/change_state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: apiEstado }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al actualizar el estado del ticket');
      }

      const updatedStatus: TicketStatus = data.ticket?.estadoActual
        ? apiStatusToClient(data.ticket.estadoActual)
        : newStatus;

      setTickets(prev =>
        prev.map(t =>
          t.id === ticketId
            ? { ...t, estado: updatedStatus, titulo: data.ticket?.titulo ?? t.titulo }
            : t
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar el estado del ticket';
      console.error('Error updating ticket status:', err);
      setError(message);
    } finally {
      setUpdatingTicketIds(prev => prev.filter(id => id !== ticketId));
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTickets();
    }
  }, [estadoFilter, prioridadFilter, isAuthenticated]);

  return {
    tickets,
    isLoading,
    error,
    updatingTicketIds,
    fetchTickets,
    handleStatusChange,
  };
}
