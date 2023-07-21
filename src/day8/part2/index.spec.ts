import { describe, expect, it } from 'vitest'
import { program } from './index.js'
import { Effect } from 'effect'
import { InputProvider } from '../../common/index.js'

describe('Day 8 part 2', () => {
  it('should solve example puzzle', () => {
    const runnable = Effect.provideService(
      program,
      InputProvider,
      InputProvider.of({
        get: () =>
          Effect.succeed(['30373', '25512', '65332', '33549', '35390']),
      })
    )

    expect(Effect.runSync(runnable)).toEqual(8)
  })
})
