import { describe, expect, it } from 'vitest'
import { program } from './index.js'
import { Effect } from 'effect'
import { InputProvider } from '../../common/index.js'
import { expectParseError } from '../../../test/util.js'

describe('Day 3 part 2', () => {
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

    expect(Effect.runSync(runnable)).toEqual(70)
  })

  it('should detect a group that has multiple common items', () => {
    const runnable = Effect.provideService(
      program,
      InputProvider,
      InputProvider.of({
        get: () =>
          Effect.succeed([
            'avJrwpWtwJgWrhcsFMMfFFhFpa',
            'ajqHRNqRjqzjGDLGLrsFMfFZSrLrFZsSLa',
            'aPmmdzqPrVvPwwTWBwga',
          ]),
      })
    )

    expectParseError(
      runnable,
      'Expected to find 1 common item in the group: a,r'
    )
  })
})
