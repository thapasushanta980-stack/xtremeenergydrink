import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import gsap from 'gsap';
import App from './App';
import './styles.css';

if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).gsap = gsap;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
