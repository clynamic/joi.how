import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App.tsx';
import './index.css';
import { SettingsProvider, ImageProvider } from './settings';
import { E621Provider } from './e621';
import { VibratorProvider } from './utils';
import { LocalImageProvider } from './local/LocalProvider.tsx';

import '@awesome.me/webawesome/dist/styles/webawesome.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SettingsProvider>
      <ImageProvider>
        <LocalImageProvider>
          <VibratorProvider>
            <E621Provider>
              <App />
            </E621Provider>
          </VibratorProvider>
        </LocalImageProvider>
      </ImageProvider>
    </SettingsProvider>
  </React.StrictMode>
);
