"use client"

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select } from './ui/select';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import type { TicketPriority } from '@/types/ticket';

interface CreateTicketDialogProps {
  onTicketCreated?: () => void;
}

export function CreateTicketDialog({ onTicketCreated }: CreateTicketDialogProps) {
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
      
      // Convertir etiquetas de string separado por comas a array
      const etiquetas = etiquetasInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          descripcion,
          prioridad,
          prioridad_ia: aiSuggestion?.prioridad,
          explicacion_ia: aiSuggestion?.explicacion,
          asignatario: asignatario || undefined,
          etiquetas: etiquetas.length > 0 ? etiquetas : undefined,
          origen_ia: aiSuggestion ? 'openai' : 'manual',
        }),
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
        <Button>
          <Plus className="h-4 w-4" />
          Nuevo Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Ticket</DialogTitle>
          <DialogDescription>
            Complete los detalles del ticket. Use IA para analizar automáticamente la prioridad.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Sistema no inicia"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción *</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describa el problema en detalle..."
              rows={5}
              required
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleAnalyze}
              disabled={!titulo || !descripcion || isAnalyzing}
              className="flex-1"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analizar con IA
                </>
              )}
            </Button>
          </div>

          {aiSuggestion && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-1">Sugerencia de IA:</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {aiSuggestion.explicacion}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Prioridad recomendada:</span>
                    <Badge variant={
                      aiSuggestion.prioridad === 'alta' ? 'destructive' :
                      aiSuggestion.prioridad === 'media' ? 'warning' :
                      'secondary'
                    }>
                      {aiSuggestion.prioridad.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="prioridad">Prioridad *</Label>
            <Select
              id="prioridad"
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value as TicketPriority)}
              required
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="asignatario">Asignatario (Opcional)</Label>
            <Input
              id="asignatario"
              value={asignatario}
              onChange={(e) => setAsignatario(e.target.value)}
              placeholder="Ej: Administrador de Sistemas"
            />
            <p className="text-xs text-muted-foreground">
              Deja vacío para asignación automática
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="etiquetas">Etiquetas (Opcional)</Label>
            <Input
              id="etiquetas"
              value={etiquetasInput}
              onChange={(e) => setEtiquetasInput(e.target.value)}
              placeholder="Ej: acceso, contabilidad, urgente"
            />
            <p className="text-xs text-muted-foreground">
              Separa las etiquetas con comas
            </p>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Ticket'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
