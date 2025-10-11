"use client"

import { useState, useEffect } from 'react';
import { TicketCard } from '@/components/ticket-card';
import { CreateTicketDialog } from '@/components/create-ticket-dialog';
import { LoginDialog } from '@/components/login-dialog';
import { TicketFilters } from '@/components/ticket-filters';
import { TicketStats } from '@/components/ticket-stats';
import { ErrorDisplay } from '@/components/error-display';
import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Ticket as TicketIcon, LogOut, User, History } from 'lucide-react';
import type { TicketPriority, TicketStatus } from '@/types/ticket';
import { useAuth } from '@/contexts/auth-context';
import { useTickets } from '@/hooks/use-tickets';
import Link from 'next/link';

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [estadoFilter, setEstadoFilter] = useState<TicketStatus | 'todos'>('todos');
  const [prioridadFilter, setPrioridadFilter] = useState<TicketPriority | 'todos'>('todos');

  const { tickets, isLoading, error, updatingTicketIds, fetchTickets, handleStatusChange } = 
    useTickets(estadoFilter, prioridadFilter);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowLogin(true);
    }
  }, [isAuthenticated]);

  const clearFilters = () => {
    setEstadoFilter('todos');
    setPrioridadFilter('todos');
  };

  const hasFilters = estadoFilter !== 'todos' || prioridadFilter !== 'todos';

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <TicketIcon className="h-16 w-16 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold mb-2">Sistema de Tickets</h1>
          <p className="text-muted-foreground mb-6">Gestiona y prioriza solicitudes de soporte con IA</p>
          <Button onClick={() => setShowLogin(true)}>
            <User className="h-4 w-4 mr-2" />
            Iniciar Sesión
          </Button>
          <LoginDialog open={showLogin} onOpenChange={setShowLogin} />
        </div>
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
              <TicketIcon className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight">
                Sistema de Tickets
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {user?.role === 'admin' ? 'Administrador' : 'Cliente'}
              </Badge>
              <Link href="/auditoria">
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  Auditoría
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground">
            Gestiona y prioriza solicitudes de soporte con IA • JOJO Reference: Yare yare daze... 
          </p>
        </div>

        {/* Stats */}
        <TicketStats tickets={tickets} />

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
          <ErrorDisplay message={error} onRetry={fetchTickets} />
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onClearFilters={clearFilters} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onStatusChange={handleStatusChange}
                isUpdating={ticket.id ? updatingTicketIds.includes(ticket.id) : false}
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
