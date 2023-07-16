import { Chunk, Effect, Number, ReadonlyArray, pipe } from 'effect'
import * as S from '@effect/schema/Schema'
import { ParseError } from '@effect/schema/ParseResult'
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
): Effect.Effect<never, ParseError, string> =>
  Chunk.intersection(
    Chunk.fromIterable(group[0]),
    Chunk.fromIterable(group[1])
  ).pipe(
    Chunk.intersection(Chunk.fromIterable(group[2])),
    // A rucksack may contain multiple occurrences of the same item type
    Chunk.toReadonlyArray,
    S.parse(
      S.readonlySet(S.string).pipe(
        S.filter(set => set.size === 1, {
          message: set =>
            `Expected to find 1 common item in the group: ${[...set]}`,
        })
      )
    ),
    Effect.map(set => [...set][0])
  )

export const program = InputProvider.pipe(
  Effect.flatMap(inputProvider =>
    inputProvider.get(new URL('../part1/input.txt', import.meta.url))
  ),
  Effect.flatMap(lines => Effect.all(lines.map(l => parseLine(l)))),
  Effect.map(toGroups),
  Effect.flatMap(groups => Effect.all(groups.map(findCommonItemType))),
  Effect.map(errorItems =>
    pipe(
      errorItems.map(item => itemToPriority[item]),
      Number.sumAll
    )
  )
)
