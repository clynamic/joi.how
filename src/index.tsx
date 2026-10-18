import { ReactiveElement } from '@lit/reactive-element';
ReactiveElement.disableWarning?.('change-in-update');

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App.tsx';
import './index.css';
import { E621Provider } from './e621';
import { registerServiceWorker } from './utils/serviceWorker.ts';

registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <E621Provider>
      <App />
    </E621Provider>
  </React.StrictMode>
);
