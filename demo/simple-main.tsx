import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './SimpleApp';
import './simple.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
