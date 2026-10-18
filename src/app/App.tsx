import { useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '../home';
import { GamePage } from '../game/components';
import { EndPage } from '../end';
import { GameShell } from '../game/GameShell';
import { SceneBridge } from '../game/SceneBridge';
import { useImagesPipe } from '../settings';

import '@awesome.me/webawesome/dist/styles/webawesome.css';

export const App = () => {
  const imagesPipe = useImagesPipe();
  const pipes = useMemo(() => [imagesPipe], [imagesPipe]);
  return (
    <GameShell pipes={pipes}>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <SceneBridge />
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/play' element={<GamePage />} />
          <Route path='/end' element={<EndPage />} />
        </Routes>
      </BrowserRouter>
    </GameShell>
  );
};
