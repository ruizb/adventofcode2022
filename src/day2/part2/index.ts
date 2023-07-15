import { Effect, List, Tuple, pipe } from 'effect'
import { parseFile, parseFileLines } from '../../common/index.js'
import {
  EncryptedShape,
  StandardShape,
  computeFinalScore,
  parseLine,
} from '../part1/index.js'

enum EncryptedOutcome {
  Loss = 'X',
  Draw = 'Y',
  Win = 'Z',
}

const shapePrediction = {
  [StandardShape.Rock]: {
    [EncryptedOutcome.Loss]: EncryptedShape.Scissors,
    [EncryptedOutcome.Draw]: EncryptedShape.Rock,
    [EncryptedOutcome.Win]: EncryptedShape.Paper,
  },
  [StandardShape.Paper]: {
    [EncryptedOutcome.Loss]: EncryptedShape.Rock,
    [EncryptedOutcome.Draw]: EncryptedShape.Paper,
    [EncryptedOutcome.Win]: EncryptedShape.Scissors,
  },
  [StandardShape.Scissors]: {
    [EncryptedOutcome.Loss]: EncryptedShape.Paper,
    [EncryptedOutcome.Draw]: EncryptedShape.Scissors,
    [EncryptedOutcome.Win]: EncryptedShape.Rock,
  },
} satisfies Record<StandardShape, Record<EncryptedOutcome, EncryptedShape>>

const parsePair = (
  pair: [string, string]
): Effect.Effect<never, string, [StandardShape, EncryptedOutcome]> => {
  return pipe(
    pair,
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
      onSecond: rawOutcome =>
        pipe(
          Effect.succeed(rawOutcome),
          Effect.filterOrFail(
            (outcome): outcome is EncryptedOutcome =>
              Object.values(EncryptedOutcome).includes(outcome as any),
            outcome => `Unknown encrypted outcome: ${outcome}`
          )
        ),
    }),
    _ => Effect.all(_)
  )
}

const parseStrategyGuide = (
  fileContents: string
): Effect.Effect<never, string, List.List<[StandardShape, EncryptedOutcome]>> =>
  pipe(
    Effect.succeed(fileContents),
    Effect.map(parseFileLines),
    Effect.flatMap(lines =>
      pipe(
        lines,
        List.map(line => pipe(line, parseLine, Effect.flatMap(parsePair))),
        _ => Effect.all(_),
        Effect.map(List.fromIterable)
      )
    )
  )

const toOldStrategyGuide = (
  pairs: List.List<[StandardShape, EncryptedOutcome]>
): List.List<[StandardShape, EncryptedShape]> =>
  pipe(
    pairs,
    List.map(([shape, outcome]) => [shape, shapePrediction[shape][outcome]])
  )

export const program = pipe(
  new URL('../part1/input.txt', import.meta.url),
  parseFile,
  Effect.flatMap(parseStrategyGuide),
  Effect.map(toOldStrategyGuide),
  Effect.map(computeFinalScore)
)
