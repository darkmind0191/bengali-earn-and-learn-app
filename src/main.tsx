import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

const redirect = sessionStorage.getItem('spa-redirect');

if (redirect) {
  sessionStorage.removeItem('spa-redirect');

  try {
    const { route, query, hash } = JSON.parse(redirect);

    window.history.replaceState(
      null,
      '',
      `/bengali-earn-and-learn-app${route}${query || ''}${hash || ''}`
    );
  } catch {
    // Ignore invalid redirect data
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/bengali-earn-and-learn-app">
      <App />
    </BrowserRouter>
  </StrictMode>,
);
