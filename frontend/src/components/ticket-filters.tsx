"use client"

import { Select } from './ui/select';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import type { TicketPriority, TicketStatus } from '@/types/ticket';

interface TicketFiltersProps {
  estado: TicketStatus | 'todos';
  prioridad: TicketPriority | 'todos';
  onEstadoChange: (estado: TicketStatus | 'todos') => void;
  onPrioridadChange: (prioridad: TicketPriority | 'todos') => void;
  onClear: () => void;
}

export function TicketFilters({
  estado,
  prioridad,
  onEstadoChange,
  onPrioridadChange,
  onClear,
}: TicketFiltersProps) {
  const hasFilters = estado !== 'todos' || prioridad !== 'todos';

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="flex-1 min-w-[200px] space-y-2">
        <Label htmlFor="filter-estado">Estado</Label>
        <Select
          id="filter-estado"
          value={estado}
          onChange={(e) => onEstadoChange(e.target.value as TicketStatus | 'todos')}
        >
          <option value="todos">Todos</option>
          <option value="nuevo">Nuevo</option>
          <option value="en progreso">En Progreso</option>
          <option value="resuelto">Resuelto</option>
          <option value="cancelado">Cancelado</option>
        </Select>
      </div>

      <div className="flex-1 min-w-[200px] space-y-2">
        <Label htmlFor="filter-prioridad">Prioridad</Label>
        <Select
          id="filter-prioridad"
          value={prioridad}
          onChange={(e) => onPrioridadChange(e.target.value as TicketPriority | 'todos')}
        >
          <option value="todos">Todas</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </Select>
      </div>

      {hasFilters && (
        <Button
          variant="outline"
          size="icon"
          onClick={onClear}
          title="Limpiar filtros"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
