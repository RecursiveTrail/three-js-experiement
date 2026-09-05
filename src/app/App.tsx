import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ExperimentList } from './ExperimentList'
import { CatWorldPage } from '../experiments/cat-world/index'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ExperimentList />} />
        <Route path="/cat-world" element={<CatWorldPage />} />
      </Routes>
    </BrowserRouter>
  )
}
