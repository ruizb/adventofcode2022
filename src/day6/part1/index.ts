import { Chunk, Effect, Option, Tuple } from 'effect'
import { InputProvider } from '../../common/index.js'

const isMarker = (candidate: Chunk.Chunk<string>): boolean => {
  const uniqueItems = new Set(Chunk.toReadonlyArray(candidate))
  return Chunk.size(candidate) === uniqueItems.size
}

export const findMarker =
  (distinctCharsCount: number) =>
  (input: Chunk.Chunk<string>): Effect.Effect<never, string, number> => {
    if (Chunk.size(input) < distinctCharsCount) {
      return Effect.fail(`Input has less than ${distinctCharsCount} characters`)
    }

    const loop = (
      nthChar: number,
      candidate: Chunk.Chunk<string>,
      remainingChars: Chunk.Chunk<string>
    ): Effect.Effect<never, string, number> => {
      if (isMarker(candidate)) {
        return Effect.succeed(nthChar)
      }

      if (Chunk.isEmpty(remainingChars)) {
        return Effect.fail('Could not find marker')
      }

      const nextChar = Chunk.headNonEmpty(
        remainingChars as Chunk.NonEmptyChunk<string>
      )
      const nextCandidate = Chunk.drop(candidate, 1).pipe(
        Chunk.append(nextChar)
      )
      const nextRemainingChars = Chunk.tail(remainingChars).pipe(
        Option.getOrElse(() => Chunk.empty())
      )
      const nextNthChar = nthChar + 1

      return loop(nextNthChar, nextCandidate, nextRemainingChars)
    }

    const [initialCandidate, initialRemainingChars] = Chunk.splitAt(
      input,
      distinctCharsCount
    )

    return loop(distinctCharsCount, initialCandidate, initialRemainingChars)
  }

export const program = InputProvider.pipe(
  Effect.flatMap(inputProvider =>
    inputProvider.get(new URL('input.txt', import.meta.url))
  ),
  Effect.map(Chunk.fromIterable),
  Effect.filterOrFail(
    Chunk.isNonEmpty,
    lines => `Expected input to have 1 line, got: ${Chunk.size(lines)}`
  ),
  Effect.map(Chunk.headNonEmpty),
  Effect.map(Chunk.fromIterable), // get list of characters
  Effect.flatMap(findMarker(4))
)
