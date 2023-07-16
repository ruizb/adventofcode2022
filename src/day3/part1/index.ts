import { Chunk, Effect, Number, Tuple, pipe } from 'effect'
import * as S from '@effect/schema/Schema'
import { ParseError } from '@effect/schema/ParseResult'
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

const validLineSchema = S.string.pipe(
  S.filter(line => linePattern.test(line), {
    message: line => `Line has an invalid character: ${line}`,
  }),
  S.filter(line => line.length % 2 === 0, {
    message: line => `Line must have an even number of characters: ${line}`,
  })
)

export const parseLine = S.parse(validLineSchema)

const parseRucksack = (
  line: string
): Effect.Effect<never, ParseError, Rucksack> =>
  parseLine(line).pipe(
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
  ParseError,
  string
> =>
  Chunk.intersection(
    Chunk.fromIterable(compartment1),
    Chunk.fromIterable(compartment2)
  ).pipe(
    // A compartment may contain multiple occurrences of the same error item
    Chunk.toReadonlyArray,
    S.parse(
      S.readonlySet(S.string).pipe(
        S.filter(set => set.size === 1, {
          message: set => `Expected to find 1 error item: ${[...set]}`,
        })
      )
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
