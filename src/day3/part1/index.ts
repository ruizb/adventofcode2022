import { Chunk, Effect, Number, Tuple, pipe } from 'effect'
import { InputProvider } from '../../common/index.js'

const linePattern = /^[a-zA-Z]+$/

export const itemToPriority = Object.fromEntries(
  Chunk.makeBy(52, i => {
    if (i < 26) {
      return [String.fromCharCode(97 + i), i + 1]
    }
    return [String.fromCharCode(65 + i - 26), i + 1]
  })
)

type Rucksack = [readonly string[], readonly string[]]

export const parseLine = (line: string) =>
  Effect.succeed(line).pipe(
    Effect.filterOrFail(
      line => linePattern.test(line),
      line => `Line has an invalid character: ${line}`
    )
  )

const parseRucksack = (line: string): Effect.Effect<never, string, Rucksack> =>
  parseLine(line).pipe(
    Effect.filterOrFail(
      line => line.length % 2 === 0,
      line => `Line must have an even number of characters: ${line}`
    ),
    Effect.map(line =>
      Chunk.fromIterable(line).pipe(
        Chunk.splitAt(line.length / 2),
        Tuple.mapBoth({
          onFirst: Chunk.toReadonlyArray,
          onSecond: Chunk.toReadonlyArray,
        })
      )
    )
  )

const findErrorItem = ([compartment1, compartment2]: Rucksack): Effect.Effect<
  never,
  string,
  string
> =>
  Chunk.intersection(
    Chunk.fromIterable(compartment1),
    Chunk.fromIterable(compartment2)
  ).pipe(
    // A compartment may contain multiple occurrences of the same error item
    chunk => new Set(Chunk.toReadonlyArray(chunk)),
    Effect.succeed,
    Effect.filterOrFail(
      set => set.size === 1,
      set => `Expected to find 1 error item: ${[...set]}`
    ),
    Effect.map(set => [...set][0])
  )

export const program = InputProvider.pipe(
  Effect.flatMap(inputProvider =>
    inputProvider.get(new URL('input.txt', import.meta.url))
  ),
  Effect.flatMap(lines => Effect.all(lines.map(parseRucksack))),
  Effect.flatMap(rucksacks => Effect.all(rucksacks.map(findErrorItem))),
  Effect.map(errorItems =>
    pipe(
      errorItems.map(item => itemToPriority[item]),
      Number.sumAll
    )
  )
)
