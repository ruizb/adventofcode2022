import { Effect, pipe } from 'effect'
import { program as part1Program } from './part1/index.js'
import { program as part2Program } from './part2/index.js'
import { InputProvider, InputProviderLive } from '../common/index.js'

const program = pipe(
  Effect.log('Day 8'),
  Effect.flatMap(() =>
    part1Program.pipe(
      Effect.provideService(InputProvider, InputProviderLive),
      Effect.flatMap(result => Effect.log(`Part 1: ${result}`))
    )
  ),
  Effect.flatMap(() =>
    part2Program.pipe(
      Effect.provideService(InputProvider, InputProviderLive),
      Effect.flatMap(result => Effect.log(`Part 2: ${result}`))
    )
  )
)

await Effect.runPromise(program)
