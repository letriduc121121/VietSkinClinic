import type { ServiceForm } from '../types/service.types';

export const emptyServiceForm: ServiceForm = {
  name: '', description: '', price: '', duration: '30',
  category: '', imageUrl: '', active: true,
};

export const fmtPrice = (n: string | number) => Number(n).toLocaleString('vi-VN') + 'đ';
