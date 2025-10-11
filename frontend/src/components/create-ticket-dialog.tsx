"use client"

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select } from './ui/select';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Plus, Sparkles, Loader2, TicketIcon, User, Tag, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { TicketPriority } from '@/types/ticket';
import { useAuth } from '@/contexts/auth-context';

interface CreateTicketDialogProps {
  onTicketCreated?: () => void;
}

interface Assignee {
  id: number;
  name: string;
  email?: string;
  login?: string;
  active?: boolean;
}

export function CreateTicketDialog({ onTicketCreated }: CreateTicketDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<TicketPriority>('media');
  const [asignatario, setAsignatario] = useState('');
  const [etiquetasInput, setEtiquetasInput] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<{
    prioridad: TicketPriority;
    explicacion: string;
  } | null>(null);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [isLoadingAssignees, setIsLoadingAssignees] = useState(false);
  const [assigneesError, setAssigneesError] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!open || !isAdmin) {
      return;
    }

    const controller = new AbortController();

    const loadAssignees = async () => {
      setIsLoadingAssignees(true);
      setAssigneesError(null);

      try {
        const response = await fetch('/api/support/assignees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ only_active: true, limit: 100 }),
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'No se pudieron obtener los asignatarios');
        }

        const records = Array.isArray(data.assignees) ? data.assignees : [];
        setAssignees(records);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        const message = error instanceof Error ? error.message : 'No se pudieron obtener los asignatarios';
        setAssigneesError(message);
        setAssignees([]);
      } finally {
        if (controller.signal.aborted) {
          return;
        }
        setIsLoadingAssignees(false);
      }
    };

    loadAssignees();

    return () => {
      controller.abort();
    };
  }, [open, isAdmin]);

  useEffect(() => {
    if (!asignatario) {
      return;
    }

    if (!assignees.some((assignee) => String(assignee.id) === asignatario)) {
      setAsignatario('');
    }
  }, [assignees, asignatario]);

  const handleAnalyze = async () => {
    if (!titulo || !descripcion) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, descripcion }),
      });

      const data = await response.json();
      if (data.success) {
        setAiSuggestion({
          prioridad: data.prioridad,
          explicacion: data.explicacion,
        });
        setPrioridad(data.prioridad);
      }
    } catch (error) {
      console.error('Error al analizar:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Submitting ticket:', { titulo, descripcion, prioridad });
      
      const etiquetas = etiquetasInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const requestBody: any = {
        titulo,
        descripcion,
        prioridad: isAdmin ? prioridad : (aiSuggestion?.prioridad || 'media'), // Clients can't override priority
        prioridad_ia: aiSuggestion?.prioridad,
        explicacion_ia: aiSuggestion?.explicacion,
        origen_ia: aiSuggestion ? 'openai' : 'manual',
      };

      // Only admins can set assignatario and etiquetas
      if (isAdmin) {
        if (asignatario) {
          const asignatarioId = Number(asignatario);
          if (!Number.isNaN(asignatarioId)) {
            requestBody.asignatario = asignatarioId;
          }
        }
        if (etiquetas.length > 0) {
          requestBody.etiquetas = etiquetas;
        }
      }

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Submit response:', data);

      if (response.ok && data.success) {
        setOpen(false);
        resetForm();
        onTicketCreated?.();
      } else {
        setError(data.error || 'Error al crear el ticket');
      }
    } catch (error) {
      console.error('Error al crear ticket:', error);
      setError('No se pudo conectar con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitulo('');
    setDescripcion('');
    setPrioridad('media');
    setAsignatario('');
    setEtiquetasInput('');
    setAiSuggestion(null);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button className="bg-primary hover:bg-primary/90 shadow-md">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-2 p-6 shadow-2xl">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-full ${isAdmin ? 'bg-blue-200 text-blue-700' : 'bg-green-200 text-green-700'}`}>
              <TicketIcon className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                Crear Nuevo Ticket
              </DialogTitle>
              <Badge variant="outline" className={`mt-1 ${isAdmin ? 'border-blue-300 text-blue-700' : 'border-green-300 text-green-700'}`}>
                {isAdmin ? 'Administrador' : 'Cliente'}
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-base">
            {isAdmin
              ? 'Complete todos los detalles del ticket. La IA le ayudará con sugerencias inteligentes.'
              : 'Complete la información básica. La prioridad será asignada automáticamente por IA.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Información Básica</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo" className="text-sm font-medium flex items-center gap-1">
                  Título <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Sistema no inicia correctamente"
                  className="border-2 focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion" className="text-sm font-medium flex items-center gap-1">
                  Descripción <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describa detalladamente el problema que está experimentando..."
                  rows={4}
                  className="border-2 focus:border-primary resize-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* AI Analysis Section */}
          <div className="bg-muted rounded-lg p-6 border border-primary/20 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <h3 className="text-lg font-semibold">Análisis con IA</h3>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleAnalyze}
                disabled={!titulo || !descripcion || isAnalyzing}
                className="flex-1 border-2 hover:border-primary hover:bg-primary/5"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analizar con IA
                  </>
                )}
              </Button>
            </div>

            {aiSuggestion && (
              <div className="mt-4 p-4 bg-card rounded-lg border border-primary/30 shadow-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm mb-2 text-primary">Sugerencia de IA</p>
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                      {aiSuggestion.explicacion}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Prioridad recomendada:</span>
                      <Badge variant={
                        aiSuggestion.prioridad === 'alta' ? 'destructive' :
                        aiSuggestion.prioridad === 'media' ? 'default' :
                        'secondary'
                      } className="font-semibold">
                        {aiSuggestion.prioridad.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Admin-only Advanced Settings */}
          {isAdmin && (
            <div className="bg-muted rounded-lg p-6 border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Configuración Avanzada</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prioridad" className="text-sm font-medium flex items-center gap-1">
                    Prioridad <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    id="prioridad"
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value as TicketPriority)}
                    className="border-2 focus:border-primary"
                    required
                  >
                    <option value="baja">🟢 Baja</option>
                    <option value="media">🟡 Media</option>
                    <option value="alta">🔴 Alta</option>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {aiSuggestion ? 'Puedes modificar la sugerencia de IA' : 'Selecciona una prioridad inicial'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="asignatario" className="text-sm font-medium">
                    Asignatario
                  </Label>
                  <Select
                    id="asignatario"
                    value={asignatario}
                    onChange={(e) => setAsignatario(e.target.value)}
                    disabled={isLoadingAssignees && assignees.length === 0}
                    className="border-2 focus:border-primary"
                  >
                    <option value="">Sin asignar</option>
                    {assignees.map((assignee) => (
                      <option key={assignee.id} value={String(assignee.id)}>
                        {assignee.email ? `${assignee.name} (${assignee.email})` : assignee.name}
                      </option>
                    ))}
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Opcional - Déjalo vacío para asignación automática
                  </p>
                  {isLoadingAssignees && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Cargando asignatarios disponibles...
                    </div>
                  )}
                  {assigneesError && (
                    <p className="text-xs text-destructive">
                      {assigneesError}
                    </p>
                  )}
                  {!isLoadingAssignees && assignees.length === 0 && !assigneesError && (
                    <p className="text-xs text-muted-foreground">
                      No hay asignatarios disponibles actualmente
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="etiquetas" className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Etiquetas
                </Label>
                <Input
                  id="etiquetas"
                  value={etiquetasInput}
                  onChange={(e) => setEtiquetasInput(e.target.value)}
                  placeholder="Ej: acceso, contabilidad, urgente"
                  className="border-2 focus:border-primary"
                />
                <p className="text-xs text-muted-foreground">
                  Opcional - Separa las etiquetas con comas
                </p>
              </div>
            </div>
          )}

          {/* Client Notice */}
          {!isAdmin && (
            <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Modo Cliente</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Solo puedes crear tickets básicos. Los administradores manejarán la asignación, etiquetas y ajustes de prioridad.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creando Ticket...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Crear Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
