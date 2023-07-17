import { Chunk, Effect, Option, Tuple } from 'effect'
import * as S from '@effect/schema/Schema'
import { ParseResult } from '@effect/schema/ParseResult'
import { InputProvider } from '../../common/index.js'

type ProcedureStep = S.To<typeof ProcedureStep>

const ProcedureStep = S.struct({
  quantity: S.number,
  from: S.number,
  to: S.number,
})

const procedureStepPattern = /^move (\d+) from (\d) to (\d)$/

const ProcedureStepSchema = S.transform(
  S.string.pipe(
    S.filter(line => procedureStepPattern.test(line), {
      message: line => `Invalid pattern for line: ${line}`,
    })
  ),
  ProcedureStep,
  line => {
    const [, quantity, from, to] = line.match(
      procedureStepPattern
    ) as RegExpMatchArray

    // Assumption: extracted values are valid numbers
    return {
      quantity: parseInt(quantity, 10),
      from: parseInt(from, 10) - 1, // transform stackId into index
      to: parseInt(to, 10) - 1,
    }
  },
  () => 'not implemented'
)

const splitInput = (
  lines: string[]
): [crates: Chunk.Chunk<string>, procedure: Chunk.Chunk<string>] =>
  Chunk.fromIterable(lines).pipe(
    Chunk.splitWhere(line => line === ''),
    Tuple.mapSecond(lines =>
      Chunk.tail(lines).pipe(Option.getOrElse(() => Chunk.empty<string>()))
    )
  )

// Assumption: crates are composed of 3 characters: "[x]", where "x" can be any A-Z letter
const parseStackLine = (line: string): Chunk.Chunk<Option.Option<string>> => {
  const loop = (
    result: Chunk.Chunk<Option.Option<string>>,
    state: Chunk.Chunk<string>
  ): Chunk.Chunk<Option.Option<string>> => {
    if (Chunk.isEmpty(state)) {
      return result
    }

    const [crate, nextState] = state.pipe(
      Chunk.splitAt(3),
      Tuple.mapBoth({
        onFirst: ([_, crateId]) =>
          crateId === ' ' ? Option.none() : Option.some(crateId),
        onSecond: Chunk.drop(1),
      })
    )

    return loop(Chunk.append(result, crate), nextState)
  }

  return loop(Chunk.empty<Option.Option<string>>(), Chunk.fromIterable(line))
}

// Assumption: stacks are sorted ASC horizontally (i.e. " 1   2   3 ...")
// Assumption: stackLines contains at least 2 lines
const setupStacks = (
  stackLines: Chunk.Chunk<Chunk.Chunk<Option.Option<string>>>
) => {
  const loop = (
    result: Chunk.Chunk<Chunk.Chunk<string>>,
    state: Chunk.Chunk<Chunk.Chunk<Option.Option<string>>>
  ): Chunk.Chunk<Chunk.Chunk<string>> => {
    if (Chunk.isEmpty(state)) {
      return result
    }

    const nextResult = Chunk.reduce(
      Chunk.unsafeHead(state),
      result,
      (accResult, crate, index) =>
        Option.match(crate, {
          onNone: () => accResult,
          onSome: crateId =>
            Chunk.modify(accResult, index, Chunk.prepend(crateId)),
        })
    )

    const nextState = Chunk.tail(state).pipe(
      Option.getOrElse(() => Chunk.empty())
    )

    return loop(nextResult, nextState)
  }

  // remove the line with stack IDs
  const initialState = Chunk.dropRight(stackLines, 1)

  const initialResult = Chunk.makeBy(
    Chunk.size(Chunk.unsafeHead(initialState)),
    () => Chunk.empty<string>()
  )

  return loop(initialResult, initialState)
}

const parseProcedureLine = (line: string): ParseResult<ProcedureStep> =>
  S.parse(ProcedureStepSchema)(line)

const applyProcedureStep = (
  stacks: Chunk.Chunk<Chunk.Chunk<string>>,
  step: ProcedureStep
): Chunk.Chunk<Chunk.Chunk<string>> => {
  const fromStack = Chunk.unsafeGet(stacks, step.from)
  const toStack = Chunk.unsafeGet(stacks, step.to)

  const cratesToMove = Chunk.takeRight(fromStack, step.quantity)
  const nextFromStack = Chunk.dropRight(fromStack, step.quantity)
  const nextToStack = Chunk.appendAll(toStack, Chunk.reverse(cratesToMove))

  return Chunk.modify(stacks, step.from, () => nextFromStack).pipe(
    Chunk.modify(step.to, () => nextToStack)
  )
}

const getTopCratesMessage = (
  stacks: Chunk.Chunk<Chunk.Chunk<string>>
): string =>
  Chunk.map(stacks, Chunk.last).pipe(
    Chunk.map(Option.getOrElse(() => '')),
    Chunk.join('')
  )

export const program = InputProvider.pipe(
  Effect.flatMap(inputProvider =>
    inputProvider.get(new URL('input.txt', import.meta.url))
  ),
  Effect.map(splitInput),
  Effect.flatMap(input =>
    Effect.all(
      Tuple.mapBoth(input, {
        onFirst: lines =>
          Chunk.map(lines, parseStackLine)
            .pipe(setupStacks)
            .pipe(Effect.succeed),
        onSecond: lines => Effect.all(Chunk.map(lines, parseProcedureLine)),
      })
    )
  ),
  Effect.map(([stacks, procedureSteps]) =>
    Chunk.fromIterable(procedureSteps).pipe(
      Chunk.reduce(stacks, applyProcedureStep)
    )
  ),
  Effect.map(getTopCratesMessage)
)
