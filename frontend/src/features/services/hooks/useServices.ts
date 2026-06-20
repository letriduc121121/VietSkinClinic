import { useCallback, useEffect, useMemo, useState } from 'react';
import { serviceApi } from '../api/service.api';
import type { Service, ServiceForm } from '../types/service.types';

const buildPayload = (f: ServiceForm) => ({
  name: f.name.trim(),
  description: f.description.trim() || null,
  price: Number(f.price),
  duration: Number(f.duration) || 30,
  category: f.category.trim() || null,
  imageUrl: f.imageUrl || null,
  active: f.active,
});

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await serviceApi.getAll({ all: true });
      setServices(Array.isArray(data) ? data : []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const create = useCallback(async (form: ServiceForm) => {
    await serviceApi.create(buildPayload(form) as any);
    await reload();
  }, [reload]);

  const update = useCallback(async (id: number, form: ServiceForm) => {
    await serviceApi.update(id, buildPayload(form) as any);
    await reload();
  }, [reload]);

  const remove = useCallback(async (target: Service) => {
    await serviceApi.delete(target.id);
    setServices(prev => prev.filter(s => s.id !== target.id));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter(s => {
      if (!s.active) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.category?.toLowerCase().includes(q) ?? false) ||
        (s.description?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [services, search]);

  const categories = useMemo(
    () => [...new Set(services.map(s => s.category).filter(Boolean))] as string[],
    [services],
  );

  return { services: filtered, loading, search, setSearch, categories, reload, create, update, remove };
}
