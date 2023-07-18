import { describe, expect, it } from 'vitest'
import { program } from './index.js'
import { Effect } from 'effect'
import { InputProvider } from '../../common/index.js'

describe('Day 6 part 1', () => {
  it.each([
    ['mjqjpqmgbljsphdztnvjfqwrcgsmlb', 7],
    ['bvwbjplbgvbhsrlpgdmjqwftvncz', 5],
    ['nppdvjthqldpwncqszvftbrmjlhg', 6],
    ['nznrnfrfntjfmvfwmzdfjlvtqnbhcprsg', 10],
    ['zcfzfwzzqfrljwzlrfnpqdbhtmscgvjw', 11],
  ] as const)('should solve example puzzles', (puzzle, expectedValue) => {
    const runnable = Effect.provideService(
      program,
      InputProvider,
      InputProvider.of({
        get: () => Effect.succeed([puzzle]),
      })
    )

    expect(Effect.runSync(runnable)).toEqual(expectedValue)
  })

  it('should detect input with less than 4 chars', () => {
    const runnable = Effect.provideService(
      program,
      InputProvider,
      InputProvider.of({
        get: () => Effect.succeed(['abc']),
      })
    )

    expect(() => Effect.runSync(runnable)).toThrow(
      'Input has less than 4 characters'
    )
  })

  it('should detect input without any marker', () => {
    const runnable = Effect.provideService(
      program,
      InputProvider,
      InputProvider.of({
        get: () => Effect.succeed(['abcabcabcabcabc']),
      })
    )

    expect(() => Effect.runSync(runnable)).toThrow('Could not find marker')
  })
})
