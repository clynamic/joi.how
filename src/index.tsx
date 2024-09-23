import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App.tsx';
import './index.css';
import { SettingsProvider, ImageProvider } from './settings';
import { E621Provider } from './e621';
import { VibratorProvider } from './utils';
import { LocalImageProvider } from './local';
import { WalltakerProvider } from './walltaker';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SettingsProvider>
      <ImageProvider>
        <LocalImageProvider>
          <WalltakerProvider>
            <VibratorProvider>
              <E621Provider>
                <App />
              </E621Provider>
            </VibratorProvider>
          </WalltakerProvider>
        </LocalImageProvider>
      </ImageProvider>
    </SettingsProvider>
  </React.StrictMode>
);
