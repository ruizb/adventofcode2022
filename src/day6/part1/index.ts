import { Chunk, Effect, Option, Tuple } from 'effect'
import { InputProvider } from '../../common/index.js'

const isMarker = (candidate: Chunk.Chunk<string>): boolean => {
  const [a, b, c, d] = Chunk.toReadonlyArray(candidate)
  return a !== b && a !== c && a !== d && b !== c && b !== d && c !== d
}

const findMarker = (
  input: Chunk.Chunk<string>
): Effect.Effect<never, string, number> => {
  if (Chunk.size(input) < 4) {
    return Effect.fail('Input has less than 4 characters')
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
    const nextCandidate = Chunk.drop(candidate, 1).pipe(Chunk.append(nextChar))
    const nextRemainingChars = Chunk.tail(remainingChars).pipe(
      Option.getOrElse(() => Chunk.empty())
    )
    const nextNthChar = nthChar + 1

    return loop(nextNthChar, nextCandidate, nextRemainingChars)
  }

  const [initialCandidate, initialRemainingChars] = Chunk.splitAt(input, 4)

  return loop(4, initialCandidate, initialRemainingChars)
}

export const program = InputProvider.pipe(
  Effect.flatMap(inputProvider =>
    inputProvider.get(new URL('input.txt', import.meta.url))
  ),
  Effect.map(lines => Chunk.fromIterable(lines[0])),
  Effect.flatMap(findMarker)
)
