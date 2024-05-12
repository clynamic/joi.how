import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App.tsx';
import './index.css';
import { SettingsProvider, ImageProvider } from './settings';
import { E621Provider } from './e621';
import { VibratorProvider } from './utils';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SettingsProvider>
      <ImageProvider>
        <VibratorProvider>
          <E621Provider>
            <App />
          </E621Provider>
        </VibratorProvider>
      </ImageProvider>
    </SettingsProvider>
  </React.StrictMode>
);
