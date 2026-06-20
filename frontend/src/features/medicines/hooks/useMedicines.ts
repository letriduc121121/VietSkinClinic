import { useCallback, useEffect, useMemo, useState } from 'react';
import { medicineApi } from '../api/medicine.api';
import type { Medicine, MedicineForm } from '../types/medicine.types';

const buildPayload = (f: MedicineForm) => ({
  name: f.name.trim(),
  unit: f.unit.trim() || null,
  category: f.category.trim() || null,
  description: f.description.trim() || null,
});

export function useMedicines() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await medicineApi.getAll();
      setMedicines(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const create = useCallback(async (form: MedicineForm) => {
    await medicineApi.create(buildPayload(form) as any);
    await reload();
  }, [reload]);

  const update = useCallback(async (id: number, form: MedicineForm) => {
    await medicineApi.update(id, buildPayload(form) as any);
    await reload();
  }, [reload]);

  const remove = useCallback(async (target: Medicine) => {
    await medicineApi.delete(target.id);
    setMedicines(prev => prev.filter(m => m.id !== target.id));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return medicines;
    return medicines.filter(m =>
      m.name.toLowerCase().includes(q) ||
      (m.category?.toLowerCase().includes(q) ?? false) ||
      (m.description?.toLowerCase().includes(q) ?? false) ||
      (m.unit?.toLowerCase().includes(q) ?? false),
    );
  }, [medicines, search]);

  const categories = useMemo(() => [...new Set(medicines.map(m => m.category).filter(Boolean))] as string[], [medicines]);
  const units = useMemo(() => [...new Set(medicines.map(m => m.unit).filter(Boolean))] as string[], [medicines]);

  return { medicines: filtered, total: medicines.length, loading, search, setSearch, categories, units, reload, create, update, remove };
}
