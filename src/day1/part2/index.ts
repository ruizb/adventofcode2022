import { Chunk, Effect, Number, Order, pipe } from 'effect'
import { InputProvider } from '../../common/index.js'
import { regroupCaloriesLines } from '../part1/index.js'

const numberDescOrder = Order.reverse(Number.Order)

const getTop3Values = (chunks: Chunk.Chunk<number>): Chunk.Chunk<number> => {
  return chunks.pipe(Chunk.sort(numberDescOrder), Chunk.take(3))
}

const computeTop3MaxCalories = (lines: string[]) => {
  return regroupCaloriesLines(lines).pipe(getTop3Values)
}

export const program = InputProvider.pipe(
  Effect.flatMap(inputProvider =>
    inputProvider.get(new URL('input.txt', import.meta.url))
  ),
  Effect.map(computeTop3MaxCalories),
  Effect.map(Number.sumAll)
)
