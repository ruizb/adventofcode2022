import { describe, expect, it } from 'vitest'
import { program } from './index.js'
import { Effect } from 'effect'
import { InputProvider } from '../../common/index.js'

describe('Day X part 1', () => {
  it('should solve example puzzle', () => {
    const runnable = Effect.provideService(
      program,
      InputProvider,
      InputProvider.of({
        get: () => Effect.succeed([]),
      })
    )

    expect(Effect.runSync(runnable)).toEqual(42)
  })
})
