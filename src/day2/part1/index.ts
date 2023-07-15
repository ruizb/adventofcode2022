import { Effect, List, Number, String, Tuple, pipe } from 'effect'
import { parseFile, parseFileLines } from '../../common/index.js'

export enum StandardShape {
  Rock = 'A',
  Paper = 'B',
  Scissors = 'C',
}

export enum EncryptedShape {
  Rock = 'X',
  Paper = 'Y',
  Scissors = 'Z',
}

enum Outcome {
  Win,
  Draw,
  Loss,
}

const shapeScore = {
  [EncryptedShape.Rock]: 1,
  [EncryptedShape.Paper]: 2,
  [EncryptedShape.Scissors]: 3,
} satisfies Record<EncryptedShape, number>

const outcomeScore = {
  [Outcome.Win]: 6,
  [Outcome.Draw]: 3,
  [Outcome.Loss]: 0,
} satisfies Record<Outcome, number>

const scoresMatrix = {
  [StandardShape.Rock]: {
    [EncryptedShape.Rock]: Outcome.Draw,
    [EncryptedShape.Paper]: Outcome.Win,
    [EncryptedShape.Scissors]: Outcome.Loss,
  },
  [StandardShape.Paper]: {
    [EncryptedShape.Rock]: Outcome.Loss,
    [EncryptedShape.Paper]: Outcome.Draw,
    [EncryptedShape.Scissors]: Outcome.Win,
  },
  [StandardShape.Scissors]: {
    [EncryptedShape.Rock]: Outcome.Win,
    [EncryptedShape.Paper]: Outcome.Loss,
    [EncryptedShape.Scissors]: Outcome.Draw,
  },
} satisfies Record<StandardShape, Record<EncryptedShape, Outcome>>

export const parseLine = (
  line: string
): Effect.Effect<never, string, [string, string]> => {
  return pipe(
    Effect.succeed(line),
    Effect.map(String.split(' ')),
    Effect.filterOrFail(
      (elements): elements is [string, string] => elements.length === 2,
      elements => `More than 2 elements on the same line: ${elements}`
    )
  )
}

const parseShapesPair = (
  shapesPair: [string, string]
): Effect.Effect<never, string, [StandardShape, EncryptedShape]> => {
  return pipe(
    shapesPair,
    Tuple.mapBoth({
      onFirst: rawShape =>
        pipe(
          Effect.succeed(rawShape),
          Effect.filterOrFail(
            (shape): shape is StandardShape =>
              Object.values(StandardShape).includes(shape as any),
            shape => `Unknown standard shape: ${shape}`
          )
        ),
      onSecond: rawShape =>
        pipe(
          Effect.succeed(rawShape),
          Effect.filterOrFail(
            (shape): shape is EncryptedShape =>
              Object.values(EncryptedShape).includes(shape as any),
            shape => `Unknown encrypted shape: ${shape}`
          )
        ),
    }),
    _ => Effect.all(_)
  )
}

const parseStrategyGuide = (
  fileContents: string
): Effect.Effect<never, string, List.List<[StandardShape, EncryptedShape]>> =>
  pipe(
    Effect.succeed(fileContents),
    Effect.map(parseFileLines),
    Effect.flatMap(lines =>
      pipe(
        lines,
        List.map(line =>
          pipe(line, parseLine, Effect.flatMap(parseShapesPair))
        ),
        _ => Effect.all(_),
        Effect.map(List.fromIterable)
      )
    )
  )

const computeScore = ([standard, encrypted]: [
  StandardShape,
  EncryptedShape,
]): number => {
  const outcome = scoresMatrix[standard][encrypted]
  return outcomeScore[outcome] + shapeScore[encrypted]
}

export const computeFinalScore = (
  strategyGuide: List.List<[StandardShape, EncryptedShape]>
): number => pipe(strategyGuide, List.map(computeScore), Number.sumAll)

export const program = pipe(
  new URL('input.txt', import.meta.url),
  parseFile,
  Effect.flatMap(parseStrategyGuide),
  Effect.map(computeFinalScore)
)
