import { Chunk, Effect } from 'effect'
import { InputProvider } from '../../common/index.js'
import {
  applyProcedureStep,
  getTopCratesMessage,
  setupStacksAndProcedureSteps,
  splitInput,
} from '../part1/index.js'

export const program = InputProvider.pipe(
  Effect.flatMap(inputProvider =>
    inputProvider.get(new URL('../part1/input.txt', import.meta.url))
  ),
  Effect.map(splitInput),
  Effect.map(setupStacksAndProcedureSteps),
  Effect.flatMap(_ => Effect.all(_)),
  Effect.map(([stacks, procedureSteps]) =>
    Chunk.reduce(procedureSteps, stacks, applyProcedureStep(false))
  ),
  Effect.map(getTopCratesMessage)
)
