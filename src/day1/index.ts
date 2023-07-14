import { Effect, pipe } from 'effect'
import { program as part1Program } from './part1/index.js'
import { program as part2Program } from './part2/index.js'

const program = pipe(
  Effect.log('Day 1'),
  Effect.flatMap(() =>
    pipe(
      part1Program,
      Effect.flatMap(result => Effect.log(`Part 1: ${result}`))
    )
  ),
  Effect.flatMap(() =>
    pipe(
      part2Program,
      Effect.flatMap(result => Effect.log(`Part 2: ${result}`))
    )
  )
)

await Effect.runPromise(program)
