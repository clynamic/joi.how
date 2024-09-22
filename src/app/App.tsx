import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '../home';
import { GamePage } from '../game';
import { WalltakerSocketServiceProvider } from '../utils/porn-socket/walltaker.tsx';

export const App = () => {
  return (
    <WalltakerSocketServiceProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/play' element={<GamePage />} />
        </Routes>
      </BrowserRouter>
    </WalltakerSocketServiceProvider>
  );
};
