import { Chunk, Effect, List, Number, Option, Tuple, pipe } from 'effect'
import { parseFile, parseFileLines } from '../../common/index.js'

const sumCalories = (strCalories: Chunk.Chunk<string>): Chunk.Chunk<number> => {
  return pipe(
    strCalories,
    Chunk.map(l => parseInt(l, 10)),
    Number.sumAll,
    Chunk.of
  )
}

const toAggregatedCalories = (
  chunks: Chunk.Chunk<string>
): Chunk.Chunk<number> => {
  const [head, tail] = pipe(
    chunks,
    Chunk.splitWhere(line => line === ''),
    Tuple.mapBoth({
      onFirst: sumCalories,
      onSecond: Chunk.tail, // ignore first element ''
    })
  )

  return pipe(
    tail,
    Option.match({
      onNone: () => head,
      onSome: tail => pipe(head, Chunk.appendAll(toAggregatedCalories(tail))),
    })
  )
}

export const regroupCaloriesLines = (
  lines: List.List<string>
): Chunk.Chunk<number> => {
  return pipe(lines, List.toChunk, toAggregatedCalories)
}

const getMaxCalories = Chunk.reduce(-1, Number.max)

export const computeMaxCalories = (fileContents: string) => {
  return pipe(
    fileContents,
    parseFileLines,
    regroupCaloriesLines,
    getMaxCalories
  )
}

export const program = pipe(
  new URL('input.txt', import.meta.url),
  parseFile,
  Effect.map(computeMaxCalories)
)
