export type Experiment = {
  id: string
  title: string
  path: string
  description: string
}

export const experiments: readonly Experiment[] = [
  {
    id: 'cat-world',
    title: 'Cat World',
    path: '/cat-world',
    description: 'A backyard cat that reacts when you mash the keyboard.',
  },
]
