import { Effect, Tuple } from 'effect'
import * as S from '@effect/schema/Schema'
import { ParseError } from '@effect/schema/ParseResult'
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
): Effect.Effect<never, ParseError, [StandardShape, EncryptedOutcome]> =>
  Effect.all(
    Tuple.mapBoth(pair, {
      onFirst: S.parse(S.enums(StandardShape)),
      onSecond: S.parse(S.enums(EncryptedOutcome)),
    })
  )

const parseStrategyGuide = (
  lines: string[]
): Effect.Effect<never, ParseError, [StandardShape, EncryptedOutcome][]> =>
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
