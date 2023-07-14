import { Chunk, Effect, Number, Order, pipe } from 'effect'
import { parseFile, parseFileLines } from '../../common/index.js'
import { regroupCaloriesLines } from '../part1/index.js'

const numberDescOrder = Order.reverse(Number.Order)

const getTop3Values = (chunks: Chunk.Chunk<number>): Chunk.Chunk<number> => {
  return pipe(chunks, Chunk.sort(numberDescOrder), Chunk.take(3))
}

export const computeTop3MaxCalories = (fileContents: string) => {
  return pipe(fileContents, parseFileLines, regroupCaloriesLines, getTop3Values)
}

export const program = pipe(
  new URL('../part1/input.txt', import.meta.url),
  parseFile,
  Effect.map(computeTop3MaxCalories),
  Effect.map(Number.sumAll)
)
