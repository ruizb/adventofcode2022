import { Chunk, Effect, Number, Option, Tuple, pipe } from 'effect'
import { InputProvider } from '../../common/index.js'

const sumCalories = (strCalories: Chunk.Chunk<string>): Chunk.Chunk<number> => {
  return strCalories.pipe(
    Chunk.map(l => parseInt(l, 10)),
    Number.sumAll,
    Chunk.of
  )
}

const toAggregatedCalories = (
  chunks: Chunk.Chunk<string>
): Chunk.Chunk<number> => {
  const [head, tail] = chunks.pipe(
    Chunk.splitWhere(line => line === ''),
    Tuple.mapBoth({
      onFirst: sumCalories,
      onSecond: Chunk.tail, // ignore first element ''
    })
  )

  return tail.pipe(
    Option.match({
      onNone: () => head,
      onSome: tail => pipe(head, Chunk.appendAll(toAggregatedCalories(tail))),
    })
  )
}

export const regroupCaloriesLines = (lines: string[]): Chunk.Chunk<number> => {
  return Chunk.fromIterable(lines).pipe(toAggregatedCalories)
}

const getMaxCalories = Chunk.reduce(-1, Number.max)

const computeMaxCalories = (lines: string[]) => {
  return pipe(lines, regroupCaloriesLines, getMaxCalories)
}

export const program = InputProvider.pipe(
  Effect.flatMap(inputProvider =>
    inputProvider.get(new URL('input.txt', import.meta.url))
  ),
  Effect.map(computeMaxCalories)
)
