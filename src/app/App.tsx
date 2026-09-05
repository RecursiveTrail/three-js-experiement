import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ExperimentList } from './ExperimentList'
import { CatWorldPage } from '../experiments/cat-world/index'
import { DahiHandiPage } from '../experiments/dahi-handi/index'

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<ExperimentList />} />
        <Route path="/cat-world" element={<CatWorldPage />} />
        <Route path="/dahi-handi" element={<DahiHandiPage />} />
      </Routes>
    </BrowserRouter>
  )
}
