import { Chunk, Effect } from 'effect'
import * as S from '@effect/schema/Schema'
import { success } from '@effect/schema/ParseResult'

export interface Coord {
  readonly x: number
  readonly y: number
}

export type Position = `${number}:${number}`

export const decodeCoord = ({ x, y }: Coord): Position => `${x}:${y}`

export interface Rope {
  readonly head: Coord
  readonly tail: Coord
}

export enum Direction {
  Up = 'U',
  Right = 'R',
  Down = 'D',
  Left = 'L',
}

const motionPattern = /^(U|L|D|R) (\d+)$/

export const Motion = S.string.pipe(
  S.pattern(motionPattern),
  S.transformResult(
    S.chunkFromSelf(S.enums(Direction)),
    line => {
      const [, rawDirection, rawDistance] = line.match(motionPattern)! // safe because `S.pattern(motionPattern)`
      return Effect.Do.pipe(
        Effect.bind('direction', () =>
          S.parse(S.enums(Direction))(rawDirection)
        ),
        Effect.bind('distance', () => S.parse(S.NumberFromString)(rawDistance)),
        Effect.map(({ direction, distance }) =>
          Chunk.makeBy(distance, () => direction)
        )
      )
    },
    () => success('not implemented')
  )
)
