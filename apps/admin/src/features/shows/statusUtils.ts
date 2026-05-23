import { ShowStatus, type Show } from '@maill/shared';

export const nextToggleStatus = (current: Show['status']): Show['status'] => {
  if (current === ShowStatus.OnSale) return ShowStatus.OffShelf;
  return ShowStatus.OnSale;
};

// 仅返回 key segment：'publish' | 'unpublish'，调用方拼成 t('show:action.xxx')
export const toggleActionKey = (current: Show['status']): 'publish' | 'unpublish' => {
  return current === ShowStatus.OnSale ? 'unpublish' : 'publish';
};
