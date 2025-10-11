interface ErrorDisplayProps {
  message: string;
  onRetry: () => void;
}

export function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div className="text-center py-12 bg-destructive/10 rounded-lg border border-destructive/20">
      <div className="text-destructive text-4xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold mb-2 text-destructive">Error al cargar tickets</h3>
      <p className="text-muted-foreground mb-4 max-w-md mx-auto">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Reintentar
      </button>
    </div>
  );
}
