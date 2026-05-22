import { Toaster as Sonner } from 'sonner';
import { useSelector } from 'react-redux';
import { selectThemeMode } from '../theme/themeSlice';

export const Toaster = () => {
  const mode = useSelector(selectThemeMode);
  const theme = mode === 'system' ? 'system' : mode;
  return <Sonner theme={theme} richColors closeButton position="top-center" />;
};
