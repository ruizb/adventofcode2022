import { describe, expect, it } from 'vitest'
import { program } from './index.js'
import { Effect } from 'effect'
import { InputProvider } from '../../common/index.js'
import { expectParseError } from '../../../test/util.js'

describe('Day 9 part 1', () => {
  it('should solve example puzzle', () => {
    const runnable = Effect.provideService(
      program,
      InputProvider,
      InputProvider.of({
        get: () =>
          Effect.succeed([
            'R 4',
            'U 4',
            'L 3',
            'D 1',
            'R 4',
            'D 1',
            'L 5',
            'R 2',
          ]),
      })
    )

    expect(Effect.runSync(runnable)).toEqual(13)
  })

  it.each(['X 2', 'U X', 'U 2 4'])(
    'should detect invalid motion line',
    errorLine => {
      const runnable = Effect.provideService(
        program,
        InputProvider,
        InputProvider.of({
          get: () => Effect.succeed(['R 4', errorLine, 'U 4']),
        })
      )

      expectParseError(
        runnable,
        `Expected a string matching the pattern ^(U|L|D|R) (\\d+)$, actual "${errorLine}"`
      )
    }
  )
})
