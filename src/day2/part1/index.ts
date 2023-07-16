import { Effect, List, Number, String, Tuple } from 'effect'
import * as S from '@effect/schema/Schema'
import { ParseError } from '@effect/schema/ParseResult'
import { InputProvider } from '../../common/index.js'

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
): Effect.Effect<never, ParseError, [string, string]> =>
  Effect.succeed(line).pipe(
    Effect.map(String.split(' ')),
    Effect.flatMap(S.parse(S.array(S.string).pipe(S.itemsCount(2)))),
    Effect.map(items => items as [string, string]) // itemsCount(2) gives `readonly string[]` instead of `readonly [string, string]`
  )

const parseShapesPair = (
  shapesPair: [string, string]
): Effect.Effect<never, ParseError, [StandardShape, EncryptedShape]> =>
  Effect.all(
    Tuple.mapBoth(shapesPair, {
      onFirst: S.parse(S.enums(StandardShape)),
      onSecond: S.parse(S.enums(EncryptedShape)),
    })
  )

const parseStrategyGuide = (
  lines: string[]
): Effect.Effect<never, ParseError, [StandardShape, EncryptedShape][]> =>
  Effect.succeed(lines).pipe(
    Effect.flatMap(lines =>
      Effect.all(
        lines.map(line => parseLine(line).pipe(Effect.flatMap(parseShapesPair)))
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
  strategyGuide: [StandardShape, EncryptedShape][]
): number =>
  List.fromIterable(strategyGuide).pipe(List.map(computeScore), Number.sumAll)

export const program = InputProvider.pipe(
  Effect.flatMap(inputProvider =>
    inputProvider.get(new URL('input.txt', import.meta.url))
  ),
  Effect.flatMap(parseStrategyGuide),
  Effect.map(computeFinalScore)
)
