"use client"

import { useState, useEffect } from 'react';
import { TicketCard } from '@/components/ticket-card';
import { CreateTicketDialog } from '@/components/create-ticket-dialog';
import { TicketFilters } from '@/components/ticket-filters';
import { Badge } from '@/components/ui/badge';
import { Loader2, Ticket as TicketIcon } from 'lucide-react';
import type { Ticket, TicketPriority, TicketStatus } from '@/types/ticket';

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<TicketStatus | 'todos'>('todos');
  const [prioridadFilter, setPrioridadFilter] = useState<TicketPriority | 'todos'>('todos');

  const fetchTickets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (estadoFilter !== 'todos') params.append('estado', estadoFilter);
      if (prioridadFilter !== 'todos') params.append('prioridad', prioridadFilter);

      console.log('Fetching tickets from frontend...');
      const response = await fetch(`/api/tickets?${params.toString()}`);
      const data = await response.json();
      
      console.log('Frontend received:', data);
      
      if (data.success) {
        setTickets(data.tickets || []);
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

  useEffect(() => {
    fetchTickets();
  }, [estadoFilter, prioridadFilter]);

  const handleStatusChange = async (ticketId: number, newStatus: TicketStatus) => {
    // Aquí iría la lógica para actualizar el estado en el backend
    console.log(`Updating ticket ${ticketId} to ${newStatus}`);
    // Por ahora, solo actualizamos localmente
    setTickets(prev => 
      prev.map(t => t.id === ticketId ? { ...t, estado: newStatus } : t)
    );
  };

  const clearFilters = () => {
    setEstadoFilter('todos');
    setPrioridadFilter('todos');
  };

  const stats = {
    total: tickets.length,
    nuevo: tickets.filter(t => t.estado === 'nuevo').length,
    enProgreso: tickets.filter(t => t.estado === 'en progreso').length,
    alta: tickets.filter(t => t.prioridad === 'alta').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TicketIcon className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">
              Sistema de Tickets
            </h1>
          </div>
          <p className="text-muted-foreground">
            Gestiona y prioriza solicitudes de soporte con IA • JOJO Reference: Yare yare daze... 
          </p>
        </div>

        {/* Stats */}
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

        {/* Actions and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Tickets</h2>
            <CreateTicketDialog onTicketCreated={fetchTickets} />
          </div>
          
          <TicketFilters
            estado={estadoFilter}
            prioridad={prioridadFilter}
            onEstadoChange={setEstadoFilter}
            onPrioridadChange={setPrioridadFilter}
            onClear={clearFilters}
          />
        </div>

        {/* Tickets Grid */}
        {error ? (
          <div className="text-center py-12 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="text-destructive text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold mb-2 text-destructive">Error al cargar tickets</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchTickets}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Reintentar
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border">
            <TicketIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay tickets</h3>
            <p className="text-muted-foreground mb-4">
              {estadoFilter !== 'todos' || prioridadFilter !== 'todos'
                ? 'No se encontraron tickets con los filtros seleccionados'
                : 'Crea tu primer ticket para comenzar'}
            </p>
            {(estadoFilter !== 'todos' || prioridadFilter !== 'todos') && (
              <button
                onClick={clearFilters}
                className="text-primary hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 py-6 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Hackathon 2025 - Odoo + IA • Powered by Next.js & AI SDK</p>
          <p className="mt-1">⭐ Stand Proud! You are strong. ⭐</p>
        </div>
      </footer>
    </div>
  );
}
