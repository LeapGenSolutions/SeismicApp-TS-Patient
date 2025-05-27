import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import '@stream-io/video-react-sdk/dist/css/styles.css';

createRoot(document.getElementById('root')!).render(
    <App />
)
