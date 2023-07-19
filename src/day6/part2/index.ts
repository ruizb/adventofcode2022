import { Chunk, Effect } from 'effect'
import { InputProvider } from '../../common/index.js'
import { findMarker } from '../part1/index.js'

export const program = InputProvider.pipe(
  Effect.flatMap(inputProvider =>
    inputProvider.get(new URL('../part1/input.txt', import.meta.url))
  ),
  Effect.map(Chunk.fromIterable),
  Effect.filterOrFail(
    Chunk.isNonEmpty,
    lines => `Expected input to have 1 line, got: ${Chunk.size(lines)}`
  ),
  Effect.map(Chunk.headNonEmpty),
  Effect.map(Chunk.fromIterable), // get list of characters
  Effect.flatMap(findMarker(14))
)
