import { Ticket as TicketIcon } from 'lucide-react';

interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function EmptyState({ hasFilters, onClearFilters }: EmptyStateProps) {
  return (
    <div className="text-center py-12 bg-card rounded-lg border">
      <TicketIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">No hay tickets</h3>
      <p className="text-muted-foreground mb-4">
        {hasFilters
          ? 'No se encontraron tickets con los filtros seleccionados'
          : 'Crea tu primer ticket para comenzar'}
      </p>
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="text-primary hover:underline"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
