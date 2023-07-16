import { Chunk, Effect, Number } from 'effect'
import { InputProvider } from '../../common/index.js'
import { Pair, parseLine } from '../part1/index.js'

// Not a super efficient solution, but quite easy to implement
const isOverlapping = ([[start1, end1], [start2, end2]]: Pair): 0 | 1 => {
  return Chunk.makeBy(end1 - start1 + 1, i => start1 + i).pipe(
    Chunk.intersection(Chunk.makeBy(end2 - start2 + 1, i => start2 + i)),
    Chunk.isNonEmpty
  )
    ? 1
    : 0
}

export const program = InputProvider.pipe(
  Effect.flatMap(inputProvider =>
    inputProvider.get(new URL('../part1/input.txt', import.meta.url))
  ),
  Effect.flatMap(lines => Effect.all(lines.map(parseLine))),
  Effect.map(pairs => pairs.map(isOverlapping)),
  Effect.map(Number.sumAll)
)
