import { describe, expect, it } from 'vitest'
import { program } from './index.js'
import { Effect } from 'effect'
import { InputProvider } from '../../common/index.js'

describe('Day 6 part 2', () => {
  it.each([
    ['mjqjpqmgbljsphdztnvjfqwrcgsmlb', 19],
    ['bvwbjplbgvbhsrlpgdmjqwftvncz', 23],
    ['nppdvjthqldpwncqszvftbrmjlhg', 23],
    ['nznrnfrfntjfmvfwmzdfjlvtqnbhcprsg', 29],
    ['zcfzfwzzqfrljwzlrfnpqdbhtmscgvjw', 26],
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
})
