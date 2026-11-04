import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.tsx';
import { LocalizedRoutes } from './components/LocalizedRouter.tsx';
import './fonts.css';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LocalizedRoutes><App /></LocalizedRoutes>
    </BrowserRouter>
  </React.StrictMode>
);
