import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '../home';
import { GamePage } from '../game';
import { theme } from './theme';
import { CssBaseline, ThemeProvider } from '@mui/material';

export const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/play' element={<GamePage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};
