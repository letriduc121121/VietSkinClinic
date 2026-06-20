import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

type AlertVariant = 'error' | 'success' | 'warning' | 'info';

const VARIANTS: Record<AlertVariant, string> = {
  error:   'text-red-600 bg-red-50 border-red-200',
  success: 'text-green-700 bg-green-50 border-green-200',
  warning: 'text-amber-700 bg-amber-50 border-amber-200',
  info:    'text-blue-700 bg-blue-50 border-blue-200',
};

export function Alert({ variant = 'error', children, className }: {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('text-sm border px-4 py-2.5 rounded-xl', VARIANTS[variant], className)}>
      {children}
    </div>
  );
}
