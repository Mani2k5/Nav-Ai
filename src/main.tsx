import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker with auto-update for station map & topological graph caching
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New station map data available, updating service worker cache...');
  },
  onOfflineReady() {
    console.log('KSR station blueprint & routing graph successfully cached for offline navigation.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
