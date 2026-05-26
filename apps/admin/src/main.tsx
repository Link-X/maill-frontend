import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider, LocaleSync, initI18n, Toaster } from '@maill/shared';
import { store } from './store';
import { router } from './router';
import { easing } from './lib/motion';
import './styles/index.css';

async function bootstrap() {
  await initI18n('admin');
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Provider store={store}>
        <ThemeProvider>
          <LocaleSync>
            {/* MotionConfig 在框架层兜底：系统开启 reduce-motion 时自动只播放 opacity */}
            <MotionConfig reducedMotion="user" transition={{ ease: easing.standard }}>
              <RouterProvider router={router} />
              <Toaster />
            </MotionConfig>
          </LocaleSync>
        </ThemeProvider>
      </Provider>
    </React.StrictMode>,
  );
}

bootstrap();
