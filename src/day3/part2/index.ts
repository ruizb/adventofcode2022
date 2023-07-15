import { Chunk, Effect, Number, ReadonlyArray, pipe } from 'effect'
import { InputProvider } from '../../common/index.js'
import { itemToPriority, parseLine } from '../part1/index.js'

const toGroups = (lines: string[]): readonly [string, string, string][] =>
  Chunk.fromIterable(lines).pipe(
    Chunk.chunksOf(3),
    Chunk.map(
      chunks => Chunk.toReadonlyArray(chunks) as [string, string, string]
    ),
    Chunk.toReadonlyArray
  )

const findCommonItemType = (
  group: [string, string, string]
): Effect.Effect<never, string, string> =>
  Chunk.intersection(
    Chunk.fromIterable(group[0]),
    Chunk.fromIterable(group[1])
  ).pipe(
    Chunk.intersection(Chunk.fromIterable(group[2])),
    // A rucksack may contain multiple occurrences of the same item type
    chunk => new Set(Chunk.toReadonlyArray(chunk)),
    Effect.succeed,
    Effect.filterOrFail(
      set => set.size === 1,
      set => `Expected to find 1 common item in the group: ${[...set]}`
    ),
    Effect.map(set => [...set][0])
  )

export const program = InputProvider.pipe(
  Effect.flatMap(inputProvider =>
    inputProvider.get(new URL('../part1/input.txt', import.meta.url))
  ),
  Effect.flatMap(lines => Effect.all(lines.map(parseLine))),
  Effect.map(toGroups),
  Effect.flatMap(groups => Effect.all(groups.map(findCommonItemType))),
  Effect.map(errorItems =>
    pipe(
      errorItems.map(item => itemToPriority[item]),
      Number.sumAll
    )
  )
)
