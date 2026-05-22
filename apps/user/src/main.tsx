import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider, LocaleSync, initI18n, Toaster } from '@maill/shared';
import { store } from './store';
import { router } from './router';
import './styles/index.css';

async function bootstrap() {
  if (import.meta.env.DEV) {
    const { default: VConsole } = await import('vconsole');
    new VConsole();
  }
  await initI18n('user');
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Provider store={store}>
        <ThemeProvider>
          <LocaleSync>
            <RouterProvider router={router} />
            <Toaster />
          </LocaleSync>
        </ThemeProvider>
      </Provider>
    </React.StrictMode>,
  );
}

bootstrap();
