import { ShowStatus, type Show } from '@maill/shared';

export const nextToggleStatus = (current: Show['status']): Show['status'] => {
  if (current === ShowStatus.OnSale) return ShowStatus.OffShelf;
  return ShowStatus.OnSale;
};

export const toggleLabel = (current: Show['status']): string => {
  if (current === ShowStatus.OnSale) return '下架';
  return '上架';
};
