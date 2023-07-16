import { describe, expect, it } from 'vitest'
import { program } from './index.js'
import { Effect } from 'effect'
import { InputProvider } from '../../common/index.js'
import { expectParseError } from '../../../test/util.js'

describe('Day 4 part 2', () => {
  it('should solve example puzzle', () => {
    const runnable = Effect.provideService(
      program,
      InputProvider,
      InputProvider.of({
        get: () =>
          Effect.succeed([
            '2-4,6-8',
            '2-3,4-5',
            '5-7,7-9',
            '2-8,3-7',
            '6-6,4-6',
            '2-6,4-8',
          ]),
      })
    )

    expect(Effect.runSync(runnable)).toEqual(4)
  })
})
