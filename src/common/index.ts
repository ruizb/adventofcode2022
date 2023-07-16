import { promises as fs } from 'node:fs'
import { Context, Effect, List } from 'effect'

class FileError extends Error {
  readonly _tag = 'FileError'
}

export interface InputProvider {
  readonly get: (filepath: URL) => Effect.Effect<never, FileError, string[]>
}

export const InputProvider = Context.Tag<InputProvider>()

const readFile = (filepath: URL): Effect.Effect<never, FileError, string> =>
  Effect.tryPromise(() => fs.readFile(filepath, 'utf-8')).pipe(
    Effect.mapError(
      cause =>
        new FileError(`Error when reading file: ${filepath.toJSON()}`, {
          cause,
        })
    )
  )

export const InputProviderLive = InputProvider.of({
  get: (filepath: URL) => {
    return readFile(filepath).pipe(
      Effect.map(fileContents => fileContents.trimEnd().split('\n'))
    )
  },
})
