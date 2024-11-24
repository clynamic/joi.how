import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App.tsx';
import './index.css';
import { SettingsProvider, ImageProvider } from './settings';
import { E621Provider } from './e621';
import { ToyClientProvider } from './toy';
import { LocalImageProvider } from './local/LocalProvider.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SettingsProvider>
      <ImageProvider>
        <LocalImageProvider>
          <ToyClientProvider>
            <E621Provider>
              <App />
            </E621Provider>
          </ToyClientProvider>
        </LocalImageProvider>
      </ImageProvider>
    </SettingsProvider>
  </React.StrictMode>
);
