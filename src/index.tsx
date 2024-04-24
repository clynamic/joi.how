import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App.tsx';
import './index.css';
import { SettingsProvider } from './settings';
import { ImageProvider } from './images/ImageProvider.tsx';
import { E621Provider } from './e621/E621Provider.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SettingsProvider>
      <ImageProvider>
        <E621Provider>
          <App />
        </E621Provider>
      </ImageProvider>
    </SettingsProvider>
  </React.StrictMode>
);
