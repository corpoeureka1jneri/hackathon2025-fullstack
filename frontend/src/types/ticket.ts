export type TicketPriority = 'alta' | 'media' | 'baja';
export type TicketStatus = 'nuevo' | 'en progreso' | 'resuelto' | 'cancelado';
export type OrigenIA = 'openai' | 'reglas' | 'manual';

export interface Ticket {
  id?: number;
  titulo: string;
  descripcion: string;
  prioridad: TicketPriority;
  estado: TicketStatus;
  prioridad_ia?: TicketPriority;
  explicacion_ia?: string;
  asignatario?: string;
  asignatario_sugerido?: string;
  origen_ia?: OrigenIA;
  etiquetas?: string[];
}

export interface CreateTicketRequest {
  titulo: string;
  descripcion: string;
  prioridad: TicketPriority;
}

export interface CreateTicketResponse {
  success: boolean;
  ticket?: Ticket;
  error?: string;
}

export interface ListTicketsResponse {
  success: boolean;
  tickets?: Ticket[];
  error?: string;
}
