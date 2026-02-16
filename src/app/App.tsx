import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '../home';
import { GamePage } from '../game';
import { EndPage } from '../end';
import { GameShell } from '../game/GameShell';

import '@awesome.me/webawesome/dist/styles/webawesome.css';

export const App = () => {
  return (
    <GameShell>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/play' element={<GamePage />} />
          <Route path='/end' element={<EndPage />} />
        </Routes>
      </BrowserRouter>
    </GameShell>
  );
};
