import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Регистрирует автоматически сгенерированный (и правильно прекэшированный)
// service worker — см. vite.config.ts. Это и есть офлайн-оболочка
// приложения: после первого захода онлайн сайт целиком грузится из кэша
// даже без сети.
registerSW({ immediate: true });
