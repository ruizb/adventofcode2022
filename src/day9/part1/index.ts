import { Chunk, Effect, Struct } from 'effect'
import * as S from '@effect/schema/Schema'
import { InputProvider } from '../../common/index.js'
import {
  Coord,
  Direction,
  Motion,
  Position,
  Rope,
  decodeCoord,
} from './domain.js'

const initialRope: Rope = {
  head: { x: 0, y: 0 },
  tail: { x: 0, y: 0 },
}

const moveHead = (head: Coord, direction: Direction): Coord =>
  Struct.evolve(head, {
    x: x =>
      direction === Direction.Left
        ? x - 1
        : direction === Direction.Right
        ? x + 1
        : x,
    y: y =>
      direction === Direction.Up
        ? y + 1
        : direction === Direction.Down
        ? y - 1
        : y,
  })

const moveTail = (head: Coord, headBeforeMotion: Coord, tail: Coord): Coord => {
  const headIsAdjacent =
    head.x >= tail.x - 1 &&
    head.x <= tail.x + 1 &&
    head.y >= tail.y - 1 &&
    head.y <= tail.y + 1

  return headIsAdjacent ? tail : headBeforeMotion
}

const moveRope = (rope: Rope, direction: Direction): Rope => {
  const newHead = moveHead(rope.head, direction)
  return {
    head: newHead,
    tail: moveTail(newHead, rope.head, rope.tail),
  }
}

const processMotionSeries = (
  result: { rope: Rope; visitedPositions: Set<Position> },
  direction: Direction
) => {
  const nextRope = moveRope(result.rope, direction)
  // this line mutates the Set
  const nextVisitedPositions = result.visitedPositions.add(
    decodeCoord(nextRope.tail)
  )
  return { rope: nextRope, visitedPositions: nextVisitedPositions }
}

const initialResult = {
  rope: initialRope,
  visitedPositions: new Set<Position>(['0:0' as const]),
}

export const program = InputProvider.pipe(
  Effect.flatMap(inputProvider =>
    inputProvider.get(new URL('input.txt', import.meta.url))
  ),
  Effect.map(Chunk.fromIterable),
  Effect.flatMap(lines =>
    Effect.all(Chunk.map(lines, _ => S.parse(Motion)(_)))
  ),
  Effect.map(_ => Chunk.fromIterable(_).pipe(Chunk.flatten)),
  Effect.map(Chunk.reduce(initialResult, processMotionSeries)),
  Effect.map(({ visitedPositions }) => visitedPositions.size)
)
