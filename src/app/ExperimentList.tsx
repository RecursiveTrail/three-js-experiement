import { Link } from 'react-router-dom'
import { experiments } from './experiments'

export function ExperimentList() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>three experiments</h1>
      <ul>
        {experiments.map((e) => (
          <li key={e.id}>
            <Link to={e.path}>{e.title}</Link>
            <p>{e.description}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
