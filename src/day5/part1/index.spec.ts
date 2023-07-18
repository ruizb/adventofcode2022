import { describe, expect, it } from 'vitest'
import { program } from './index.js'
import { Effect } from 'effect'
import { InputProvider } from '../../common/index.js'
import { expectParseError } from '../../../test/util.js'

describe('Day 5 part 1', () => {
  it('should solve example puzzle', () => {
    const runnable = Effect.provideService(
      program,
      InputProvider,
      InputProvider.of({
        get: () =>
          Effect.succeed([
            '    [D]    ',
            '[N] [C]    ',
            '[Z] [M] [P]',
            ' 1   2   3 ',
            '',
            'move 1 from 2 to 1',
            'move 3 from 1 to 3',
            'move 2 from 2 to 1',
            'move 1 from 1 to 2',
          ]),
      })
    )

    expect(Effect.runSync(runnable)).toEqual('CMZ')
  })

  it('should detect invalid crate', () => {
    const runnable = Effect.provideService(
      program,
      InputProvider,
      InputProvider.of({
        get: () =>
          Effect.succeed([
            '    [D]    ',
            '[N] [Cx]    ',
            '[Z] [M] [P]',
            ' 1   2   3 ',
            '',
            'move 1 from 2 to 1',
          ]),
      })
    )

    expectParseError(
      runnable,
      'Invalid text format for crate slot, got: "[Cx", expected: "[X]" or "   "'
    )
  })

  it('should detect invalid procedure line', () => {
    const runnable = Effect.provideService(
      program,
      InputProvider,
      InputProvider.of({
        get: () =>
          Effect.succeed([
            '    [D]    ',
            '[N] [C]    ',
            '[Z] [M] [P]',
            ' 1   2   3 ',
            '',
            'move 1 from 2 to 1',
            'foobar',
          ]),
      })
    )

    expectParseError(runnable, 'Invalid pattern for line: foobar')
  })
})
