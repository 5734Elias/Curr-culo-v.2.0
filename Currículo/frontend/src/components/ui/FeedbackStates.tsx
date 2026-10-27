import React from 'react';
import { Loader2, AlertTriangle, Inbox } from 'lucide-react';
import { Button } from './Button';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Carregando informações...',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center p-12 space-y-4 text-center rounded-[0.25rem] bg-[#151d1e]/80 border border-[#3a494b]/60"
    >
      <Loader2 className="w-8 h-8 text-[#00f2ff] animate-spin" aria-hidden="true" />
      <span className="text-sm font-mono text-[#b9cacb]">{message}</span>
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Erro ao carregar dados',
  message = 'Ocorreu uma falha inesperada. Por favor, tente novamente.',
  onRetry,
}) => {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center p-12 space-y-4 text-center rounded-[0.25rem] bg-[#ffb4ab]/10 border border-[#ffb4ab]/30"
    >
      <AlertTriangle className="w-8 h-8 text-[#ffb4ab]" aria-hidden="true" />
      <h3 className="text-base font-bold text-[#dce4e4]">{title}</h3>
      <p className="text-xs text-[#b9cacb] max-w-md">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Tentar Novamente
        </Button>
      )}
    </div>
  );
};

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Nenhum resultado encontrado',
  message = 'Não encontramos nenhum item correspondente aos filtros selecionados.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center rounded-[0.25rem] bg-[#151d1e]/80 border border-[#3a494b]/60">
      <Inbox className="w-8 h-8 text-[#849495]" aria-hidden="true" />
      <h3 className="text-base font-bold text-[#dce4e4]">{title}</h3>
      <p className="text-xs text-[#b9cacb] max-w-md">{message}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

