import { Chunk, Effect, Number, Option, Tuple, pipe } from 'effect'
import * as S from '@effect/schema/Schema'
import { ParseError } from '@effect/schema/ParseResult'
import { InputProvider } from '../../common/index.js'

const parseLines = (
  lines: Chunk.Chunk<string>
): Chunk.Chunk<Effect.Effect<never, ParseError, number>> =>
  lines.pipe(Chunk.map(line => pipe(line, S.parse(S.NumberFromString))))

const sumCalories = (
  strCalories: Chunk.Chunk<string>
): Effect.Effect<never, ParseError, number> =>
  Effect.all(parseLines(strCalories)).pipe(Effect.map(Number.sumAll))

const toAggregatedCalories = (
  chunks: Chunk.Chunk<string>
): Effect.Effect<never, ParseError, Chunk.Chunk<number>> =>
  chunks.pipe(
    Chunk.splitWhere(line => line === ''),
    Tuple.mapBoth({
      onFirst: head => sumCalories(head).pipe(Effect.map(Chunk.of)),
      onSecond: Chunk.tail, // ignore first element ''
    }),
    ([head, tail]) =>
      Option.match(tail, {
        onNone: () => head,
        onSome: tail =>
          Effect.all([head, toAggregatedCalories(tail)]).pipe(
            Effect.map(([headChunk, tailChunk]) =>
              Chunk.appendAll(headChunk, tailChunk)
            )
          ),
      })
  )

export const regroupCaloriesLines = (
  lines: string[]
): Effect.Effect<never, ParseError, Chunk.Chunk<number>> =>
  Chunk.fromIterable(lines).pipe(toAggregatedCalories)

const getMaxCalories = Chunk.reduce(-Infinity, Number.max)

const computeMaxCalories = (lines: string[]) =>
  regroupCaloriesLines(lines).pipe(Effect.map(getMaxCalories))

export const program = InputProvider.pipe(
  Effect.flatMap(inputProvider =>
    inputProvider.get(new URL('input.txt', import.meta.url))
  ),
  Effect.flatMap(computeMaxCalories)
)
