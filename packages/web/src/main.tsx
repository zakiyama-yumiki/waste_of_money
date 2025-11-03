import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './Layout';
import { AmountPage } from './routes/AmountPage';
import { AlternativesPage } from './routes/AlternativesPage';
import { DonePage } from './routes/DonePage';
import { TonePage } from './routes/TonePage';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<AmountPage />} />
          <Route path="/alternatives" element={<AlternativesPage />} />
          <Route path="/done" element={<DonePage />} />
          <Route path="/settings/tone" element={<TonePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
