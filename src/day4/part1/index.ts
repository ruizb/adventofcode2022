import { Effect, Number, pipe } from 'effect'
import * as S from '@effect/schema/Schema'
import { ParseError } from '@effect/schema/ParseResult'
import { InputProvider } from '../../common/index.js'

export type Pair = S.To<typeof Pair>
type Assignment = S.To<typeof Assignment>

const linePattern = /^\d+-\d+,\d+-\d+$/

const Assignment = S.tuple(S.number, S.number)
const Pair = S.tuple(Assignment, Assignment)

export const parseLine = (
  line: string
): Effect.Effect<never, ParseError, Pair> =>
  pipe(
    line,
    S.parse(
      S.transform(
        S.string.pipe(
          S.filter(line => linePattern.test(line), {
            message: line => `Invalid pattern for line: ${line}`,
          })
        ),
        Pair,
        line => {
          const [rawAssignment1, rawAssignment2] = line.split(',')
          const [start1, end1] = rawAssignment1.split('-')
          const [start2, end2] = rawAssignment2.split('-')
          return [
            [parseInt(start1, 10), parseInt(end1, 10)],
            [parseInt(start2, 10), parseInt(end2, 10)],
          ] as const
        },
        ([assignment1, assignment2]) =>
          `${assignment1.join('-')},${assignment2.join('-')}`
      )
    )
  )

const isAssignmentIncluded = ([[start1, end1], [start2, end2]]: Pair): 0 | 1 =>
  (start1 >= start2 && end1 <= end2) || (start2 >= start1 && end2 <= end1)
    ? 1
    : 0

export const program = InputProvider.pipe(
  Effect.flatMap(inputProvider =>
    inputProvider.get(new URL('input.txt', import.meta.url))
  ),
  Effect.flatMap(lines => Effect.all(lines.map(parseLine))),
  Effect.map(pairs => pairs.map(isAssignmentIncluded)),
  Effect.map(Number.sumAll)
)
