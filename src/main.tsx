import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { gameSoundEngine } from './utils/gameAudio';

// Initialize global arcade video game sound interceptor
gameSoundEngine.setupGlobalListeners();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

