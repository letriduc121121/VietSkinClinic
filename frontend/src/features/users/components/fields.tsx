import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

const inputCls =
  'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors';

function Wrap({ label, required, colSpan, children }: {
  label: string; required?: boolean; colSpan?: boolean; children: ReactNode;
}) {
  return (
    <div className={colSpan ? 'sm:col-span-2' : undefined}>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}{required ? ' *' : ''}</label>
      {children}
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  colSpan?: boolean;
  disabled?: boolean;
}

export function TextField({ label, value, onChange, placeholder, type, required, colSpan, disabled }: TextFieldProps) {
  return (
    <Wrap label={label} required={required} colSpan={colSpan}>
      <input
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        type={type}
        disabled={disabled}
        className={cn(inputCls, disabled && 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed')}
      />
    </Wrap>
  );
}

export function SelectField({ label, value, onChange, colSpan, children }: {
  label: string; value: string; onChange: (v: string) => void; colSpan?: boolean; children: ReactNode;
}) {
  return (
    <Wrap label={label} colSpan={colSpan}>
      <select value={value} onChange={e => onChange(e.target.value)} className={cn(inputCls, 'bg-white')}>
        {children}
      </select>
    </Wrap>
  );
}

export function TextareaField({ label, value, onChange, placeholder, rows = 3, colSpan }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; colSpan?: boolean;
}) {
  return (
    <Wrap label={label} colSpan={colSpan}>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} className={cn(inputCls, 'resize-none')} />
    </Wrap>
  );
}
