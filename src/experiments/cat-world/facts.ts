import type { LogicalAction, Rng } from './actions'

const FACTS: Record<LogicalAction, readonly string[]> = {
  idle: ['Cats rest a lot so they can burst into a pounce later.', 'A still cat is often listening with its ears.'],
  ignore: ['Cats ignore us on purpose. They are not a remote control.', 'If a cat looks away, it is saying “I feel safe enough to ignore you.”'],
  eat: ['Cats stretch and nibble when they feel safe.', 'A cat’s tongue is rough so it can clean meat off bones.'],
  walk: ['Cats walk on their toes. That is why they look so springy.', 'A cat’s paws have pads that work like quiet shoes.'],
  trot: ['A trot is a playful middle speed — not a hunt, not a nap.', 'Cats trot when they are excited to get somewhere.'],
  jump: ['Cats jump with their back legs like springs.', 'A house cat can jump several times its own height.'],
  pounce: ['Cats pounce to practice hunting.', 'The wiggle before a pounce helps them aim.'],
  stunt: ['Play head-bonks and leaps are how cats practice being brave.', 'Cats play-fight so they learn timing without getting hurt.'],
  meow: ['Adult cats mostly meow at people, not at other cats.', 'A meow is a request: food, door, or attention.'],
  chirp: ['A chirp is a happy greeting sound.', 'Cats chirp at birds they would like to catch.'],
  purr: ['Purrs can mean “I am happy” or “I am calming myself.”', 'Kittens purr so their mother can find them.'],
}

export function factFor(action: LogicalAction, rng: Rng): string {
  const lines = FACTS[action]
  const i = Math.min(lines.length - 1, Math.floor(rng() * lines.length))
  return lines[i] ?? ''
}
