import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

export function Modal({ maxWidth = 'max-w-2xl', children }: { maxWidth?: string; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className={cn('bg-white rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col max-h-[90vh]', maxWidth)}>
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
      {children}
      {onClose && <CloseButton onClick={onClose} />}
    </div>
  );
}

export function ModalBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-6 overflow-y-auto', className)}>{children}</div>;
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">{children}</div>;
}
