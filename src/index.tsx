import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App.tsx';
import './index.css';
import { SettingsProvider, ImageProvider } from './settings';
import { E621Provider } from './e621';
import { VibratorProvider } from './utils';
import { LocalImageProvider } from './local/LocalProvider.tsx';
import { WalltakerSocketServiceProvider } from './utils/porn-socket/walltaker.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SettingsProvider>
      <ImageProvider>
        <LocalImageProvider>
          <WalltakerSocketServiceProvider>
            <VibratorProvider>
              <E621Provider>
                <App />
              </E621Provider>
            </VibratorProvider>
          </WalltakerSocketServiceProvider>
        </LocalImageProvider>
      </ImageProvider>
    </SettingsProvider>
  </React.StrictMode>
);
