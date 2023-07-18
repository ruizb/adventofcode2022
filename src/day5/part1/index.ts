import { Chunk, Effect, Option, Tuple, pipe } from 'effect'
import * as S from '@effect/schema/Schema'
import { ParseResult } from '@effect/schema/ParseResult'
import { InputProvider } from '../../common/index.js'
import {
  Crate,
  CrateSlot,
  ParsedStack,
  ProcedureStep,
  Stack,
  invalidCrateSlotFailure,
} from './domain.js'

const splitInput = (
  lines: string[]
): [crates: Chunk.Chunk<string>, procedure: Chunk.Chunk<string>] =>
  Chunk.fromIterable(lines).pipe(
    Chunk.splitWhere(line => line === ''),
    Tuple.mapSecond(lines =>
      Chunk.tail(lines).pipe(Option.getOrElse(() => Chunk.empty<string>()))
    )
  )

const parseStackLine = (line: string): ParseResult<ParsedStack> => {
  const loop = (
    result: ParseResult<ParsedStack>,
    state: Chunk.Chunk<string>
  ): ParseResult<ParsedStack> => {
    if (Chunk.isEmpty(state)) {
      return result
    }

    const [crate, nextState] = state.pipe(
      Chunk.splitAt(3),
      Tuple.mapBoth({
        onFirst: tuple =>
          pipe(
            Chunk.toReadonlyArray(tuple),
            S.parse(CrateSlot),
            Effect.orElse(() => invalidCrateSlotFailure(tuple)),
            Effect.map(crateSlot =>
              S.is(Crate)(crateSlot)
                ? Option.some(crateSlot[1])
                : Option.none<string>()
            )
          ),
        onSecond: Chunk.drop(1),
      })
    )

    return Effect.flatMap(crate, crate =>
      loop(Effect.map(result, Chunk.append(crate)), nextState)
    )
  }

  return loop(
    Effect.succeed(Chunk.empty<Option.Option<string>>()),
    Chunk.fromIterable(line)
  )
}

const getChunkOrEmpty: <A>(
  chunk: Option.Option<Chunk.Chunk<A>>
) => Chunk.Chunk<A> = Option.getOrElse(() => Chunk.empty())

// Assumption: stacks are sorted ASC horizontally, 1-9 (i.e. " 1   2   3 ...")
const setupStacks = (
  stackLines: Chunk.Chunk<ParsedStack>
): Chunk.Chunk<Stack> => {
  const loop = (
    result: Chunk.Chunk<Stack>,
    state: Chunk.Chunk<ParsedStack>
  ): Chunk.Chunk<Stack> => {
    if (Chunk.isEmpty(state)) {
      return result
    }

    const nextResult = Chunk.reduce(
      Chunk.head(state).pipe(getChunkOrEmpty),
      result,
      (stack, crateOrEmptySlot, index) =>
        Option.match(crateOrEmptySlot, {
          onNone: () => stack,
          onSome: crateId => Chunk.modify(stack, index, Chunk.prepend(crateId)),
        })
    )

    const nextState = Chunk.tail(state).pipe(getChunkOrEmpty)

    return loop(nextResult, nextState)
  }

  const initialState = stackLines

  const initialResult = Chunk.makeBy(
    Chunk.size(Chunk.head(initialState).pipe(getChunkOrEmpty)),
    () => Chunk.empty<string>()
  )

  return loop(initialResult, initialState)
}

const parseProcedureLine = (line: string): ParseResult<ProcedureStep> =>
  S.parse(ProcedureStep)(line)

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

const getTopCratesMessage = (stacks: Chunk.Chunk<Stack>): string =>
  Chunk.map(stacks, Chunk.last).pipe(
    Chunk.map(Option.getOrElse(() => '')),
    Chunk.join('')
  )

const setupStacksAndProcedureSteps: (
  input: [crates: Chunk.Chunk<string>, procedure: Chunk.Chunk<string>]
) => [
  ParseResult<Chunk.Chunk<Stack>>,
  ParseResult<Chunk.Chunk<ProcedureStep>>,
] = Tuple.mapBoth({
  onFirst: lines =>
    Effect.all(Chunk.map(Chunk.dropRight(lines, 1), parseStackLine)).pipe(
      Effect.map(Chunk.fromIterable),
      Effect.map(setupStacks)
    ),
  onSecond: lines =>
    Effect.all(Chunk.map(lines, parseProcedureLine)).pipe(
      Effect.map(Chunk.fromIterable)
    ),
})

export const program = InputProvider.pipe(
  Effect.flatMap(inputProvider =>
    inputProvider.get(new URL('input.txt', import.meta.url))
  ),
  Effect.map(splitInput),
  Effect.map(setupStacksAndProcedureSteps),
  Effect.flatMap(_ => Effect.all(_)),
  Effect.map(([stacks, procedureSteps]) =>
    Chunk.reduce(procedureSteps, stacks, applyProcedureStep)
  ),
  Effect.map(getTopCratesMessage)
)
