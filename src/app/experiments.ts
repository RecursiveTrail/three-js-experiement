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
  {
    id: 'dahi-handi',
    title: 'Dahi Handi',
    path: '/dahi-handi',
    description: 'Little Krishna jumps to smash hanging dahi handis.',
  },
]
