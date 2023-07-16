import { Effect } from 'effect'
import { InputProvider } from '../../common/index.js'

export const program = InputProvider.pipe(
  Effect.flatMap(inputProvider =>
    inputProvider.get(new URL('input.txt', import.meta.url))
  ),
  Effect.map(() => 42)
)
