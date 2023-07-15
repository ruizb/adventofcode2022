import { promises as fs } from 'node:fs'
import { Context, Effect, List } from 'effect'

export interface InputProvider {
  readonly get: (filepath: URL) => Effect.Effect<never, unknown, string[]>
}

export const InputProvider = Context.Tag<InputProvider>()

export const InputProviderLive = InputProvider.of({
  get: (filepath: URL) => {
    return Effect.tryPromise(() => fs.readFile(filepath, 'utf-8')).pipe(
      Effect.map(fileContents => fileContents.trimEnd().split('\n'))
    )
  },
})
