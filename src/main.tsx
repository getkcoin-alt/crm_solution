import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/geist-mono';
import './styles/index.css';
import App from './App';
import { applyTheme, usePrefs } from './store/prefs';

applyTheme(usePrefs.getState().theme);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(usePrefs.getState().theme));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
