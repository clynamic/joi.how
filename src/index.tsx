import { ReactiveElement } from '@lit/reactive-element';
ReactiveElement.disableWarning?.('change-in-update');

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './view/App.tsx';
import './index.css';
import { registerServiceWorker } from './view/serviceWorker.ts';

registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
