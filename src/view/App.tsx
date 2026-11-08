import { createElement } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameShell } from './bridge/GameShell';
import { SceneBridge } from './bridge/SceneBridge';
import { HOME_TAG } from '../game/home/page';
import { PLAY_TAG } from '../game/classic/play';
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
          <Route path='/' element={createElement(HOME_TAG)} />
          <Route path='/play' element={createElement(PLAY_TAG)} />
          <Route path='/end' element={createElement(SUMMARY_TAG)} />
        </Routes>
      </BrowserRouter>
    </GameShell>
  );
};
