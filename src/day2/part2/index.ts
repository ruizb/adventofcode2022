import { Effect, List, Tuple, pipe } from 'effect'
import { InputProvider } from '../../common/index.js'
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
  lines: string[]
): Effect.Effect<never, string, [StandardShape, EncryptedOutcome][]> =>
  Effect.succeed(lines).pipe(
    Effect.flatMap(lines =>
      Effect.all(
        lines.map(line => parseLine(line).pipe(Effect.flatMap(parsePair)))
      )
    )
  )

const toOldStrategyGuide = (
  pairs: [StandardShape, EncryptedOutcome][]
): [StandardShape, EncryptedShape][] =>
  pairs.map(([shape, outcome]) => [shape, shapePrediction[shape][outcome]])

export const program = InputProvider.pipe(
  Effect.flatMap(inputProvider =>
    inputProvider.get(new URL('input.txt', import.meta.url))
  ),
  Effect.flatMap(parseStrategyGuide),
  Effect.map(toOldStrategyGuide),
  Effect.map(computeFinalScore)
)
