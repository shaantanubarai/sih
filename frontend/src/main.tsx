import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { installApiMocks } from './mocks/install';
import './index.css';

// The prototype is immediately usable with its safe fictional-data API.
// Set VITE_USE_MOCKS=false to target the FastAPI service instead.
installApiMocks();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
