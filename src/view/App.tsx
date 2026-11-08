import { createElement } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './home';
import { GamePage } from './play';
import { GameShell } from './bridge/GameShell';
import { SceneBridge } from './bridge/SceneBridge';
import { SUMMARY_TAG } from '../game/classic/summary';

import '@awesome.me/webawesome/dist/styles/webawesome.css';

export const App = () => {
  return (
    <GameShell>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <SceneBridge />
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/play' element={<GamePage />} />
          <Route path='/end' element={createElement(SUMMARY_TAG)} />
        </Routes>
      </BrowserRouter>
    </GameShell>
  );
};
