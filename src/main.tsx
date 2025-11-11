import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import { FrontContextProvider } from './providers/FrontContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <FrontContextProvider>
        <App />
      </FrontContextProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
