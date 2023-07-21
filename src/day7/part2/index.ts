import { Chunk, Effect, HashMap, Number } from 'effect'
import { InputProvider } from '../../common/index.js'
import { computeTotalSizes } from '../part1/index.js'

const TOTAL_SPACE = 70_000_000
const REQUIRED_UNUSED_SPACE = 30_000_000

const computeAnswer = (totalSizes: HashMap.HashMap<string, number>): number =>
  totalSizes.pipe(
    HashMap.filter(
      Number.greaterThanOrEqualTo(getMinimumSizeToFree(totalSizes))
    ),
    HashMap.values,
    Chunk.fromIterable,
    Chunk.sort(Number.Order),
    Chunk.unsafeHead // there is always at least 1 directory left: '/'
  )

const getUnusedSpace = (totalSizes: HashMap.HashMap<string, number>): number =>
  TOTAL_SPACE - HashMap.unsafeGet(totalSizes, '/')

const getMinimumSizeToFree = (
  totalSizes: HashMap.HashMap<string, number>
): number => REQUIRED_UNUSED_SPACE - getUnusedSpace(totalSizes)

export const program = InputProvider.pipe(
  Effect.flatMap(inputProvider =>
    inputProvider.get(new URL('../part1/input.txt', import.meta.url))
  ),
  Effect.map(Chunk.fromIterable),
  Effect.flatMap(computeTotalSizes),
  Effect.map(computeAnswer)
)
