import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '../home';
import { GamePage } from '../game';

import '@awesome.me/webawesome/dist/styles/webawesome.css';

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/play' element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  );
};
