import { Effect } from 'effect'
import { InputProvider } from '../../common/index.js'

export const program = InputProvider.pipe(
  Effect.flatMap(inputProvider =>
    inputProvider.get(new URL('../part1/input.txt', import.meta.url))
  ),
  Effect.flatMap(() => Effect.log('ok'))
)
