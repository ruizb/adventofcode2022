import { describe, expect, it } from 'vitest'
import { program } from './index.js'
import { Effect } from 'effect'
import { InputProvider } from '../../common/index.js'

describe('Day 3 part 1', () => {
  it('should solve example puzzle', () => {
    const runnable = Effect.provideService(
      program,
      InputProvider,
      InputProvider.of({
        get: () =>
          Effect.succeed([
            'vJrwpWtwJgWrhcsFMMfFFhFp',
            'jqHRNqRjqzjGDLGLrsFMfFZSrLrFZsSL',
            'PmmdzqPrVvPwwTWBwg',
            'wMqvLMZHhHMvwLHjbvcjnnSBnvTQFn',
            'ttgJtRGJQctTZtZT',
            'CrZsJsPPZsGzwwsLwLmpwMDw',
          ]),
      })
    )

    expect(Effect.runSync(runnable)).toEqual(157)
  })

  it('should detect invalid item', () => {
    const runnable = Effect.provideService(
      program,
      InputProvider,
      InputProvider.of({
        get: () =>
          Effect.succeed([
            'vJrwpWtwJgWrhcsFMMfFFhFp',
            'jqHRNqRjqzjG_DLGLrsFMfFZSrLrFZsSL', // '_' is invalid
            'PmmdzqPrVvPwwTWBwg',
          ]),
      })
    )

    expect(() => Effect.runSync(runnable)).toThrow(
      'Line has an invalid character: jqHRNqRjqzjG_DLGLrsFMfFZSrLrFZsSL'
    )
  })

  it('should detect a line that has an odd number of characters', () => {
    const runnable = Effect.provideService(
      program,
      InputProvider,
      InputProvider.of({
        get: () =>
          Effect.succeed([
            'vJrwpWtwJgWrhcsFMMfFFhFp',
            'jqHRNqRjqzjGDLGLrsFMfFZSrLrjFZsSL', // 1 more item in second compartment
            'PmmdzqPrVvPwwTWBwg',
          ]),
      })
    )

    expect(() => Effect.runSync(runnable)).toThrow(
      'Line must have an even number of characters: jqHRNqRjqzjGDLGLrsFMfFZSrLrjFZsSL'
    )
  })

  it('should detect a line that does not have an error item', () => {
    const runnable = Effect.provideService(
      program,
      InputProvider,
      InputProvider.of({
        get: () =>
          Effect.succeed([
            'vJrwpWtwJgWrhcsFMMfFFhFp',
            'jqHRNqRjqzjGDGrsFMfFZSrrFZsS', // 'L' chars were removed
            'PmmdzqPrVvPwwTWBwg',
          ]),
      })
    )

    expect(() => Effect.runSync(runnable)).toThrow(
      'Expected to find 1 error item: '
    )
  })

  it('should detect a line that has multiple error items', () => {
    const runnable = Effect.provideService(
      program,
      InputProvider,
      InputProvider.of({
        get: () =>
          Effect.succeed([
            'vJrwpWtwJgWrhcsFMMfFFhFp',
            'jjqHRNqRjqzjGDLGLrsFMfFZSrLrjFZsSL', // 'L' and 'j' chars are error items
            'PmmdzqPrVvPwwTWBwg',
          ]),
      })
    )

    expect(() => Effect.runSync(runnable)).toThrow(
      'Expected to find 1 error item: j,L'
    )
  })
})
