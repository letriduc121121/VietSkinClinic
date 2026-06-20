import { useCallback, useState } from 'react';

export function useDisclosure<T = unknown>() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback(() => { setData(null); setIsOpen(true); }, []);
  const openWith = useCallback((value: T) => { setData(value); setIsOpen(true); }, []);
  const close = useCallback(() => { setIsOpen(false); setData(null); }, []);

  return { isOpen, data, open, openWith, close };
}
