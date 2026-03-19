import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router'
import './assets/style/index.css'
import Game from './components/Game/game.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <main>
      <Router>
        <Routes>
          <Route path="" element={<Game />} />
        </Routes>
      </Router>
    </main>
  </StrictMode>,
)
