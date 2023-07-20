import { describe, expect, it } from 'vitest'
import { program } from './index.js'
import { Effect } from 'effect'
import { InputProvider } from '../../common/index.js'
import { expectParseError } from '../../../test/util.js'

describe('Day 7 part 1', () => {
  it('should solve example puzzle', () => {
    const runnable = Effect.provideService(
      program,
      InputProvider,
      InputProvider.of({
        get: () =>
          Effect.succeed([
            '$ cd /',
            '$ ls',
            'dir a',
            '14848514 b.txt',
            '8504156 c.dat',
            'dir d',
            '$ cd a',
            '$ ls',
            'dir e',
            '29116 f',
            '2557 g',
            '62596 h.lst',
            '$ cd e',
            '$ ls',
            '584 i',
            '$ cd ..',
            '$ cd ..',
            '$ cd d',
            '$ ls',
            '4060174 j',
            '8033020 d.log',
            '5626152 d.ext',
            '7214296 k',
          ]),
      })
    )

    expect(Effect.runSync(runnable)).toEqual(95437)
  })

  it('should detect invalid command', () => {
    const runnable = Effect.provideService(
      program,
      InputProvider,
      InputProvider.of({
        get: () =>
          Effect.succeed([
            '$ cd /',
            '$ ls',
            'dir a',
            '14848514 b.txt',
            '8504156 c.dat',
            '$ pwd',
          ]),
      })
    )

    expectParseError(runnable, 'Expected "$ cd" or "$ ls", actual "$ pwd"')
  })

  it('should detect invalid ls output', () => {
    const runnable = Effect.provideService(
      program,
      InputProvider,
      InputProvider.of({
        get: () =>
          Effect.succeed([
            '$ cd /',
            '$ ls',
            'dir a',
            '14848514 b.txt',
            '8504156 c.dat',
            'foo bar',
          ]),
      })
    )

    expectParseError(
      runnable,
      'Expected a string matching the pattern ^dir (.+)$ or a string matching the pattern ^(\\d+) (.+)$, actual "foo bar"'
    )
  })
})
