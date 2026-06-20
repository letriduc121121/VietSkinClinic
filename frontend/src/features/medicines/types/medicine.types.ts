export interface Medicine {
  id: number;
  name: string;
  unit?: string | null;
  category?: string | null;
  description?: string | null;
  active?: boolean;
  createdAt?: string;
}

export interface MedicineForm {
  name: string;
  unit: string;
  category: string;
  description: string;
}
