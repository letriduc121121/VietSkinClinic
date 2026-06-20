import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';
import { Alert } from './Alert';

interface Props {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  loadingLabel?: string;
  variant?: 'danger' | 'primary';
  error?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const CONFIRM_CLS: Record<'danger' | 'primary', string> = {
  danger: 'bg-red-600 hover:bg-red-700',
  primary: 'bg-[#1a3a5c] hover:bg-[#0f2540]',
};

export function ConfirmDialog({
  title, message, confirmLabel = 'Xác nhận xoá', loadingLabel = 'Đang xoá...',
  variant = 'danger', error, loading, onClose, onConfirm,
}: Props) {
  return (
    <Modal maxWidth="max-w-sm">
      <ModalHeader>
        <h3 className="font-bold text-gray-900">{title}</h3>
      </ModalHeader>

      <ModalBody className="space-y-3">
        <div className="text-sm text-gray-600">{message}</div>
        {error && <Alert variant="error">{error}</Alert>}
      </ModalBody>

      <ModalFooter>
        <button
          onClick={onClose}
          className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Huỷ
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={cn('flex-1 text-white py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60', CONFIRM_CLS[variant])}
        >
          {loading ? loadingLabel : confirmLabel}
        </button>
      </ModalFooter>
    </Modal>
  );
}
