import { createRoot } from 'react-dom/client';
import { App } from './App';
import './settings.css';
import './mac.css';
import '../shared/emoteFx.css';

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
