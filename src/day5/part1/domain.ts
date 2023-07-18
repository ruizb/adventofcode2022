import { Chunk, Effect, Option } from 'effect'
import * as S from '@effect/schema/Schema'
import { parseError, type } from '@effect/schema/ParseResult'

export const Crate = S.tuple(
  S.literal('['),
  S.string.pipe(S.length(1)),
  S.literal(']')
)
const Empty = S.tuple(S.literal(' '), S.literal(' '), S.literal(' '))

export const CrateSlot = S.union(Crate, Empty)

export const invalidCrateSlotFailure = (tuple: Chunk.Chunk<string>) =>
  Effect.fail(
    parseError([
      type(
        CrateSlot.ast,
        CrateSlot,
        `Invalid text format for crate slot, got: "${Chunk.join(
          tuple,
          ''
        )}", expected: "[X]" or "   "`
      ),
    ])
  )

export type ParsedStack = Chunk.Chunk<Option.Option<string>>
export type Stack = Chunk.Chunk<string>

const procedureStepPattern = /^move (\d+) from (\d) to (\d)$/

export type ProcedureStep = S.To<typeof ProcedureStep>

export const ProcedureStep = S.transform(
  S.string.pipe(
    S.filter(line => procedureStepPattern.test(line), {
      message: line => `Invalid pattern for line: ${line}`,
    })
  ),
  S.struct({
    quantity: S.number,
    from: S.number,
    to: S.number,
  }),
  line => {
    const [, quantity, from, to] = line.match(
      procedureStepPattern
    ) as RegExpMatchArray

    // Per `procedureStepPattern`, extracted values are valid numbers
    return {
      quantity: parseInt(quantity, 10),
      from: parseInt(from, 10) - 1, // transform stackId into index
      to: parseInt(to, 10) - 1,
    }
  },
  () => 'not implemented'
)
